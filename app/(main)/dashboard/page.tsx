'use client'

// ===========================
// 대시보드 메인 페이지
// ===========================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import {
  Briefcase,
  MessageSquare,
  FileText,
  Star,
  ArrowRight,
  Plus,
  User,
  Image as ImageIcon,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="대시보드를 불러오는 중..." />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isExpert = profile.user_type === 'expert' || profile.user_type === 'both'
  const isClient = profile.user_type === 'client' || profile.user_type === 'both'

  // 빠른 통계 (실제 데이터 연동 필요)
  const stats = {
    activeProjects: 0,
    pendingProposals: 0,
    unreadMessages: 0,
    completedProjects: 0,
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile.name}님!
        </h1>
        <p className="text-gray-600 mt-1">
          오늘도 Sewn에서 좋은 하루 되세요.
        </p>
      </div>

      {/* 빠른 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">진행중 프로젝트</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">대기중 제안</p>
                <p className="text-2xl font-bold">{stats.pendingProposals}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">새 메시지</p>
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">완료 프로젝트</p>
                <p className="text-2xl font-bold">{stats.completedProjects}</p>
              </div>
              <Star className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 시작</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isClient && (
              <Link href={ROUTES.PROJECT_NEW}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    새 프로젝트 등록
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link href={ROUTES.EXPERTS}>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  전문가 찾기
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href={ROUTES.MESSAGES}>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  메시지 확인
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {isExpert && (
              <Link href={ROUTES.DASHBOARD_PORTFOLIO}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    포트폴리오 관리
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* 프로필 완성도 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 완성하기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProfileCheckItem
                title="기본 정보 입력"
                description="이름과 프로필 사진을 설정하세요"
                completed={!!profile.name && !!profile.profile_image_url}
                href={ROUTES.DASHBOARD_PROFILE}
              />

              {isExpert && (
                <>
                  <ProfileCheckItem
                    title="전문 분야 설정"
                    description="당신의 전문 분야를 선택하세요"
                    completed={false}
                    href={ROUTES.DASHBOARD_PROFILE}
                  />
                  <ProfileCheckItem
                    title="포트폴리오 추가"
                    description="작업물을 업로드하세요"
                    completed={false}
                    href={ROUTES.DASHBOARD_PORTFOLIO}
                  />
                  <ProfileCheckItem
                    title="요금 설정"
                    description="시급 또는 프로젝트 단가를 설정하세요"
                    completed={false}
                    href={ROUTES.DASHBOARD_PROFILE}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            아직 활동 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// 프로필 체크 아이템 컴포넌트
function ProfileCheckItem({
  title,
  description,
  completed,
  href,
}: {
  title: string
  description: string
  completed: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center ${
          completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {completed ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <span className="text-sm font-medium">!</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </Link>
  )
}
