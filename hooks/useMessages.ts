'use client'

// ===========================
// 메시지 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Conversation, Message, MessageType } from '@/types'

type ConversationWithDetails = Conversation & {
  participants: { id: string; name: string; profile_image_url: string | null }[]
  last_message?: { content: string; created_at: string }
  unread_count?: Record<string, number>
}

type MessageWithSender = Omit<Message, 'sender'> & {
  sender: { name: string; profile_image_url: string | null }
}

interface SendMessageOptions {
  content: string
  messageType?: MessageType
  fileUrl?: string
  fileName?: string
}

// 대화 목록 훅
export function useConversations(userId: string | null) {
  const supabase = getSupabaseClient()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      // 각 대화의 참가자 정보와 마지막 메시지 조회
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          // 참가자 정보
          const { data: participants } = await supabase
            .from('users')
            .select('id, name, profile_image_url')
            .in('id', conv.participant_ids)

          // 마지막 메시지
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            participants: participants || [],
            last_message: lastMessage || undefined,
          }
        })
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // 실시간 구독
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, fetchConversations])

  return { conversations, isLoading, refetch: fetchConversations }
}

// 단일 대화의 메시지 훅
export function useMessages(conversationId: string | null, userId: string | null) {
  const supabase = getSupabaseClient()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey (
            name,
            profile_image_url
          )
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages((data as MessageWithSender[]) || [])

      // 읽지 않은 메시지를 읽음 처리
      if (userId) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId)
          .eq('is_read', false)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, conversationId, userId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // 실시간 메시지 구독
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // 새 메시지에 sender 정보 추가
          const { data: sender } = await supabase
            .from('users')
            .select('name, profile_image_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: MessageWithSender = {
            ...payload.new as Message,
            sender: sender || { name: '알 수 없음', profile_image_url: null },
          }

          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationId])

  // 메시지 전송 함수
  const sendMessage = async (options: string | SendMessageOptions) => {
    if (!conversationId || !userId) return

    const messageData = typeof options === 'string'
      ? { content: options, messageType: 'text' as MessageType }
      : options

    if (!messageData.content.trim() && messageData.messageType === 'text') return

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: messageData.content.trim(),
      message_type: messageData.messageType || 'text',
      file_url: messageData.fileUrl || null,
      file_name: messageData.fileName || null,
    })

    if (error) {
      console.error('Failed to send message:', error)
      throw error
    }

    // 대화의 마지막 메시지 시간 업데이트
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
  }

  // 이미지 업로드 함수
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  return { messages, isLoading, sendMessage, uploadImage, refetch: fetchMessages }
}

// 새 대화 시작
export function useStartConversation() {
  const supabase = getSupabaseClient()

  const startConversation = async (
    participantIds: string[],
    projectId?: string
  ): Promise<string> => {
    // 기존 대화 확인
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', participantIds)
      .single()

    if (existing) {
      return existing.id
    }

    // 새 대화 생성
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_ids: participantIds,
        project_id: projectId || null,
      })
      .select()
      .single()

    if (error) throw error

    return data.id
  }

  return { startConversation }
}
