// ===========================
// 스켈레톤 로딩 컴포넌트
// ===========================

import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rounded'
  animation?: 'pulse' | 'shimmer' | 'none'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'shimmer',
  width,
  height,
}: SkeletonProps) {
  const variants = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  }

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        'bg-gray-200',
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
    />
  )
}

// 텍스트 스켈레톤
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// 아바타 스켈레톤
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size], className)}
    />
  )
}

// 카드 스켈레톤
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 p-4 space-y-4', className)}>
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// 리스트 아이템 스켈레톤
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  )
}

// 테이블 스켈레톤
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('w-full', className)}>
      {/* 헤더 */}
      <div className="flex gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* 행 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
