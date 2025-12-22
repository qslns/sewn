'use client'

// ===========================
// 대시보드 데이터 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Project, ExpertProfile } from '@/types'

// 클라이언트 대시보드 통계
export interface ClientStats {
  totalProjects: number
  openProjects: number
  inProgressProjects: number
  completedProjects: number
  totalProposalsReceived: number
  pendingProposals: number
}

// 전문가 대시보드 통계
export interface ExpertStats {
  totalProposals: number
  pendingProposals: number
  acceptedProposals: number
  rejectedProposals: number
  inProgressProjects: number
  completedProjects: number
  totalEarnings: number
  averageRating: number
  reviewCount: number
}

// 프로젝트 with 클라이언트 정보
type ProjectWithClient = Project & {
  client: { id: string; name: string; profile_image_url: string | null }
  proposals?: { id: string; status: string }[]
}

// 제안서 with 프로젝트 정보
interface ProposalWithProject {
  id: string
  project_id: string
  expert_id: string
  cover_letter: string
  proposed_rate: number
  estimated_duration: string | null
  status: string
  created_at: string
  project: {
    id: string
    title: string
    status: string
    budget_min: number | null
    budget_max: number | null
    deadline: string | null
    client: { name: string; profile_image_url: string | null }
  }
}

// 클라이언트 대시보드 훅
export function useClientDashboard(userId: string | null) {
  const supabase = getSupabaseClient()
  const [stats, setStats] = useState<ClientStats>({
    totalProjects: 0,
    openProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalProposalsReceived: 0,
    pendingProposals: 0,
  })
  const [myProjects, setMyProjects] = useState<ProjectWithClient[]>([])
  const [recentProposals, setRecentProposals] = useState<{
    id: string
    project_id: string
    status: string
    created_at: string
    proposed_rate: number
    expert: { id: string; user: { name: string; profile_image_url: string | null } }
    project: { title: string }
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // 내 프로젝트 목록
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          client:users!projects_client_id_fkey (
            id,
            name,
            profile_image_url
          )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })

      if (projects) {
        setMyProjects(projects as ProjectWithClient[])

        // 통계 계산
        const openCount = projects.filter(p => p.status === 'open').length
        const inProgressCount = projects.filter(p => p.status === 'in_progress').length
        const completedCount = projects.filter(p => p.status === 'completed').length

        // 제안서 수 조회
        const projectIds = projects.map(p => p.id)
        if (projectIds.length > 0) {
          const { data: proposalsData, count } = await supabase
            .from('proposals')
            .select('id, status, project_id', { count: 'exact' })
            .in('project_id', projectIds)

          const pendingCount = proposalsData?.filter(p => p.status === 'pending').length || 0

          setStats({
            totalProjects: projects.length,
            openProjects: openCount,
            inProgressProjects: inProgressCount,
            completedProjects: completedCount,
            totalProposalsReceived: count || 0,
            pendingProposals: pendingCount,
          })

          // 최근 제안서 조회
          const { data: recentProposalsData } = await supabase
            .from('proposals')
            .select(`
              id,
              project_id,
              status,
              created_at,
              proposed_rate,
              expert:expert_profiles (
                id,
                user:users!expert_profiles_user_id_fkey (
                  name,
                  profile_image_url
                )
              ),
              project:projects (
                title
              )
            `)
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(5)

          if (recentProposalsData) {
            setRecentProposals(recentProposalsData as any)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch client dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    myProjects,
    recentProposals,
    isLoading,
    refetch: fetchData,
  }
}

// 전문가 대시보드 훅
export function useExpertDashboard(userId: string | null) {
  const supabase = getSupabaseClient()
  const [stats, setStats] = useState<ExpertStats>({
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 0,
    reviewCount: 0,
  })
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null)
  const [myProposals, setMyProposals] = useState<ProposalWithProject[]>([])
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // 전문가 프로필 조회
      const { data: profile } = await supabase
        .from('expert_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        setIsLoading(false)
        return
      }

      setExpertProfile(profile as ExpertProfile)

      // 내 제안서 목록
      const { data: proposals } = await supabase
        .from('proposals')
        .select(`
          *,
          project:projects (
            id,
            title,
            status,
            budget_min,
            budget_max,
            deadline,
            client:users!projects_client_id_fkey (
              name,
              profile_image_url
            )
          )
        `)
        .eq('expert_id', profile.id)
        .order('created_at', { ascending: false })

      if (proposals) {
        setMyProposals(proposals as ProposalWithProject[])

        // 통계 계산
        const pendingCount = proposals.filter(p => p.status === 'pending').length
        const acceptedCount = proposals.filter(p => p.status === 'accepted').length
        const rejectedCount = proposals.filter(p => p.status === 'rejected').length

        // 진행중/완료 프로젝트
        const acceptedProposals = proposals.filter(p => p.status === 'accepted')
        const inProgressCount = acceptedProposals.filter(p => p.project?.status === 'in_progress').length
        const completedCount = acceptedProposals.filter(p => p.project?.status === 'completed').length

        // 총 수익 계산 (완료된 프로젝트)
        const totalEarnings = acceptedProposals
          .filter(p => p.project?.status === 'completed')
          .reduce((sum, p) => sum + (p.proposed_rate || 0), 0)

        setStats({
          totalProposals: proposals.length,
          pendingProposals: pendingCount,
          acceptedProposals: acceptedCount,
          rejectedProposals: rejectedCount,
          inProgressProjects: inProgressCount,
          completedProjects: completedCount,
          totalEarnings,
          averageRating: profile.rating_avg || 0,
          reviewCount: profile.review_count || 0,
        })
      }

      // 추천 프로젝트 (전문가 카테고리와 매칭)
      if (profile.categories && profile.categories.length > 0) {
        const { data: recommendedData } = await supabase
          .from('projects')
          .select(`
            *,
            client:users!projects_client_id_fkey (
              id,
              name,
              profile_image_url
            )
          `)
          .eq('status', 'open')
          .contains('categories', [profile.categories[0]])
          .order('created_at', { ascending: false })
          .limit(5)

        if (recommendedData) {
          setRecommendedProjects(recommendedData as ProjectWithClient[])
        }
      }
    } catch (error) {
      console.error('Failed to fetch expert dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    expertProfile,
    myProposals,
    recommendedProjects,
    isLoading,
    refetch: fetchData,
  }
}
