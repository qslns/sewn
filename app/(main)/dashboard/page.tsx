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
import { Avatar } from '@/components/ui/avatar'
import { LoadingState } from '@/components/ui/spinner'
import { StarRating } from '@/components/ui/star-rating'
import { useAuth } from '@/hooks/useAuth'
import { useClientDashboard, useExpertDashboard } from '@/hooks/useDashboard'
import { ROUTES, PROJECT_STATUS_LABELS, PROPOSAL_STATUS_LABELS } from '@/lib/constants'
import { formatPrice, formatRelativeTime, formatPriceRange } from '@/lib/utils'
import {
  Briefcase,
  MessageSquare,
  FileText,
  Star,
  ArrowRight,
  Plus,
  User,
  Image as ImageIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Send,
  Eye,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [authLoading, user, router])

  if (authLoading) {
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile.name}님!
        </h1>
        <p className="text-gray-600 mt-1">
          {isExpert && isClient
            ? '전문가 & 클라이언트로 활동 중입니다.'
            : isExpert
            ? '전문가로 활동 중입니다.'
            : '클라이언트로 활동 중입니다.'}
        </p>
      </div>

      {/* 전문가 대시보드 */}
      {isExpert && <ExpertDashboard userId={user.id} />}

      {/* 클라이언트 대시보드 */}
      {isClient && <ClientDashboard userId={user.id} isExpert={isExpert} />}
    </div>
  )
}

// 전문가 대시보드 컴포넌트
function ExpertDashboard({ userId }: { userId: string }) {
  const { stats, expertProfile, myProposals, recommendedProjects, isLoading } = useExpertDashboard(userId)

  if (isLoading) {
    return <LoadingState message="전문가 데이터를 불러오는 중..." />
  }

  if (!expertProfile) {
    return (
      <Card className="mb-8">
        <CardContent className="py-12 text-center">
          <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            전문가 프로필을 먼저 작성해주세요
          </h3>
          <p className="text-gray-500 mb-6">
            전문가로 활동하려면 프로필 정보를 완성해야 합니다.
          </p>
          <Link href={ROUTES.ONBOARDING}>
            <Button>프로필 작성하기</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 mb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">전문가 활동</h2>
        <Link href={ROUTES.PROJECTS}>
          <Button variant="outline" size="sm">
            프로젝트 찾기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 전문가 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">진행중 프로젝트</p>
                <p className="text-2xl font-bold text-accent-camel">{stats.inProgressProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-accent-camel/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">대기중 제안</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingProposals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">완료 프로젝트</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">총 수익</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.totalEarnings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 평점 카드 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 평점</p>
              <div className="flex items-center gap-3">
                <StarRating rating={stats.averageRating} size="lg" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500">({stats.reviewCount}개 리뷰)</span>
              </div>
            </div>
            <Link href={ROUTES.DASHBOARD_PROFILE}>
              <Button variant="outline" size="sm">
                프로필 보기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 내 제안서 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">내 제안서</CardTitle>
            <span className="text-sm text-gray-500">총 {stats.totalProposals}개</span>
          </CardHeader>
          <CardContent>
            {myProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>아직 보낸 제안서가 없습니다.</p>
                <Link href={ROUTES.PROJECTS}>
                  <Button variant="outline" size="sm" className="mt-4">
                    프로젝트 찾기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProposals.slice(0, 5).map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={ROUTES.PROJECT_DETAIL(proposal.project_id)}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {proposal.project.title}
                      </h4>
                      <Badge
                        variant={
                          proposal.status === 'pending'
                            ? 'secondary'
                            : proposal.status === 'accepted'
                            ? 'success'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof PROPOSAL_STATUS_LABELS]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatPrice(proposal.proposed_rate)}</span>
                      <span>{formatRelativeTime(proposal.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 추천 프로젝트 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">추천 프로젝트</CardTitle>
            <Link href={ROUTES.PROJECTS}>
              <Button variant="ghost" size="sm">
                전체 보기
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recommendedProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>현재 추천 프로젝트가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={ROUTES.PROJECT_DETAIL(project.id)}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar
                        src={project.client.profile_image_url}
                        alt={project.client.name}
                        size="sm"
                      />
                      <span className="text-sm text-gray-500">{project.client.name}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-2">
                      {project.title}
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-accent-camel">
                        {formatPriceRange(project.budget_min, project.budget_max)}
                      </span>
                      <span className="text-gray-500">{formatRelativeTime(project.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 클라이언트 대시보드 컴포넌트
function ClientDashboard({ userId, isExpert }: { userId: string; isExpert: boolean }) {
  const { stats, myProjects, recentProposals, isLoading } = useClientDashboard(userId)

  if (isLoading) {
    return <LoadingState message="클라이언트 데이터를 불러오는 중..." />
  }

  return (
    <div className="space-y-8">
      {isExpert && (
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">클라이언트 활동</h2>
        </div>
      )}

      {!isExpert && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">내 프로젝트</h2>
          <Link href={ROUTES.PROJECT_NEW}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              새 프로젝트
            </Button>
          </Link>
        </div>
      )}

      {/* 클라이언트 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">모집중 프로젝트</p>
                <p className="text-2xl font-bold text-accent-camel">{stats.openProjects}</p>
              </div>
              <Eye className="h-8 w-8 text-accent-camel/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">진행중</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgressProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">받은 제안서</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingProposals}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 내 프로젝트 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">내 프로젝트</CardTitle>
            {isExpert && (
              <Link href={ROUTES.PROJECT_NEW}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  새 프로젝트
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>등록한 프로젝트가 없습니다.</p>
                <Link href={ROUTES.PROJECT_NEW}>
                  <Button variant="outline" size="sm" className="mt-4">
                    첫 프로젝트 등록
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={ROUTES.PROJECT_DETAIL(project.id)}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {project.title}
                      </h4>
                      <Badge
                        variant={
                          project.status === 'open'
                            ? 'success'
                            : project.status === 'in_progress'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatPriceRange(project.budget_min, project.budget_max)}</span>
                      <span>{formatRelativeTime(project.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 받은 제안서 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 받은 제안서</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Send className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>아직 받은 제안서가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={ROUTES.PROJECT_DETAIL(proposal.project_id)}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar
                        src={proposal.expert?.user?.profile_image_url}
                        alt={proposal.expert?.user?.name || '전문가'}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {proposal.expert?.user?.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {proposal.project?.title}
                        </p>
                      </div>
                      <Badge
                        variant={
                          proposal.status === 'pending'
                            ? 'secondary'
                            : proposal.status === 'accepted'
                            ? 'success'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof PROPOSAL_STATUS_LABELS]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="font-medium text-gray-900">
                        {formatPrice(proposal.proposed_rate)}
                      </span>
                      <span>{formatRelativeTime(proposal.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">빠른 액션</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <Link href={ROUTES.PROJECT_NEW}>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              새 프로젝트 등록
            </Button>
          </Link>
          <Link href={ROUTES.EXPERTS}>
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              전문가 찾기
            </Button>
          </Link>
          <Link href={ROUTES.MESSAGES}>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              메시지 확인
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
