// ===========================
// 스피너 컴포넌트
// ===========================

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-gray-400', sizeClasses[size], className)}
    />
  )
}

// 전체 화면 로딩 오버레이
export function LoadingOverlay({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="lg" className="text-black" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  )
}

// 컨테이너 내부 로딩
export function LoadingState({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" className="text-black" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  )
}
