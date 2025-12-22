'use client'

// ===========================
// 프로젝트 카드 컴포넌트
// ===========================

import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ROUTES, PROJECT_STATUS_LABELS } from '@/lib/constants'
import { CATEGORY_LABELS } from '@/types'
import { formatPriceRange, formatRelativeTime } from '@/lib/utils'
import { Calendar, MapPin, FileText } from 'lucide-react'
import type { Project, ExpertCategory } from '@/types'

interface ProjectCardProps {
  project: Project & {
    client: { name: string; profile_image_url: string | null }
    _count?: { proposals: number }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const mainCategory = project.categories[0] as ExpertCategory | undefined
  const otherCategoriesCount = project.categories.length - 1

  return (
    <Link
      href={ROUTES.PROJECT_DETAIL(project.id)}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-400 hover:shadow-lg transition-all"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={project.client.profile_image_url}
            alt={project.client.name}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {project.client.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(project.created_at)}
            </p>
          </div>
        </div>
        <Badge
          variant={
            project.status === 'open'
              ? 'success'
              : project.status === 'in_progress'
              ? 'warning'
              : 'secondary'
          }
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* 제목 및 설명 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {project.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* 카테고리 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mainCategory && (
          <Badge variant="secondary" size="sm">
            {CATEGORY_LABELS[mainCategory]}
          </Badge>
        )}
        {otherCategoriesCount > 0 && (
          <Badge variant="outline" size="sm">
            +{otherCategoriesCount}
          </Badge>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
        {project.budget_min || project.budget_max ? (
          <span className="font-medium text-gray-900">
            {formatPriceRange(project.budget_min, project.budget_max)}
          </span>
        ) : null}

        {project.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(project.deadline).toLocaleDateString('ko-KR')}
          </div>
        )}

        {project.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {project.location}
          </div>
        )}
      </div>

      {/* 제안서 수 */}
      <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
        <FileText className="h-4 w-4" />
        <span>
          {project._count?.proposals || 0}개의 제안
        </span>
      </div>
    </Link>
  )
}
