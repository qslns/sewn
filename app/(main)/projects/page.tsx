'use client'

// ===========================
// 프로젝트 목록 페이지
// ===========================

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/project/project-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, EXPERT_CATEGORIES, BUDGET_RANGES } from '@/lib/constants'
import { Briefcase, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExpertCategory } from '@/types'

function ProjectsContent() {
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()

  const page = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') as ExpertCategory | null
  const minBudget = searchParams.get('minBudget')
  const maxBudget = searchParams.get('maxBudget')
  const searchQuery = searchParams.get('search')

  const [search, setSearch] = useState(searchQuery || '')

  const { data: projects, count, isLoading, totalPages } = useProjects({
    page,
    filters: {
      categories: category ? [category] : undefined,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
      search: searchQuery || undefined,
    },
  })

  const isClient = profile?.user_type === 'client' || profile?.user_type === 'both'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.delete('page')
    window.location.href = `/projects?${params.toString()}`
  }

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    window.location.href = `/projects?${params.toString()}`
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    window.location.href = `/projects?${params.toString()}`
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-600 mt-2">
            다양한 패션 프로젝트에 참여해보세요.
          </p>
        </div>
        {isClient && (
          <Link href={ROUTES.PROJECT_NEW}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 등록
            </Button>
          </Link>
        )}
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            type="text"
            placeholder="프로젝트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
          />
        </form>

        <Select
          options={[
            { value: '', label: '전체 분야' },
            ...EXPERT_CATEGORIES.map((cat) => ({
              value: cat.value,
              label: cat.label,
            })),
          ]}
          value={category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value || null)}
          className="w-full sm:w-48"
        />

        <Select
          options={[
            { value: '', label: '전체 예산' },
            ...BUDGET_RANGES.map((range) => ({
              value: `${range.min}-${range.max || 'max'}`,
              label: range.label,
            })),
          ]}
          value={
            minBudget && maxBudget
              ? `${minBudget}-${maxBudget}`
              : minBudget
              ? `${minBudget}-max`
              : ''
          }
          onChange={(e) => {
            if (!e.target.value) {
              handleFilterChange('minBudget', null)
              handleFilterChange('maxBudget', null)
            } else {
              const [min, max] = e.target.value.split('-')
              const params = new URLSearchParams(searchParams.toString())
              params.set('minBudget', min)
              if (max !== 'max') {
                params.set('maxBudget', max)
              } else {
                params.delete('maxBudget')
              }
              params.delete('page')
              window.location.href = `/projects?${params.toString()}`
            }
          }}
          className="w-full sm:w-48"
        />
      </div>

      {/* 결과 수 */}
      {!isLoading && (
        <div className="mb-6 text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{count}</span>개의 프로젝트
        </div>
      )}

      {/* 로딩 */}
      {isLoading && <LoadingState message="프로젝트를 불러오는 중..." />}

      {/* 빈 상태 */}
      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="프로젝트가 없습니다"
          description={
            isClient
              ? '첫 번째 프로젝트를 등록해보세요.'
              : '현재 모집중인 프로젝트가 없습니다.'
          }
          action={
            isClient
              ? {
                  label: '프로젝트 등록',
                  onClick: () => (window.location.href = ROUTES.PROJECT_NEW),
                }
              : undefined
          }
        />
      )}

      {/* 프로젝트 목록 */}
      {!isLoading && projects.length > 0 && (
        <>
          <div className="grid gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>

              <span className="px-4 text-sm text-gray-600">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<LoadingState message="페이지 로딩 중..." />}>
      <ProjectsContent />
    </Suspense>
  )
}
