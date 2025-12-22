'use client'

// ===========================
// 모달 컴포넌트 (디자인 시스템 적용)
// ===========================

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'

      // 포커스 트랩
      contentRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnEscape])

  // 오버레이 클릭으로 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-modal flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
        overlayClassName
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-lift',
          'animate-scale-in',
          'focus:outline-none',
          sizeClasses[size],
          className
        )}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900 truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-gray-500 line-clamp-2"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 -m-2 rounded-lg',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-gray-200'
                )}
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )

  // Portal을 사용하여 body에 렌더링
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}

// 모달 푸터 컴포넌트
export function ModalFooter({
  children,
  className,
  align = 'right',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 mt-2',
        'border-t border-gray-100',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// 확인 다이얼로그
export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-6">{description}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variant === 'danger'
                ? 'bg-error text-white hover:bg-error-dark'
                : 'bg-black text-white hover:bg-gray-800'
            )}
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
