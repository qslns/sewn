'use client'

// ===========================
// 설정 페이지
// ===========================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import { Bell, Shield, CreditCard, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading, signOut } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [authLoading, user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showToast('error', '새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 8) {
      showToast('error', '비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      showToast('success', '비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      console.error('Failed to change password:', error)
      showToast('error', '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      '모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?'
    )

    if (!doubleConfirm) return

    try {
      // 실제 삭제는 Supabase 함수나 Admin API로 처리해야 함
      showToast('info', '계정 삭제 요청이 처리됩니다. 고객센터로 문의해주세요.')
    } catch (error) {
      console.error('Failed to delete account:', error)
      showToast('error', '계정 삭제에 실패했습니다.')
    }
  }

  if (authLoading) {
    return (
      <div className="py-16">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">
          계정 및 알림 설정을 관리하세요.
        </p>
      </div>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-gray-500">
                새 메시지, 제안서 등의 알림을 이메일로 받습니다.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">마케팅 이메일</p>
              <p className="text-sm text-gray-500">
                프로모션 및 새로운 기능 소식을 받습니다.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="현재 비밀번호"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
            />
            <Input
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
            />
            <Input
              label="새 비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 확인"
            />
            <Button type="submit" isLoading={isLoading}>
              비밀번호 변경
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 결제 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            결제 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            등록된 결제 수단이 없습니다.
          </p>
          <Button variant="outline">결제 수단 추가</Button>
        </CardContent>
      </Card>

      {/* 계정 삭제 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            계정 삭제
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <Button variant="danger" onClick={handleDeleteAccount}>
            계정 삭제
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
