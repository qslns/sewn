'use client'

// ===========================
// 계약 관리 페이지
// ===========================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES, CONTRACT_STATUS_LABELS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { ContractStatus } from '@/types'

interface ContractWithDetails {
  id: string
  project_id: string
  client_id: string
  expert_id: string
  agreed_amount: number
  platform_fee_rate: number
  status: ContractStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
  project: { title: string }
  client: { name: string; profile_image_url: string | null }
  expert: { name: string; profile_image_url: string | null }
}

export default function ContractsPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [contracts, setContracts] = useState<ContractWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ContractStatus>('all')

  const isExpert = profile?.user_type === 'expert' || profile?.user_type === 'both'
  const isClient = profile?.user_type === 'client' || profile?.user_type === 'both'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    const fetchContracts = async () => {
      if (!user) return

      setIsLoading(true)

      try {
        let query = supabase
          .from('contracts')
          .select(
            `
            *,
            project:projects (title),
            client:users!contracts_client_id_fkey (name, profile_image_url),
            expert:users!contracts_expert_id_fkey (name, profile_image_url)
          `
          )
          .or(`client_id.eq.${user.id},expert_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        setContracts((data as ContractWithDetails[]) || [])
      } catch (error) {
        console.error('Failed to fetch contracts:', error)
        showToast('error', '계약 목록을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContracts()
  }, [user, authLoading, router, supabase, showToast])

  const filteredContracts =
    filter === 'all'
      ? contracts
      : contracts.filter((c) => c.status === filter)

  const handleCompleteContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', contractId)

      if (error) throw error

      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? { ...c, status: 'completed' as ContractStatus, completed_at: new Date().toISOString() }
            : c
        )
      )

      showToast('success', '계약이 완료되었습니다. 리뷰를 작성해주세요!')
    } catch (error) {
      console.error('Failed to complete contract:', error)
      showToast('error', '처리에 실패했습니다.')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="계약 목록을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">계약 관리</h1>
        <p className="text-gray-600 mt-1">
          진행 중인 계약과 완료된 계약을 확인하세요.
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: '전체' },
          { value: 'pending_payment', label: '결제 대기' },
          { value: 'in_progress', label: '진행중' },
          { value: 'completed', label: '완료' },
          { value: 'disputed', label: '분쟁중' },
        ].map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value as 'all' | ContractStatus)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* 계약 목록 */}
      {filteredContracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="계약이 없습니다"
          description={
            isClient
              ? '프로젝트를 등록하고 전문가와 계약을 시작해보세요.'
              : '프로젝트에 제안서를 보내고 계약을 시작해보세요.'
          }
          action={{
            label: isClient ? '프로젝트 등록' : '프로젝트 찾기',
            onClick: () =>
              router.push(isClient ? ROUTES.PROJECT_NEW : ROUTES.PROJECTS),
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const isClientView = contract.client_id === user?.id
            const otherParty = isClientView ? contract.expert : contract.client

            return (
              <Card key={contract.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={otherParty.profile_image_url}
                        alt={otherParty.name}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {otherParty.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isClientView ? '전문가' : '클라이언트'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        contract.status === 'completed'
                          ? 'success'
                          : contract.status === 'in_progress'
                          ? 'warning'
                          : contract.status === 'disputed'
                          ? 'danger'
                          : 'secondary'
                      }
                    >
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </div>

                  <Link
                    href={ROUTES.PROJECT_DETAIL(contract.project_id)}
                    className="text-lg font-semibold text-gray-900 hover:underline"
                  >
                    {contract.project.title}
                  </Link>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">계약 금액</p>
                      <p className="font-semibold">
                        {formatPrice(contract.agreed_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">수수료율</p>
                      <p className="font-semibold">
                        {(contract.platform_fee_rate * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">시작일</p>
                      <p className="font-semibold">
                        {contract.started_at
                          ? formatDate(contract.started_at)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">완료일</p>
                      <p className="font-semibold">
                        {contract.completed_at
                          ? formatDate(contract.completed_at)
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                    {contract.status === 'in_progress' && isClientView && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteContract(contract.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        작업 완료 확인
                      </Button>
                    )}

                    {contract.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        리뷰 작성
                      </Button>
                    )}

                    {contract.status === 'pending_payment' && isClientView && (
                      <Button size="sm">결제하기</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
