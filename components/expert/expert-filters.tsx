'use client'

// ===========================
// 전문가 필터 컴포넌트
// ===========================

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  EXPERT_CATEGORIES,
  EXPERT_CATEGORY_GROUPS,
  LOCATIONS,
  HOURLY_RATE_RANGES,
  AVAILABILITY_LABELS,
} from '@/lib/constants'
import { Search, SlidersHorizontal, X, Star } from 'lucide-react'
import { CATEGORY_LABELS, SORT_LABELS, type ExpertCategory, type AvailabilityStatus, type SortOption } from '@/types'

interface ExpertFiltersProps {
  className?: string
}

// 평점 필터 옵션
const RATING_OPTIONS = [
  { value: '', label: '전체' },
  { value: '4.5', label: '4.5점 이상' },
  { value: '4.0', label: '4.0점 이상' },
  { value: '3.5', label: '3.5점 이상' },
  { value: '3.0', label: '3.0점 이상' },
]

export function ExpertFilters({ className }: ExpertFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)

  const currentCategory = searchParams.get('category') as ExpertCategory | null
  const currentLocation = searchParams.get('location')
  const currentAvailability = searchParams.get('availability') as AvailabilityStatus | null
  const currentMinRate = searchParams.get('minRate')
  const currentMaxRate = searchParams.get('maxRate')
  const currentSort = (searchParams.get('sort') as SortOption) || 'recommended'
  const currentMinRating = searchParams.get('minRating')

  const hasActiveFilters =
    currentCategory || currentLocation || currentAvailability || currentMinRate || currentMinRating

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // 페이지 리셋
    params.delete('page')

    router.push(`/experts?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (currentSort && currentSort !== 'recommended') {
      params.set('sort', currentSort)
    }
    router.push(`/experts${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
    setSearch('')
  }, [router, currentSort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: search || null })
  }

  return (
    <div className={className}>
      {/* 상단: 검색, 정렬, 필터 토글 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            type="text"
            placeholder="이름, 스킬로 검색..."
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

        {/* 정렬 */}
        <div className="flex gap-2">
          <Select
            options={Object.entries(SORT_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-36"
          />

          {/* 필터 버튼 */}
          <Button
            variant={showFilters || hasActiveFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">필터</span>
            {hasActiveFilters && (
              <span className="ml-1 h-5 w-5 rounded-full bg-black text-white text-xs flex items-center justify-center">
                {[currentCategory, currentLocation, currentAvailability, currentMinRate, currentMinRating].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="mt-4 p-6 bg-gray-50 rounded-xl space-y-6">
          {/* 카테고리 그룹별 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">전문 분야</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(EXPERT_CATEGORY_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">{group.label}</p>
                  <div className="space-y-1">
                    {EXPERT_CATEGORIES.filter((c) => c.group === groupKey).map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() =>
                          updateFilters({
                            category: currentCategory === cat.value ? null : cat.value,
                          })
                        }
                        className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          currentCategory === cat.value
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 기타 필터 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* 지역 */}
            <Select
              label="지역"
              options={[
                { value: '', label: '전체' },
                ...LOCATIONS.map((loc) => ({ value: loc, label: loc })),
              ]}
              value={currentLocation || ''}
              onChange={(e) =>
                updateFilters({ location: e.target.value || null })
              }
            />

            {/* 시급 범위 */}
            <Select
              label="시급 범위"
              options={[
                { value: '', label: '전체' },
                ...HOURLY_RATE_RANGES.map((range) => ({
                  value: `${range.min}-${range.max || 'max'}`,
                  label: range.label,
                })),
              ]}
              value={
                currentMinRate && currentMaxRate
                  ? `${currentMinRate}-${currentMaxRate}`
                  : currentMinRate
                  ? `${currentMinRate}-max`
                  : ''
              }
              onChange={(e) => {
                if (!e.target.value) {
                  updateFilters({ minRate: null, maxRate: null })
                } else {
                  const [min, max] = e.target.value.split('-')
                  updateFilters({
                    minRate: min,
                    maxRate: max === 'max' ? null : max,
                  })
                }
              }}
            />

            {/* 평점 */}
            <Select
              label="최소 평점"
              options={RATING_OPTIONS}
              value={currentMinRating || ''}
              onChange={(e) =>
                updateFilters({ minRating: e.target.value || null })
              }
            />

            {/* 가용 상태 */}
            <Select
              label="가용 상태"
              options={[
                { value: '', label: '전체' },
                ...Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              value={currentAvailability || ''}
              onChange={(e) =>
                updateFilters({ availability: e.target.value || null })
              }
            />
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                필터 초기화
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 활성 필터 태그 */}
      {hasActiveFilters && !showFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {currentCategory && (
            <FilterTag
              label={CATEGORY_LABELS[currentCategory]}
              onRemove={() => updateFilters({ category: null })}
            />
          )}
          {currentLocation && (
            <FilterTag
              label={currentLocation}
              onRemove={() => updateFilters({ location: null })}
            />
          )}
          {currentAvailability && (
            <FilterTag
              label={AVAILABILITY_LABELS[currentAvailability]}
              onRemove={() => updateFilters({ availability: null })}
            />
          )}
          {currentMinRating && (
            <FilterTag
              icon={<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              label={`${currentMinRating}점 이상`}
              onRemove={() => updateFilters({ minRating: null })}
            />
          )}
          {currentMinRate && (
            <FilterTag
              label={HOURLY_RATE_RANGES.find(r => String(r.min) === currentMinRate)?.label || `${Number(currentMinRate).toLocaleString()}원 이상`}
              onRemove={() => updateFilters({ minRate: null, maxRate: null })}
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
  )
}

// 필터 태그 컴포넌트
function FilterTag({
  label,
  icon,
  onRemove,
}: {
  label: string
  icon?: React.ReactNode
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
      {icon}
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
