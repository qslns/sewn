'use client'

// ===========================
// 프로젝트 목록 페이지
// ===========================

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/project/project-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, EXPERT_CATEGORIES, EXPERT_CATEGORY_GROUPS, BUDGET_RANGES } from '@/lib/constants'
import { Briefcase, Search, Plus, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { CATEGORY_LABELS, type ExpertCategory } from '@/types'

function ProjectsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile } = useAuth()

  const page = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') as ExpertCategory | null
  const minBudget = searchParams.get('minBudget')
  const maxBudget = searchParams.get('maxBudget')
  const searchQuery = searchParams.get('search')

  const [search, setSearch] = useState(searchQuery || '')
  const [showFilters, setShowFilters] = useState(false)

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

  const hasActiveFilters = category || minBudget

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    params.delete('page')
    router.push(`/projects?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const clearFilters = useCallback(() => {
    router.push('/projects', { scroll: false })
    setSearch('')
  }, [router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: search || null })
  }

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`/projects?${params.toString()}`, { scroll: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router, searchParams])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-600 mt-2">
            다양한 패션 프로덕션 프로젝트에 참여해보세요.
          </p>
        </div>
        {isClient && (
          <Link href={ROUTES.PROJECT_NEW}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              프로젝트 등록
            </Button>
          </Link>
        )}
      </div>

      {/* 필터 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <Input
              type="text"
              placeholder="프로젝트 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              rightIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      updateFilters({ search: null })
                    }}
                    className="focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : undefined
              }
            />
          </form>

          <div className="flex gap-2">
            <Select
              options={[
                { value: '', label: '전체 분야' },
                ...EXPERT_CATEGORIES.map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                })),
              ]}
              value={category || ''}
              onChange={(e) => updateFilters({ category: e.target.value || null })}
              className="w-40"
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
                  updateFilters({ minBudget: null, maxBudget: null })
                } else {
                  const [min, max] = e.target.value.split('-')
                  updateFilters({
                    minBudget: min,
                    maxBudget: max === 'max' ? null : max,
                  })
                }
              }}
              className="w-40"
            />
          </div>
        </div>

        {/* 활성 필터 태그 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <FilterTag
                label={CATEGORY_LABELS[category]}
                onRemove={() => updateFilters({ category: null })}
              />
            )}
            {minBudget && (
              <FilterTag
                label={BUDGET_RANGES.find(r => String(r.min) === minBudget)?.label || `${Number(minBudget).toLocaleString()}원 이상`}
                onRemove={() => updateFilters({ minBudget: null, maxBudget: null })}
              />
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              모두 지우기
            </button>
          </div>
        )}
      </div>

      {/* 결과 수 */}
      {!isLoading && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>개의 프로젝트
          </p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="py-16">
          <LoadingState message="프로젝트를 불러오는 중..." />
        </div>
      )}

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
                  onClick: () => router.push(ROUTES.PROJECT_NEW),
                }
              : hasActiveFilters
              ? {
                  label: '필터 초기화',
                  onClick: clearFilters,
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
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <p className="text-sm text-gray-500 order-2 sm:order-1">
                {page} / {totalPages} 페이지
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">이전</span>
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {generatePageNumbers(page, totalPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">다음</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 필터 태그 컴포넌트
function FilterTag({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// 페이지 번호 생성 헬퍼
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  if (current < total - 2) {
    pages.push('...')
  }

  if (!pages.includes(total)) {
    pages.push(total)
  }

  return pages
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="페이지 로딩 중..." />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  )
}
