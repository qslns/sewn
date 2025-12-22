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
import { Star, MapPin } from 'lucide-react'
import { CATEGORY_LABELS, type ExpertProfile, type ExpertCategory } from '@/types'

interface ExpertCardProps {
  expert: ExpertProfile & { user: { name: string; profile_image_url: string | null } }
  portfolioPreview?: string[]
}

export function ExpertCard({ expert, portfolioPreview = [] }: ExpertCardProps) {
  const mainCategory = expert.categories[0] as ExpertCategory | undefined
  const otherCategoriesCount = expert.categories.length - 1

  return (
    <Link
      href={ROUTES.EXPERT_DETAIL(expert.id)}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-400 hover:shadow-lg transition-all"
    >
      {/* 포트폴리오 미리보기 */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {portfolioPreview.length > 0 ? (
          <Image
            src={portfolioPreview[0]}
            alt={`${expert.user.name}의 포트폴리오`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <span className="text-sm">포트폴리오 없음</span>
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
      </div>

      {/* 정보 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={expert.user.profile_image_url}
            alt={expert.user.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {expert.user.name}
            </h3>
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
          {expert.review_count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{expert.rating_avg.toFixed(1)}</span>
              <span className="text-gray-400">({expert.review_count})</span>
            </div>
          )}
          {expert.completed_projects > 0 && (
            <span className="text-gray-500">
              {expert.completed_projects}개 프로젝트 완료
            </span>
          )}
        </div>

        {/* 위치 */}
        {expert.location && (
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{expert.location}</span>
          </div>
        )}

        {/* 가격 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              {formatPriceRange(expert.hourly_rate_min, expert.hourly_rate_max)}
            </span>
            {' / 시간'}
          </p>
        </div>
      </div>
    </Link>
  )
}
