'use client'

// ===========================
// 결제 페이지
// ===========================

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useContract } from '@/hooks/useContracts'
import { useAuth } from '@/hooks/useAuth'
import { requestPayment, TOSS_CLIENT_KEY } from '@/lib/payment/toss'
import { formatPrice } from '@/lib/utils'
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contractId = searchParams.get('contractId')

  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const { contract, isLoading } = useContract(contractId)

  const [isProcessing, setIsProcessing] = useState(false)

  // 결제 권한 체크
  const canPay = user?.id === contract?.client_id && contract?.status === 'pending_payment'

  const handlePayment = async () => {
    if (!contract || !user || !profile) return

    try {
      setIsProcessing(true)

      await requestPayment({
        orderId: `contract_${contract.id}`,
        orderName: `Sewn 프로젝트 결제 - ${contract.project_title}`,
        amount: contract.agreed_amount,
        customerName: profile.name || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || '',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error('Payment request failed:', error)
      showToast('error', '결제 요청에 실패했습니다.')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="결제 정보를 불러오는 중..." />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          계약을 찾을 수 없습니다
        </h1>
        <Button onClick={() => router.push('/contracts')}>
          계약 목록으로
        </Button>
      </div>
    )
  }

  if (!canPay) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          결제할 수 없습니다
        </h1>
        <p className="text-gray-600 mb-6">
          {contract.status !== 'pending_payment'
            ? '이미 결제가 완료된 계약입니다.'
            : '결제는 클라이언트만 할 수 있습니다.'}
        </p>
        <Button onClick={() => router.push(`/contracts/${contract.id}`)}>
          계약 상세로
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        프로젝트 결제
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">프로젝트</span>
            <span className="font-medium text-gray-900">{contract.project_title}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">전문가</span>
            <span className="font-medium text-gray-900">{contract.expert_name}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">계약 금액</span>
            <span className="font-medium text-gray-900">
              {formatPrice(contract.agreed_amount)}
            </span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">플랫폼 수수료 ({(contract.platform_fee_rate * 100).toFixed(0)}%)</span>
            <span className="text-gray-600">
              {formatPrice(contract.agreed_amount * contract.platform_fee_rate)}
            </span>
          </div>
          <div className="flex justify-between py-3 bg-gray-50 -mx-6 px-6 rounded-lg">
            <span className="font-semibold text-gray-900">결제 금액</span>
            <span className="text-xl font-bold text-accent-camel">
              {formatPrice(contract.agreed_amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 에스크로 안내 */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">안전한 에스크로 결제</h3>
              <p className="text-sm text-blue-700">
                결제 금액은 작업 완료 후 전문가에게 정산됩니다.
                작업에 문제가 있을 경우 환불을 요청할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결제 버튼 */}
      <Button
        className="w-full h-14 text-lg"
        onClick={handlePayment}
        isLoading={isProcessing}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {formatPrice(contract.agreed_amount)} 결제하기
      </Button>

      {/* 테스트 모드 안내 */}
      {TOSS_CLIENT_KEY.startsWith('test_') && (
        <p className="text-center text-xs text-gray-400 mt-4">
          * 테스트 모드입니다. 실제 결제가 이루어지지 않습니다.
        </p>
      )}

      {/* 결제 수단 로고 */}
      <div className="flex items-center justify-center gap-4 mt-8 text-gray-400">
        <span className="text-sm">결제 수단</span>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium">카드</div>
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium">간편결제</div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="결제 정보를 불러오는 중..." />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
