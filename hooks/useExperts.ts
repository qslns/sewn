'use client'

// ===========================
// 전문가 데이터 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PAGINATION } from '@/lib/constants'
import type { ExpertProfile, ExpertFilters, PaginatedResponse } from '@/types'

interface UseExpertsOptions {
  filters?: ExpertFilters
  page?: number
  limit?: number
}

type ExpertWithUser = ExpertProfile & {
  user: { name: string; profile_image_url: string | null }
}

export function useExperts(options: UseExpertsOptions = {}) {
  const { filters = {}, page = 1, limit = PAGINATION.DEFAULT_LIMIT } = options
  const supabase = getSupabaseClient()

  const [data, setData] = useState<ExpertWithUser[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchExperts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('expert_profiles')
        .select(
          `
          *,
          user:users!expert_profiles_user_id_fkey (
            name,
            profile_image_url
          )
        `,
          { count: 'exact' }
        )

      // 카테고리 필터
      if (filters.categories && filters.categories.length > 0) {
        query = query.contains('categories', filters.categories)
      }

      // 가용 상태 필터
      if (filters.availability) {
        query = query.eq('availability', filters.availability)
      }

      // 지역 필터
      if (filters.location) {
        query = query.eq('location', filters.location)
      }

      // 시급 범위 필터
      if (filters.minRate) {
        query = query.gte('hourly_rate_min', filters.minRate)
      }
      if (filters.maxRate) {
        query = query.lte('hourly_rate_max', filters.maxRate)
      }

      // 검색어 필터 (이름 또는 스킬에서 검색)
      if (filters.search) {
        query = query.or(
          `user.name.ilike.%${filters.search}%,skills.cs.{${filters.search}}`
        )
      }

      // 정렬 (평점 높은 순, 리뷰 많은 순)
      query = query
        .order('rating_avg', { ascending: false })
        .order('review_count', { ascending: false })

      // 페이지네이션
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: experts, error: queryError, count: totalCount } = await query

      if (queryError) throw queryError

      setData((experts as ExpertWithUser[]) || [])
      setCount(totalCount || 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch experts'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, filters, page, limit])

  useEffect(() => {
    fetchExperts()
  }, [fetchExperts])

  const totalPages = Math.ceil(count / limit)

  return {
    data,
    count,
    isLoading,
    error,
    page,
    limit,
    totalPages,
    refetch: fetchExperts,
  }
}

// 단일 전문가 조회
export function useExpert(id: string) {
  const supabase = getSupabaseClient()
  const [data, setData] = useState<ExpertWithUser | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<
    { id: string; title: string; image_urls: string[]; description: string | null }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchExpert = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 전문가 프로필 조회
        const { data: expert, error: expertError } = await supabase
          .from('expert_profiles')
          .select(
            `
            *,
            user:users!expert_profiles_user_id_fkey (
              id,
              name,
              profile_image_url,
              email
            )
          `
          )
          .eq('id', id)
          .single()

        if (expertError) throw expertError

        setData(expert as unknown as ExpertWithUser)

        // 포트폴리오 조회
        const { data: portfolio, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('id, title, image_urls, description')
          .eq('expert_id', id)
          .order('created_at', { ascending: false })

        if (portfolioError) throw portfolioError

        setPortfolioItems(portfolio || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch expert'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchExpert()
    }
  }, [supabase, id])

  return { data, portfolioItems, isLoading, error }
}
