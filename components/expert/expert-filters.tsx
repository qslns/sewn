'use client'

// ===========================
// 전문가 필터 컴포넌트
// ===========================

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  EXPERT_CATEGORIES,
  LOCATIONS,
  HOURLY_RATE_RANGES,
  AVAILABILITY_LABELS,
} from '@/lib/constants'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORY_LABELS, type ExpertCategory, type AvailabilityStatus } from '@/types'

interface ExpertFiltersProps {
  className?: string
}

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

  const hasActiveFilters =
    currentCategory || currentLocation || currentAvailability || currentMinRate

  const updateFilters = (updates: Record<string, string | null>) => {
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

    router.push(`/experts?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/experts')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: search || null })
  }

  return (
    <div className={className}>
      {/* 검색 및 필터 토글 */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            type="text"
            placeholder="전문가 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
            rightIcon={
              search && (
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
              )
            }
          />
        </form>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          필터
          {hasActiveFilters && (
            <span className="ml-1 h-5 w-5 rounded-full bg-black text-white text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 카테고리 */}
            <Select
              label="전문 분야"
              options={[
                { value: '', label: '전체' },
                ...EXPERT_CATEGORIES.map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                })),
              ]}
              value={currentCategory || ''}
              onChange={(e) =>
                updateFilters({ category: e.target.value || null })
              }
            />

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
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                필터 초기화
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 활성 필터 태그 */}
      {hasActiveFilters && !showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
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
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-black"
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
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 rounded-full"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
