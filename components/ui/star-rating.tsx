'use client'

// ===========================
// 별점 컴포넌트
// ===========================

import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const starSize = sizeClasses[size]

  const renderStar = (index: number) => {
    const starValue = index + 1
    const isFilled = rating >= starValue
    const isHalf = !isFilled && rating >= starValue - 0.5

    if (interactive) {
      return (
        <button
          key={index}
          type="button"
          onClick={() => onChange?.(starValue)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              starSize,
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        </button>
      )
    }

    return (
      <span key={index} className="relative">
        <Star className={cn(starSize, 'text-gray-300')} />
        {(isFilled || isHalf) && (
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: isHalf ? '50%' : '100%' }}
          >
            <Star className={cn(starSize, 'fill-yellow-400 text-yellow-400')} />
          </span>
        )}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      {showValue && (
        <span className={cn('ml-1.5 font-medium text-gray-700', {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg',
        })}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
