'use client'

// ===========================
// 소셜 로그인 버튼 컴포넌트
// ===========================

import { useState } from 'react'
import { signInWithSocial, SocialProvider } from '@/lib/auth/social'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// 카카오 아이콘
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.68 6.74l-.95 3.56c-.05.19.02.39.18.5.08.05.17.08.27.08.1 0 .19-.03.27-.08l4.13-2.74c.47.05.95.08 1.42.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  )
}

// 구글 아이콘
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

interface SocialLoginButtonProps {
  provider: SocialProvider
  className?: string
  disabled?: boolean
}

export function SocialLoginButton({ provider, className, disabled }: SocialLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)

    try {
      await signInWithSocial(provider)
    } catch (error) {
      console.error(`${provider} login error:`, error)
      showToast('error', `${provider === 'kakao' ? '카카오' : '구글'} 로그인에 실패했습니다. 다시 시도해주세요.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (provider === 'kakao') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        className={cn(
          'w-full flex items-center justify-center gap-3',
          'bg-[#FEE500] text-[#191919] font-medium py-3 px-4 rounded-lg',
          'hover:bg-[#FDD800] transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <KakaoIcon className="h-5 w-5" />
        )}
        카카오로 시작하기
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={cn(
        'w-full flex items-center justify-center gap-3',
        'bg-white text-gray-700 font-medium py-3 px-4 rounded-lg',
        'border border-gray-300 hover:bg-gray-50 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      Google로 시작하기
    </button>
  )
}

// 소셜 로그인 버튼 그룹
export function SocialLoginButtons({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <SocialLoginButton provider="kakao" />
      <SocialLoginButton provider="google" />
    </div>
  )
}

// 구분선과 함께 표시
export function SocialLoginSection({ className }: { className?: string }) {
  return (
    <div className={cn('mt-6', className)}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">또는</span>
        </div>
      </div>
      <div className="mt-6">
        <SocialLoginButtons />
      </div>
    </div>
  )
}
