'use client'

// ===========================
// 계약 훅
// ===========================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Contract, ContractStatus } from '@/types'

interface UseContractsReturn {
  contracts: Contract[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseContractReturn {
  contract: Contract | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateStatus: (status: ContractStatus) => Promise<void>
  requestCompletion: () => Promise<void>
  approveCompletion: () => Promise<void>
}

// 계약 목록 가져오기
export function useContracts(userId: string | null): UseContractsReturn {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = getSupabaseClient()

  const fetchContracts = useCallback(async () => {
    if (!userId) {
      setContracts([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      // contract_details 뷰 사용
      const { data, error: fetchError } = await supabase
        .from('contract_details')
        .select('*')
        .or(`client_id.eq.${userId},expert_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setContracts(data || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch contracts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // 실시간 구독
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`contracts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
        },
        () => {
          fetchContracts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchContracts])

  return { contracts, isLoading, error, refetch: fetchContracts }
}

// 단일 계약 가져오기
export function useContract(contractId: string | null): UseContractReturn {
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = getSupabaseClient()

  const fetchContract = useCallback(async () => {
    if (!contractId) {
      setContract(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('contract_details')
        .select('*')
        .eq('id', contractId)
        .single()

      if (fetchError) throw fetchError

      setContract(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch contract:', err)
    } finally {
      setIsLoading(false)
    }
  }, [contractId, supabase])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  // 계약 상태 업데이트
  const updateStatus = async (status: ContractStatus) => {
    if (!contractId) return

    try {
      const updateData: Partial<Contract> = { status }

      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)

      if (updateError) throw updateError

      await fetchContract()
    } catch (err) {
      console.error('Failed to update contract status:', err)
      throw err
    }
  }

  // 완료 요청 (전문가)
  const requestCompletion = async () => {
    if (!contractId) return

    try {
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'pending_approval',
          completion_requested_at: new Date().toISOString(),
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      await fetchContract()
    } catch (err) {
      console.error('Failed to request completion:', err)
      throw err
    }
  }

  // 완료 승인 (클라이언트)
  const approveCompletion = async () => {
    if (!contractId) return

    try {
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      await fetchContract()
    } catch (err) {
      console.error('Failed to approve completion:', err)
      throw err
    }
  }

  return {
    contract,
    isLoading,
    error,
    refetch: fetchContract,
    updateStatus,
    requestCompletion,
    approveCompletion,
  }
}

// 전문가 수익 조회
export function useExpertEarnings(userId: string | null) {
  const [earnings, setEarnings] = useState<{
    totalEarnings: number
    pendingEarnings: number
    thisMonthEarnings: number
    completedContracts: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!userId) {
        setEarnings(null)
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('expert_earnings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setEarnings({
            totalEarnings: data.total_earnings || 0,
            pendingEarnings: data.pending_earnings || 0,
            thisMonthEarnings: data.this_month_earnings || 0,
            completedContracts: data.completed_contracts || 0,
          })
        } else {
          setEarnings({
            totalEarnings: 0,
            pendingEarnings: 0,
            thisMonthEarnings: 0,
            completedContracts: 0,
          })
        }
      } catch (err) {
        console.error('Failed to fetch earnings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEarnings()
  }, [userId, supabase])

  return { earnings, isLoading }
}
