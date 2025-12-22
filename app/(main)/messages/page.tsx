'use client'

// ===========================
// 메시지 페이지
// ===========================

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/hooks/useAuth'
import { useConversations, useMessages } from '@/hooks/useMessages'
import { ROUTES } from '@/lib/constants'
import { formatRelativeTime, cn } from '@/lib/utils'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const { conversations, isLoading: convLoading } = useConversations(user?.id || null)
  const { messages, isLoading: msgLoading, sendMessage } = useMessages(
    selectedConversationId,
    user?.id || null
  )

  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [authLoading, user, router])

  // 메시지 목록 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (authLoading || convLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="메시지를 불러오는 중..." />
      </div>
    )
  }

  // 선택된 대화의 상대방 정보
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  )
  const otherParticipant = selectedConversation?.participants.find(
    (p) => p.id !== user?.id
  )

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* 대화 목록 */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white',
          selectedConversationId && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">메시지</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>대화가 없습니다</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id)
              const isActive = conv.id === selectedConversationId

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    'w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors',
                    isActive && 'bg-gray-100'
                  )}
                >
                  <Avatar
                    src={other?.profile_image_url}
                    alt={other?.name || '사용자'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {other?.name || '알 수 없음'}
                      </p>
                      {conv.last_message && (
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 truncate">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-gray-50',
          !selectedConversationId && 'hidden md:flex'
        )}
      >
        {selectedConversationId ? (
          <>
            {/* 헤더 */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar
                src={otherParticipant?.profile_image_url}
                alt={otherParticipant?.name || '사용자'}
                size="sm"
              />
              <div>
                <p className="font-medium">{otherParticipant?.name || '알 수 없음'}</p>
              </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgLoading ? (
                <LoadingState message="메시지를 불러오는 중..." />
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  아직 메시지가 없습니다.
                  <br />
                  첫 메시지를 보내보세요!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        isOwn && 'flex-row-reverse'
                      )}
                    >
                      {!isOwn && (
                        <Avatar
                          src={msg.sender?.profile_image_url}
                          alt={msg.sender?.name || '사용자'}
                          size="sm"
                        />
                      )}
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          isOwn
                            ? 'bg-black text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                        )}
                      >
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-xs text-gray-400 mb-1">
                        {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-gray-200"
            >
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || isSending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="대화를 선택하세요"
              description="왼쪽에서 대화를 선택하거나 새 대화를 시작하세요."
            />
          </div>
        )}
      </div>
    </div>
  )
}
