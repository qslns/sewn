'use client'

// ===========================
// 전문가 목록 페이지
// ===========================

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExpertCard } from '@/components/expert/expert-card'
import { ExpertFilters } from '@/components/expert/expert-filters'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useExperts } from '@/hooks/useExperts'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExpertCategory, AvailabilityStatus } from '@/types'

function ExpertsContent() {
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') as ExpertCategory | null
  const location = searchParams.get('location')
  const availability = searchParams.get('availability') as AvailabilityStatus | null
  const minRate = searchParams.get('minRate')
  const maxRate = searchParams.get('maxRate')
  const search = searchParams.get('search')

  const { data: experts, count, isLoading, totalPages } = useExperts({
    page,
    filters: {
      categories: category ? [category] : undefined,
      location: location || undefined,
      availability: availability || undefined,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      search: search || undefined,
    },
  })

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    window.history.pushState(null, '', `?${params.toString()}`)
    window.location.reload()
  }

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
      <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse" />}>
        <ExpertFilters className="mb-8" />
      </Suspense>

      {/* 결과 수 */}
      {!isLoading && (
        <div className="mb-6 text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{count}</span>명의 전문가
        </div>
      )}

      {/* 로딩 */}
      {isLoading && <LoadingState message="전문가를 불러오는 중..." />}

      {/* 빈 상태 */}
      {!isLoading && experts.length === 0 && (
        <EmptyState
          icon={Users}
          title="전문가를 찾을 수 없습니다"
          description="검색 조건을 변경하거나 필터를 초기화해보세요."
          action={{
            label: '필터 초기화',
            onClick: () => (window.location.href = '/experts'),
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

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
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

export default function ExpertsPage() {
  return (
    <Suspense fallback={<LoadingState message="페이지 로딩 중..." />}>
      <ExpertsContent />
    </Suspense>
  )
}
