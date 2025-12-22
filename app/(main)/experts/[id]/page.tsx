'use client'

// ===========================
// 전문가 상세 페이지
// ===========================

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { useExpert } from '@/hooks/useExperts'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, AVAILABILITY_LABELS } from '@/lib/constants'
import { CATEGORY_LABELS } from '@/types'
import { formatPriceRange, getStarArray } from '@/lib/utils'
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Clock,
} from 'lucide-react'

export default function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { data: expert, portfolioItems, isLoading, error } = useExpert(id)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="전문가 정보를 불러오는 중..." />
      </div>
    )
  }

  if (error || !expert) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          전문가를 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 mb-8">
          요청하신 전문가 정보가 존재하지 않거나 삭제되었습니다.
        </p>
        <Link href={ROUTES.EXPERTS}>
          <Button>전문가 목록으로</Button>
        </Link>
      </div>
    )
  }

  const handleContact = () => {
    if (!user) {
      router.push(ROUTES.LOGIN)
      return
    }
    // TODO: 메시지 시작
    router.push(ROUTES.MESSAGES)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 프로필 헤더 */}
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar
              src={expert.user.profile_image_url}
              alt={expert.user.name}
              size="xl"
              className="shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {expert.user.name}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expert.categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {CATEGORY_LABELS[cat]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  variant={
                    expert.availability === 'available'
                      ? 'success'
                      : expert.availability === 'busy'
                      ? 'warning'
                      : 'secondary'
                  }
                  size="md"
                >
                  {AVAILABILITY_LABELS[expert.availability]}
                </Badge>
              </div>

              {/* 메타 정보 */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {expert.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {expert.location}
                  </div>
                )}
                {expert.experience_years && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    경력 {expert.experience_years}년
                  </div>
                )}
                {expert.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {expert.rating_avg.toFixed(1)} ({expert.review_count}개 리뷰)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          {expert.bio && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">소개</h2>
              <p className="text-gray-600 whitespace-pre-line">{expert.bio}</p>
            </section>
          )}

          {/* 스킬 */}
          {expert.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">스킬</h2>
              <div className="flex flex-wrap gap-2">
                {expert.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* 학력 */}
          {expert.education && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">학력</h2>
              <div className="flex items-start gap-2 text-gray-600">
                <GraduationCap className="h-5 w-5 mt-0.5 shrink-0" />
                <p>{expert.education}</p>
              </div>
            </section>
          )}

          {/* 포트폴리오 */}
          {portfolioItems.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                포트폴리오
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    {item.image_urls[0] && (
                      <Image
                        src={item.image_urls[0]}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium text-center px-4">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 리뷰 섹션 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              리뷰 ({expert.review_count})
            </h2>
            {expert.review_count === 0 ? (
              <p className="text-gray-500">아직 리뷰가 없습니다.</p>
            ) : (
              <p className="text-gray-500">리뷰 목록이 여기에 표시됩니다.</p>
            )}
          </section>
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-6">
              {/* 가격 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">시급</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPriceRange(
                    expert.hourly_rate_min,
                    expert.hourly_rate_max
                  )}
                </p>
              </div>

              {expert.project_rate_min || expert.project_rate_max ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    프로젝트 단가
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPriceRange(
                      expert.project_rate_min,
                      expert.project_rate_max
                    )}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>보통 24시간 내 응답</span>
                </div>

                <Button className="w-full" size="lg" onClick={handleContact}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  메시지 보내기
                </Button>
              </div>

              {/* 완료 프로젝트 */}
              <div className="border-t border-gray-100 pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {expert.completed_projects}
                    </p>
                    <p className="text-sm text-gray-500">완료 프로젝트</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {expert.review_count}
                    </p>
                    <p className="text-sm text-gray-500">리뷰</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
