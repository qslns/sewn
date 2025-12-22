'use client'

// ===========================
// 전문가 상세 페이지
// ===========================

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { Lightbox, useLightbox } from '@/components/ui/lightbox'
import { StarRating } from '@/components/ui/star-rating'
import { ExpertCard } from '@/components/expert/expert-card'
import { useExpert } from '@/hooks/useExperts'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, AVAILABILITY_LABELS } from '@/lib/constants'
import { CATEGORY_LABELS } from '@/types'
import { formatPriceRange, formatRelativeTime } from '@/lib/utils'
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Clock,
  ChevronRight,
  Share2,
  Heart,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'

export default function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { data: expert, portfolioItems, reviews, similarExperts, isLoading, error } = useExpert(id)

  // 라이트박스 상태
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // 포트폴리오 이미지 준비
  const portfolioImages = portfolioItems.flatMap((item) =>
    item.image_urls.map((url) => ({
      url,
      title: item.title,
      description: item.description || undefined,
    }))
  )

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

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
    router.push(ROUTES.MESSAGES)
  }

  return (
    <>
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
                className="shrink-0 ring-4 ring-white shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {expert.user.name}
                      </h1>
                      {expert.completed_projects >= 10 && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expert.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {CATEGORY_LABELS[cat]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Share2 className="h-5 w-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Heart className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
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
              <section className="bg-white rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">소개</h2>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">{expert.bio}</p>
              </section>
            )}

            {/* 스킬 */}
            {expert.skills.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">전문 스킬</h2>
                <div className="flex flex-wrap gap-2">
                  {expert.skills.map((skill) => (
                    <Badge key={skill} variant="outline" size="md">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* 학력 */}
            {expert.education && (
              <section className="bg-white rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">학력</h2>
                <div className="flex items-start gap-3 text-gray-600">
                  <GraduationCap className="h-5 w-5 mt-0.5 shrink-0 text-gray-400" />
                  <p>{expert.education}</p>
                </div>
              </section>
            )}

            {/* 포트폴리오 */}
            {portfolioItems.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    포트폴리오 ({portfolioItems.length})
                  </h2>
                </div>

                {/* 메이슨리 그리드 */}
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                  {portfolioItems.map((item, itemIndex) => {
                    // 이 아이템의 첫 이미지가 전체 이미지 배열에서 몇 번째인지 계산
                    const imageStartIndex = portfolioItems
                      .slice(0, itemIndex)
                      .reduce((acc, prev) => acc + prev.image_urls.length, 0)

                    return item.image_urls.map((url, imgIdx) => (
                      <div
                        key={`${item.id}-${imgIdx}`}
                        className="break-inside-avoid group relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => openLightbox(imageStartIndex + imgIdx)}
                      >
                        <Image
                          src={url}
                          alt={item.title}
                          width={400}
                          height={500}
                          className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-center text-white p-4">
                              <p className="font-medium">{item.title}</p>
                              {item.category && (
                                <p className="text-sm text-white/80 mt-1">
                                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  })}
                </div>
              </section>
            )}

            {/* 리뷰 섹션 */}
            <section className="bg-white rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  리뷰 ({expert.review_count})
                </h2>
                {expert.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={expert.rating_avg} size="sm" />
                    <span className="font-semibold text-gray-900">
                      {expert.rating_avg.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">아직 리뷰가 없습니다.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={review.reviewer.profile_image_url}
                          alt={review.reviewer.name}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {review.reviewer.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StarRating rating={review.rating} size="sm" />
                                <span className="text-xs text-gray-400">
                                  {formatRelativeTime(review.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* 가격 및 연락 카드 */}
              <Card className="shadow-lift">
                <CardContent className="p-6 space-y-6">
                  {/* 가격 정보 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">시급</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatPriceRange(
                        expert.hourly_rate_min,
                        expert.hourly_rate_max
                      )}
                    </p>
                  </div>

                  {(expert.project_rate_min || expert.project_rate_max) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        프로젝트 단가
                      </h3>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatPriceRange(
                          expert.project_rate_min,
                          expert.project_rate_max
                        )}
                      </p>
                    </div>
                  )}

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
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">
                          {expert.completed_projects}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">완료 프로젝트</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">
                          {expert.review_count}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">리뷰</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 유사 전문가 */}
              {similarExperts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">비슷한 전문가</h3>
                    <div className="space-y-3">
                      {similarExperts.slice(0, 3).map((similar) => (
                        <ExpertCard
                          key={similar.id}
                          expert={similar}
                          variant="compact"
                        />
                      ))}
                    </div>
                    {similarExperts.length > 3 && (
                      <Link
                        href={`${ROUTES.EXPERTS}?category=${expert.categories[0]}`}
                        className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        더보기
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 라이트박스 */}
      <Lightbox
        images={portfolioImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
