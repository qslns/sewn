'use client'

// ===========================
// 결제 실패 페이지
// ===========================

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')
  const orderId = searchParams.get('orderId')

  const contractId = orderId?.replace('contract_', '')

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      case 'INVALID_CARD_NUMBER':
        return '카드 번호가 올바르지 않습니다.'
      case 'EXCEED_CARD_LIMIT':
        return '카드 한도가 초과되었습니다.'
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.'
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제 실패
          </h1>
          <p className="text-gray-600 mb-2">
            {getErrorDescription(errorCode)}
          </p>
          {errorCode && (
            <p className="text-sm text-gray-400 mb-8">
              오류 코드: {errorCode}
            </p>
          )}

          <div className="space-y-3">
            {contractId && (
              <Link href={`/payment?contractId=${contractId}`}>
                <Button className="w-full">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  다시 시도하기
                </Button>
              </Link>
            )}
            <Button variant="outline" className="w-full" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전으로
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="로딩 중..." />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}
