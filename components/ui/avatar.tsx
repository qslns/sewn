'use client'

// ===========================
// 아바타 컴포넌트
// ===========================

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { User } from 'lucide-react'

export interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
}

export function Avatar({ src, alt = '프로필 이미지', size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full bg-gray-100 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      ) : (
        <User className={cn('text-gray-400', iconSizes[size])} />
      )}
    </div>
  )
}

// 아바타 그룹 (여러 아바타를 겹쳐서 표시)
export interface AvatarGroupProps {
  avatars: { src?: string | null; alt?: string }[]
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function AvatarGroup({ avatars, max = 3, size = 'md', className }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-medium ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
