'use client'

// ===========================
// 대기자 등록 폼 컴포넌트
// ===========================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      showToast('error', '이메일을 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.from('waitlist').insert({ email })

      if (error) {
        if (error.code === '23505') {
          // 중복 이메일
          showToast('info', '이미 등록된 이메일입니다.')
        } else {
          throw error
        }
      } else {
        setIsSuccess(true)
        setEmail('')
        showToast('success', '등록이 완료되었습니다!')
      }
    } catch {
      showToast('error', '등록 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 text-green-800 rounded-lg p-6">
        <p className="font-medium">감사합니다!</p>
        <p className="text-sm mt-1">출시 소식을 가장 먼저 알려드릴게요.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <Input
        type="email"
        placeholder="이메일 주소를 입력하세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="h-5 w-5" />}
        className="flex-1"
      />
      <Button type="submit" isLoading={isLoading} className="shrink-0">
        알림 신청
      </Button>
    </form>
  )
}
