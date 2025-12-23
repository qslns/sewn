'use client'

// ===========================
// 수익 현황 페이지
// ===========================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/spinner'
import { useExpertEarnings, useContracts } from '@/hooks/useContracts'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'

export default function EarningsPage() {
  const { user, profile } = useAuth()
  const { earnings, isLoading: earningsLoading } = useExpertEarnings(user?.id || null)
  const { contracts, isLoading: contractsLoading } = useContracts(user?.id || null)

  const isLoading = earningsLoading || contractsLoading

  // 완료된 계약만 필터링 (정산 내역)
  const completedContracts = contracts
    .filter((c) => c.status === 'completed' && c.expert_id === user?.id)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())

  // 진행 중인 계약 (예정 수익)
  const activeContracts = contracts.filter(
    (c) => ['in_progress', 'pending_approval'].includes(c.status) && c.expert_id === user?.id
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="수익 현황을 불러오는 중..." />
      </div>
    )
  }

  // 전문가가 아닌 경우
  if (profile?.user_type === 'client') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          수익 현황은 전문가만 확인할 수 있습니다
        </h1>
        <p className="text-gray-600">
          전문가로 활동을 시작하려면 프로필을 업데이트하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">수익 현황</h1>

      {/* 수익 요약 카드 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-accent-camel to-accent-camel/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="h-8 w-8 opacity-80" />
              <TrendingUp className="h-5 w-5 opacity-60" />
            </div>
            <p className="text-sm opacity-80 mb-1">총 수익</p>
            <p className="text-3xl font-bold">
              {formatPrice(earnings?.totalEarnings || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-blue-500" />
              <Badge variant="accent">이번 달</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-1">이번 달 수익</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(earnings?.thisMonthEarnings || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary">예정</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-1">정산 예정</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(earnings?.pendingEarnings || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 진행 중인 프로젝트 */}
      {activeContracts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              진행 중인 프로젝트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={ROUTES.CONTRACT_DETAIL(contract.id)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{contract.project_title}</p>
                    <p className="text-sm text-gray-500">{contract.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(contract.expert_amount || contract.agreed_amount * (1 - contract.platform_fee_rate))}
                    </p>
                    <Badge
                      variant={contract.status === 'pending_approval' ? 'warning' : 'accent'}
                      className="mt-1"
                    >
                      {contract.status === 'pending_approval' ? '승인 대기' : '진행 중'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정산 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            정산 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedContracts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>아직 정산된 내역이 없습니다.</p>
              <p className="text-sm mt-2">
                프로젝트를 완료하면 여기에 정산 내역이 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {completedContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={ROUTES.CONTRACT_DETAIL(contract.id)}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {contract.project_title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {contract.completed_at && formatDate(contract.completed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-green-600">
                      +{formatPrice(contract.expert_amount || contract.agreed_amount * (1 - contract.platform_fee_rate))}
                    </p>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">수익 통계</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {earnings?.completedContracts || 0}
            </p>
            <p className="text-sm text-gray-500">완료 프로젝트</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {activeContracts.length}
            </p>
            <p className="text-sm text-gray-500">진행 중</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {earnings?.completedContracts
                ? formatPrice(Math.round((earnings.totalEarnings || 0) / earnings.completedContracts))
                : '₩0'}
            </p>
            <p className="text-sm text-gray-500">평균 수익</p>
          </div>
        </div>
      </div>
    </div>
  )
}
