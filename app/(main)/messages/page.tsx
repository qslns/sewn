'use client'

// ===========================
// 메시지 페이지 (실시간 채팅)
// ===========================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { useConversations, useMessages } from '@/hooks/useMessages'
import { ROUTES } from '@/lib/constants'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Check,
  CheckCheck,
} from 'lucide-react'

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const { conversations, isLoading: convLoading } = useConversations(user?.id || null)
  const { messages, isLoading: msgLoading, sendMessage, uploadImage } = useMessages(
    selectedConversationId,
    user?.id || null
  )

  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ file: File; url: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 이미지 선택 핸들러
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 타입 검사
    if (!file.type.startsWith('image/')) {
      showToast('error', '이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 검사 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', '파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setPreviewImage({
      file,
      url: URL.createObjectURL(file),
    })
  }, [showToast])

  // 이미지 프리뷰 취소
  const cancelImagePreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url)
      setPreviewImage(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewImage])

  // 메시지 전송
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !previewImage) || isSending) return

    setIsSending(true)

    try {
      if (previewImage) {
        // 이미지 업로드 후 전송
        setIsUploading(true)
        const imageUrl = await uploadImage(previewImage.file)
        await sendMessage({
          content: newMessage.trim() || '이미지를 보냈습니다',
          messageType: 'image',
          fileUrl: imageUrl,
          fileName: previewImage.file.name,
        })
        cancelImagePreview()
      } else {
        // 텍스트 메시지 전송
        await sendMessage(newMessage)
      }
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
      showToast('error', '메시지 전송에 실패했습니다.')
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
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
              <p className="text-sm mt-2">
                전문가 프로필에서 메시지를 보내보세요
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id)
              const isActive = conv.id === selectedConversationId
              const unreadCount = conv.unread_count?.[user?.id || ''] || 0

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    'w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100',
                    isActive && 'bg-accent-cream'
                  )}
                >
                  <div className="relative">
                    <Avatar
                      src={other?.profile_image_url}
                      alt={other?.name || '사용자'}
                      size="md"
                    />
                    {/* 온라인 상태 표시 */}
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
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
                    <div className="flex items-center justify-between mt-1">
                      {conv.last_message && (
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {conv.last_message.content}
                        </p>
                      )}
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-accent-camel text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
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
              <div className="relative">
                <Avatar
                  src={otherParticipant?.profile_image_url}
                  alt={otherParticipant?.name || '사용자'}
                  size="sm"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{otherParticipant?.name || '알 수 없음'}</p>
                <p className="text-xs text-green-600">온라인</p>
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
                messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id
                  const showAvatar = !isOwn && (
                    idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id
                  )

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        isOwn && 'flex-row-reverse'
                      )}
                    >
                      {!isOwn && showAvatar ? (
                        <Avatar
                          src={msg.sender?.profile_image_url}
                          alt={msg.sender?.name || '사용자'}
                          size="sm"
                        />
                      ) : !isOwn ? (
                        <div className="w-8" />
                      ) : null}

                      <div className={cn('max-w-[70%]', isOwn && 'flex flex-col items-end')}>
                        {/* 이미지 메시지 */}
                        {msg.message_type === 'image' && msg.file_url && (
                          <div
                            className={cn(
                              'rounded-2xl overflow-hidden mb-1',
                              isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
                            )}
                          >
                            <Image
                              src={msg.file_url}
                              alt={msg.file_name || '이미지'}
                              width={300}
                              height={200}
                              className="max-w-full object-cover"
                            />
                          </div>
                        )}

                        {/* 텍스트 메시지 */}
                        {(msg.message_type === 'text' || (msg.content && msg.content !== '이미지를 보냈습니다')) && (
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2',
                              isOwn
                                ? 'bg-accent-camel text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        )}

                        {/* 시간 및 읽음 상태 */}
                        <div className={cn(
                          'flex items-center gap-1 mt-1',
                          isOwn && 'flex-row-reverse'
                        )}>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isOwn && (
                            <span className="text-accent-camel">
                              {msg.is_read ? (
                                <CheckCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 이미지 프리뷰 */}
            {previewImage && (
              <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                <div className="relative inline-block">
                  <Image
                    src={previewImage.url}
                    alt="미리보기"
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                  <button
                    onClick={cancelImagePreview}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 입력 */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-gray-200"
            >
              <div className="flex items-center gap-2">
                {/* 이미지 업로드 버튼 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </Button>

                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                  disabled={isSending}
                />

                <Button
                  type="submit"
                  disabled={(!newMessage.trim() && !previewImage) || isSending}
                  isLoading={isSending}
                >
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
              description="왼쪽에서 대화를 선택하거나 전문가 프로필에서 새 대화를 시작하세요."
            />
          </div>
        )}
      </div>
    </div>
  )
}
