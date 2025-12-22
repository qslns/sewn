'use client'

// ===========================
// 프로젝트 데이터 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PAGINATION } from '@/lib/constants'
import type { Project, ProjectFilters, PaginatedResponse } from '@/types'

interface UseProjectsOptions {
  filters?: ProjectFilters
  page?: number
  limit?: number
}

type ProjectWithClient = Project & {
  client: { name: string; profile_image_url: string | null }
  _count?: { proposals: number }
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { filters = {}, page = 1, limit = PAGINATION.DEFAULT_LIMIT } = options
  const supabase = getSupabaseClient()

  const [data, setData] = useState<ProjectWithClient[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('projects')
        .select(
          `
          *,
          client:users!projects_client_id_fkey (
            name,
            profile_image_url
          )
        `,
          { count: 'exact' }
        )
        .eq('status', filters.status || 'open')

      // 카테고리 필터
      if (filters.categories && filters.categories.length > 0) {
        query = query.contains('categories', filters.categories)
      }

      // 예산 범위 필터
      if (filters.minBudget) {
        query = query.gte('budget_min', filters.minBudget)
      }
      if (filters.maxBudget) {
        query = query.lte('budget_max', filters.maxBudget)
      }

      // 검색어 필터
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      // 정렬 (최신순)
      query = query.order('created_at', { ascending: false })

      // 페이지네이션
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: projects, error: queryError, count: totalCount } = await query

      if (queryError) throw queryError

      setData((projects as ProjectWithClient[]) || [])
      setCount(totalCount || 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, filters, page, limit])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const totalPages = Math.ceil(count / limit)

  return {
    data,
    count,
    isLoading,
    error,
    page,
    limit,
    totalPages,
    refetch: fetchProjects,
  }
}

// 단일 프로젝트 조회
export function useProject(id: string) {
  const supabase = getSupabaseClient()
  const [data, setData] = useState<ProjectWithClient | null>(null)
  const [proposals, setProposals] = useState<
    {
      id: string
      cover_letter: string
      proposed_rate: number
      estimated_duration: string | null
      status: string
      created_at: string
      expert: {
        id: string
        rating_avg: number
        review_count: number
        user: { name: string; profile_image_url: string | null }
      }
    }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProject = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 프로젝트 조회
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(
          `
          *,
          client:users!projects_client_id_fkey (
            id,
            name,
            profile_image_url,
            email
          )
        `
        )
        .eq('id', id)
        .single()

      if (projectError) throw projectError

      setData(project as unknown as ProjectWithClient)

      // 제안서 조회
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(
          `
          *,
          expert:expert_profiles (
            id,
            rating_avg,
            review_count,
            user:users!expert_profiles_user_id_fkey (
              name,
              profile_image_url
            )
          )
        `
        )
        .eq('project_id', id)
        .order('created_at', { ascending: false })

      if (proposalError) throw proposalError

      setProposals(proposalData || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id, fetchProject])

  return { data, proposals, isLoading, error, refetch: fetchProject }
}

// 내 프로젝트 목록 (클라이언트용)
export function useMyProjects(userId: string | null) {
  const supabase = getSupabaseClient()
  const [data, setData] = useState<ProjectWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchProjects = async () => {
      setIsLoading(true)

      const { data: projects } = await supabase
        .from('projects')
        .select(
          `
          *,
          client:users!projects_client_id_fkey (
            name,
            profile_image_url
          )
        `
        )
        .eq('client_id', userId)
        .order('created_at', { ascending: false })

      setData((projects as ProjectWithClient[]) || [])
      setIsLoading(false)
    }

    fetchProjects()
  }, [supabase, userId])

  return { data, isLoading }
}
