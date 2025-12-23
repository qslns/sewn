'use client'

// ===========================
// 계약 목록 페이지
// ===========================

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { useContracts } from '@/hooks/useContracts'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import type { ContractStatus } from '@/types'

const STATUS_CONFIG: Record<ContractStatus, {
  label: string
  color: 'warning' | 'accent' | 'secondary' | 'success' | 'danger'
  icon: React.ReactNode
}> = {
  pending_payment: {
    label: '결제 대기',
    color: 'warning',
    icon: <CreditCard className="h-4 w-4" />,
  },
  in_progress: {
    label: '진행 중',
    color: 'accent',
    icon: <Clock className="h-4 w-4" />,
  },
  pending_approval: {
    label: '완료 승인 대기',
    color: 'secondary',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  completed: {
    label: '완료',
    color: 'success',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  disputed: {
    label: '분쟁 중',
    color: 'danger',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: '취소됨',
    color: 'secondary',
    icon: <XCircle className="h-4 w-4" />,
  },
}

type FilterTab = 'all' | 'active' | 'completed'

export default function ContractsPage() {
  const { user, profile } = useAuth()
  const { contracts, isLoading } = useContracts(user?.id || null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const isExpert = profile?.user_type === 'expert' || profile?.user_type === 'both'

  const filteredContracts = contracts.filter((contract) => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') {
      return ['pending_payment', 'in_progress', 'pending_approval'].includes(contract.status)
    }
    if (activeTab === 'completed') {
      return ['completed', 'cancelled'].includes(contract.status)
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="계약 목록을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">계약 관리</h1>
        <p className="text-gray-600">
          {isExpert ? '진행 중인 프로젝트와 완료된 계약을 확인하세요.' : '의뢰한 프로젝트의 계약 현황을 확인하세요.'}
        </p>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'all', label: '전체' },
          { key: 'active', label: '진행 중' },
          { key: 'completed', label: '완료' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FilterTab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {tab.key === 'active' && (
              <span className="ml-2 bg-accent-camel text-white text-xs px-2 py-0.5 rounded-full">
                {contracts.filter(c => ['pending_payment', 'in_progress', 'pending_approval'].includes(c.status)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 계약 목록 */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">계약이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              {isExpert
                ? '프로젝트에 제안서를 보내 계약을 시작하세요.'
                : '프로젝트를 등록하고 전문가의 제안서를 수락하면 계약이 생성됩니다.'}
            </p>
            <Link href={isExpert ? '/projects' : '/projects/new'}>
              <Button>
                {isExpert ? '프로젝트 찾기' : '프로젝트 등록하기'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const statusConfig = STATUS_CONFIG[contract.status]
            const isClient = contract.client_id === user?.id
            const otherParty = isClient
              ? { name: contract.expert_name, image: contract.expert_image }
              : { name: contract.client_name, image: contract.client_image }

            return (
              <Link key={contract.id} href={`/contracts/${contract.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar
                          src={otherParty.image}
                          alt={otherParty.name || '사용자'}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={statusConfig.color} className="flex items-center gap-1">
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate mb-1">
                            {contract.project_title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {isClient ? '전문가' : '클라이언트'}: {otherParty.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(contract.agreed_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contract.deadline
                            ? `마감: ${formatDate(contract.deadline)}`
                            : formatDate(contract.created_at)}
                        </p>
                        <ArrowRight className="h-5 w-5 text-gray-400 ml-auto mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
