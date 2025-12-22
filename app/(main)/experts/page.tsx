'use client'

// ===========================
// 전문가 목록 페이지
// ===========================

import { Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ExpertCard } from '@/components/expert/expert-card'
import { ExpertFilters } from '@/components/expert/expert-filters'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useExperts } from '@/hooks/useExperts'
import { Users, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react'
import type { ExpertCategory, AvailabilityStatus, SortOption } from '@/types'

function ExpertsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL 파라미터 파싱
  const page = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') as ExpertCategory | null
  const location = searchParams.get('location')
  const availability = searchParams.get('availability') as AvailabilityStatus | null
  const minRate = searchParams.get('minRate')
  const maxRate = searchParams.get('maxRate')
  const search = searchParams.get('search')
  const sort = (searchParams.get('sort') as SortOption) || 'recommended'
  const minRating = searchParams.get('minRating')

  const { data: experts, count, isLoading, totalPages } = useExperts({
    page,
    filters: {
      categories: category ? [category] : undefined,
      location: location || undefined,
      availability: availability || undefined,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      search: search || undefined,
      sort,
      minRating: minRating ? Number(minRating) : undefined,
    },
  })

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`/experts?${params.toString()}`, { scroll: false })
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router, searchParams])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">전문가 찾기</h1>
        <p className="text-gray-600 mt-2">
          패션 프로덕션에 필요한 전문가를 찾아보세요.
        </p>
      </div>

      {/* 필터 */}
      <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
        <ExpertFilters className="mb-8" />
      </Suspense>

      {/* 결과 수 & 뷰 토글 */}
      {!isLoading && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>명의 전문가
          </p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="py-16">
          <LoadingState message="전문가를 불러오는 중..." />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && experts.length === 0 && (
        <EmptyState
          icon={Users}
          title="전문가를 찾을 수 없습니다"
          description="검색 조건을 변경하거나 필터를 초기화해보세요."
          action={{
            label: '필터 초기화',
            onClick: () => router.push('/experts'),
          }}
        />
      )}

      {/* 전문가 그리드 */}
      {!isLoading && experts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* 페이지 정보 */}
              <p className="text-sm text-gray-500 order-2 sm:order-1">
                {page} / {totalPages} 페이지
              </p>

              {/* 페이지 버튼 */}
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

// 페이지 번호 생성 헬퍼
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  // 항상 첫 페이지 표시
  pages.push(1)

  if (current > 4) {
    pages.push('...')
  }

  // 현재 페이지 주변
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  if (current < total - 3) {
    pages.push('...')
  }

  // 항상 마지막 페이지 표시
  if (!pages.includes(total)) {
    pages.push(total)
  }

  return pages
}

export default function ExpertsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="페이지 로딩 중..." />
      </div>
    }>
      <ExpertsContent />
    </Suspense>
  )
}
