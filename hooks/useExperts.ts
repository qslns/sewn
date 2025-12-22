'use client'

// ===========================
// 전문가 데이터 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PAGINATION } from '@/lib/constants'
import type { ExpertProfile, ExpertFilters, SortOption } from '@/types'

interface UseExpertsOptions {
  filters?: ExpertFilters
  page?: number
  limit?: number
}

export type ExpertWithUser = ExpertProfile & {
  user: { id: string; name: string; profile_image_url: string | null }
  portfolio_preview?: string[]
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
            id,
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

      // 최소 평점 필터
      if (filters.minRating) {
        query = query.gte('rating_avg', filters.minRating)
      }

      // 검색어 필터
      if (filters.search) {
        query = query.or(
          `bio.ilike.%${filters.search}%,skills.cs.{${filters.search}}`
        )
      }

      // 정렬
      const sort = filters.sort || 'recommended'
      switch (sort) {
        case 'rating':
          query = query.order('rating_avg', { ascending: false })
          break
        case 'reviews':
          query = query.order('review_count', { ascending: false })
          break
        case 'latest':
          query = query.order('created_at', { ascending: false })
          break
        case 'price_low':
          query = query.order('hourly_rate_min', { ascending: true, nullsFirst: false })
          break
        case 'price_high':
          query = query.order('hourly_rate_max', { ascending: false, nullsFirst: false })
          break
        case 'recommended':
        default:
          // 추천순: 평점 * 리뷰수 + 완료 프로젝트 수
          query = query
            .order('rating_avg', { ascending: false })
            .order('review_count', { ascending: false })
            .order('completed_projects', { ascending: false })
          break
      }

      // 페이지네이션
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: experts, error: queryError, count: totalCount } = await query

      if (queryError) throw queryError

      // 포트폴리오 미리보기 가져오기
      const expertIds = (experts || []).map((e) => e.id)
      let portfolioMap: Record<string, string[]> = {}

      if (expertIds.length > 0) {
        const { data: portfolios } = await supabase
          .from('portfolio_items')
          .select('expert_id, image_urls')
          .in('expert_id', expertIds)
          .order('created_at', { ascending: false })

        if (portfolios) {
          portfolioMap = portfolios.reduce((acc, item) => {
            if (!acc[item.expert_id]) {
              acc[item.expert_id] = []
            }
            if (item.image_urls && item.image_urls.length > 0) {
              acc[item.expert_id].push(item.image_urls[0])
            }
            return acc
          }, {} as Record<string, string[]>)
        }
      }

      // 전문가 데이터에 포트폴리오 미리보기 추가
      const expertsWithPortfolio = (experts || []).map((expert) => ({
        ...expert,
        portfolio_preview: portfolioMap[expert.id]?.slice(0, 3) || [],
      })) as ExpertWithUser[]

      setData(expertsWithPortfolio)
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
    { id: string; title: string; image_urls: string[]; description: string | null; category: string | null }[]
  >([])
  const [reviews, setReviews] = useState<
    { id: string; rating: number; comment: string | null; created_at: string; reviewer: { name: string; profile_image_url: string | null } }[]
  >([])
  const [similarExperts, setSimilarExperts] = useState<ExpertWithUser[]>([])
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
          .select('id, title, image_urls, description, category')
          .eq('expert_id', id)
          .order('created_at', { ascending: false })

        if (portfolioError) throw portfolioError

        setPortfolioItems(portfolio || [])

        // 리뷰 조회
        const { data: reviewData } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:users!reviews_reviewer_id_fkey (
              name,
              profile_image_url
            )
          `)
          .eq('reviewee_id', expert.user_id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (reviewData) {
          setReviews(reviewData as unknown as typeof reviews)
        }

        // 유사 전문가 조회 (같은 카테고리)
        if (expert.categories && expert.categories.length > 0) {
          const { data: similar } = await supabase
            .from('expert_profiles')
            .select(`
              *,
              user:users!expert_profiles_user_id_fkey (
                id,
                name,
                profile_image_url
              )
            `)
            .neq('id', id)
            .contains('categories', [expert.categories[0]])
            .order('rating_avg', { ascending: false })
            .limit(4)

          if (similar) {
            setSimilarExperts(similar as ExpertWithUser[])
          }
        }
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

  return { data, portfolioItems, reviews, similarExperts, isLoading, error }
}
