'use client'

// ===========================
// 전문가 카드 컴포넌트
// ===========================

import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ROUTES, AVAILABILITY_LABELS } from '@/lib/constants'
import { formatPriceRange } from '@/lib/utils'
import { Star, MapPin, Briefcase, CheckCircle } from 'lucide-react'
import { CATEGORY_LABELS, type ExpertCategory } from '@/types'
import type { ExpertWithUser } from '@/hooks/useExperts'

interface ExpertCardProps {
  expert: ExpertWithUser
  variant?: 'default' | 'compact'
}

export function ExpertCard({ expert, variant = 'default' }: ExpertCardProps) {
  const mainCategory = expert.categories[0] as ExpertCategory | undefined
  const otherCategoriesCount = expert.categories.length - 1
  const portfolioPreview = expert.portfolio_preview || []

  if (variant === 'compact') {
    return (
      <Link
        href={ROUTES.EXPERT_DETAIL(expert.id)}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all"
      >
        <Avatar
          src={expert.user.profile_image_url}
          alt={expert.user.name}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-accent-camel transition-colors">
            {expert.user.name}
          </h3>
          {mainCategory && (
            <p className="text-sm text-gray-500">{CATEGORY_LABELS[mainCategory]}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {expert.review_count > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{expert.rating_avg.toFixed(1)}</span>
              </span>
            )}
            {expert.location && (
              <span className="text-xs text-gray-400">{expert.location}</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={ROUTES.EXPERT_DETAIL(expert.id)}
      className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-400 hover:shadow-lg transition-all"
    >
      {/* 포트폴리오 미리보기 */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {portfolioPreview.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
            <div className="col-span-2 row-span-2 relative">
              <Image
                src={portfolioPreview[0]}
                alt={`${expert.user.name}의 포트폴리오`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <Avatar
                src={expert.user.profile_image_url}
                alt={expert.user.name}
                size="xl"
                className="mx-auto mb-2"
              />
              <span className="text-sm text-gray-400">포트폴리오 준비 중</span>
            </div>
          </div>
        )}

        {/* 가용성 배지 */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={
              expert.availability === 'available'
                ? 'success'
                : expert.availability === 'busy'
                ? 'warning'
                : 'secondary'
            }
          >
            {AVAILABILITY_LABELS[expert.availability]}
          </Badge>
        </div>

        {/* 포트폴리오 개수 */}
        {portfolioPreview.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{portfolioPreview.length - 1}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={expert.user.profile_image_url}
            alt={expert.user.name}
            size="md"
            className="border-2 border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-accent-camel transition-colors">
                {expert.user.name}
              </h3>
              {expert.completed_projects >= 10 && (
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {mainCategory && (
                <span>{CATEGORY_LABELS[mainCategory]}</span>
              )}
              {otherCategoriesCount > 0 && (
                <span className="text-gray-400">+{otherCategoriesCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* 평점 및 완료 프로젝트 */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          {expert.review_count > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{expert.rating_avg.toFixed(1)}</span>
              <span className="text-gray-400">({expert.review_count})</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">리뷰 없음</span>
          )}
          {expert.completed_projects > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{expert.completed_projects}건</span>
            </div>
          )}
        </div>

        {/* 위치 및 경력 */}
        <div className="flex items-center gap-3 mt-2">
          {expert.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>{expert.location}</span>
            </div>
          )}
          {expert.experience_years && expert.experience_years > 0 && (
            <span className="text-sm text-gray-400">
              경력 {expert.experience_years}년
            </span>
          )}
        </div>

        {/* 스킬 태그 (최대 3개) */}
        {expert.skills && expert.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {expert.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {expert.skills.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{expert.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 가격 */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm">
            <span className="font-semibold text-gray-900">
              {formatPriceRange(expert.hourly_rate_min, expert.hourly_rate_max)}
            </span>
            <span className="text-gray-500"> / 시간</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
