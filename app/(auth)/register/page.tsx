'use client'

// ===========================
// 회원가입 페이지
// ===========================

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { checkPasswordStrength } from '@/lib/utils'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react'
import type { UserType } from '@/types'

type Step = 'type' | 'form'

export default function RegisterPage() {
  const router = useRouter()
  const { signUpWithEmail, signInWithKakao, signInWithGoogle } = useAuth()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>('type')
  const [userType, setUserType] = useState<UserType>('client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const passwordStrength = checkPasswordStrength(password)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      await signUpWithEmail(email, password, { name, user_type: userType })
      showToast('success', '회원가입이 완료되었습니다!')
      // 전문가로 가입하면 온보딩으로, 클라이언트면 대시보드로
      if (userType === 'expert' || userType === 'both') {
        router.push(ROUTES.ONBOARDING)
      } else {
        router.push(ROUTES.DASHBOARD)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
      if (errorMessage.includes('already registered')) {
        showToast('error', '이미 등록된 이메일입니다.')
      } else {
        showToast('error', errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    try {
      if (provider === 'kakao') {
        await signInWithKakao()
      } else {
        await signInWithGoogle()
      }
    } catch {
      showToast('error', '소셜 로그인에 실패했습니다.')
    }
  }

  // 사용자 타입 선택 단계
  if (step === 'type') {
    return (
      <div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-gray-600 mt-2">어떤 목적으로 가입하시나요?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setUserType('client')
              setStep('form')
            }}
            className="w-full p-6 text-left border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">
              전문가를 찾고 있어요
            </h3>
            <p className="text-sm text-gray-500">
              프로젝트에 필요한 패션 프로덕션 전문가를 찾고 싶어요.
            </p>
          </button>

          <button
            onClick={() => {
              setUserType('expert')
              setStep('form')
            }}
            className="w-full p-6 text-left border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">
              전문가로 활동하고 싶어요
            </h3>
            <p className="text-sm text-gray-500">
              저의 전문성으로 프로젝트에 참여하고 싶어요.
            </p>
          </button>

          <button
            onClick={() => {
              setUserType('both')
              setStep('form')
            }}
            className="w-full p-6 text-left border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">둘 다요</h3>
            <p className="text-sm text-gray-500">
              전문가로 활동하면서 다른 전문가도 찾고 싶어요.
            </p>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href={ROUTES.LOGIN} className="font-medium text-black hover:underline">
            로그인
          </Link>
        </p>
      </div>
    )
  }

  // 회원가입 폼 단계
  return (
    <div>
      <div className="text-center mb-8">
        <button
          onClick={() => setStep('type')}
          className="text-sm text-gray-500 hover:text-black mb-4"
        >
          ← 다시 선택하기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-gray-600 mt-2">
          {userType === 'expert'
            ? '전문가로 활동하기'
            : userType === 'both'
            ? '클라이언트 & 전문가로 활동하기'
            : '전문가 찾기'}
        </p>
      </div>

      {/* 소셜 로그인 */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('kakao')}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.636 1.73 4.975 4.348 6.322-.19.706-.686 2.557-.785 2.959-.123.502.184.495.387.36.16-.106 2.547-1.732 3.578-2.434.477.066.965.102 1.472.102 5.523 0 10-3.463 10-7.309C21 6.463 17.523 3 12 3z" />
          </svg>
          카카오로 계속하기
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('google')}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
          구글로 계속하기
        </Button>
      </div>

      {/* 구분선 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이름"
          type="text"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<User className="h-5 w-5" />}
        />
        <Input
          label="이메일"
          type="email"
          placeholder="hello@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-5 w-5" />}
        />
        <div>
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="8자 이상의 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="h-5 w-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            }
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full ${
                      level <= passwordStrength.score
                        ? passwordStrength.score <= 2
                          ? 'bg-red-500'
                          : passwordStrength.score <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">{passwordStrength.feedback}</p>
            </div>
          )}
        </div>
        <Input
          label="비밀번호 확인"
          type={showPassword ? 'text' : 'password'}
          placeholder="비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            confirmPassword && password === confirmPassword ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : undefined
          }
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          회원가입
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        가입 시{' '}
        <Link href="#" className="underline">
          이용약관
        </Link>
        {' 및 '}
        <Link href="#" className="underline">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>

      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href={ROUTES.LOGIN} className="font-medium text-black hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
