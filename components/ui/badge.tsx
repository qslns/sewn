// ===========================
// 뱃지 컴포넌트 (디자인 시스템 적용)
// ===========================

import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'
import { X } from 'lucide-react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'accent'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', dot, removable, onRemove, children, ...props }, ref) => {
    const variants = {
      default: 'bg-black text-white',
      secondary: 'bg-gray-100 text-gray-800',
      success: 'bg-success-light text-success-dark',
      warning: 'bg-warning-light text-warning-dark',
      danger: 'bg-error-light text-error-dark',
      outline: 'border border-gray-300 text-gray-700 bg-transparent',
      accent: 'bg-accent-beige text-accent-camel',
    }

    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs gap-1',
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
    }

    const dotColors = {
      default: 'bg-white',
      secondary: 'bg-gray-500',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-error',
      outline: 'bg-gray-500',
      accent: 'bg-accent-camel',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
        )}
        {children}
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="ml-0.5 -mr-0.5 hover:opacity-70 transition-opacity"
            aria-label="제거"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// 카운트 뱃지 (알림 수 등)
export interface CountBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count: number
  max?: number
  variant?: 'default' | 'danger'
  showZero?: boolean
}

const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ className, count, max = 99, variant = 'danger', showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count

    const variants = {
      default: 'bg-gray-500 text-white',
      danger: 'bg-error text-white',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold rounded-full',
          variants[variant],
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    )
  }
)

CountBadge.displayName = 'CountBadge'

// 상태 뱃지 (온라인/오프라인 등)
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'online' | 'offline' | 'away' | 'busy'
  showLabel?: boolean
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, showLabel = false, ...props }, ref) => {
    const statusConfig = {
      online: { color: 'bg-success', label: '온라인' },
      offline: { color: 'bg-gray-400', label: '오프라인' },
      away: { color: 'bg-warning', label: '자리비움' },
      busy: { color: 'bg-error', label: '다른 용무 중' },
    }

    const { color, label } = statusConfig[status]

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5', className)}
        {...props}
      >
        <span className={cn('w-2 h-2 rounded-full', color)} />
        {showLabel && <span className="text-xs text-gray-600">{label}</span>}
      </span>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

export { Badge, CountBadge, StatusBadge }
