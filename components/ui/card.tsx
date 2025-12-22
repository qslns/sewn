// ===========================
// 카드 컴포넌트 (디자인 시스템 적용)
// ===========================

import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'
import Image from 'next/image'

// 카드 변형 타입
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'ghost'
  hover?: 'none' | 'lift' | 'border' | 'shadow'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

// 카드 컨테이너
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = 'none', padding = 'none', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-soft',
      elevated: 'bg-white shadow-medium',
      outline: 'bg-transparent border border-gray-200',
      ghost: 'bg-gray-50',
    }

    const hoverEffects = {
      none: '',
      lift: 'hover:shadow-lift hover:-translate-y-1 transition-all duration-300',
      border: 'hover:border-gray-400 transition-colors duration-200',
      shadow: 'hover:shadow-strong transition-shadow duration-200',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variants[variant],
          hoverEffects[hover],
          paddings[padding],
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

// 카드 헤더
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// 카드 제목
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// 카드 설명
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 leading-relaxed', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// 카드 본문
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// 카드 푸터
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  separator?: boolean
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, separator = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-6 pt-0',
        separator && 'border-t border-gray-100 mt-6 pt-6',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

// 카드 이미지
interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string
  alt: string
  aspectRatio?: 'square' | 'video' | 'wide'
}

const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, aspectRatio = 'video', ...props }, ref) => {
    const aspectRatios = {
      square: 'aspect-square',
      video: 'aspect-video',
      wide: 'aspect-[21/9]',
    }

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden rounded-t-xl', aspectRatios[aspectRatio], className)}
        {...props}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    )
  }
)
CardImage.displayName = 'CardImage'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardImage }
