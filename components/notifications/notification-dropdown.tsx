'use client'

// ===========================
// 알림 드롭다운 컴포넌트
// ===========================

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  Bell,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Briefcase,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/types'

interface NotificationDropdownProps {
  userId: string | null
}

// 알림 타입별 아이콘
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />
    case 'proposal_received':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'proposal_accepted':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'proposal_rejected':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'project_update':
      return <Briefcase className="h-5 w-5 text-amber-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
  }
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="알림"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-accent-camel hover:text-accent-camel/80 font-medium flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative group',
                    !notification.is_read && 'bg-blue-50/50'
                  )}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => handleNotificationClick(notification)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <div
                      className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <NotificationContent notification={notification} />
                    </div>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="알림 삭제"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-gray-600 hover:text-gray-900"
              >
                모든 알림 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 알림 내용 컴포넌트
function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
          )}
        >
          {notification.title}
        </p>
        {notification.content && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {notification.content}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <span className="h-2 w-2 bg-blue-500 rounded-full block" />
        </div>
      )}
    </div>
  )
}
