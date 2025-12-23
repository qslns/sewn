'use client'

// ===========================
// 결제 성공 페이지
// ===========================

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/spinner'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [contractId, setContractId] = useState<string | null>(null)

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setStatus('error')
        setErrorMessage('결제 정보가 올바르지 않습니다.')
        return
      }

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        })

        const result = await response.json()

        if (result.success) {
          setStatus('success')
          // orderId format: contract_xxxxx
          const id = orderId.replace('contract_', '')
          setContractId(id)
        } else {
          setStatus('error')
          setErrorMessage(result.error || '결제 승인에 실패했습니다.')
        }
      } catch (error) {
        console.error('Payment confirmation error:', error)
        setStatus('error')
        setErrorMessage('결제 처리 중 오류가 발생했습니다.')
      }
    }

    confirmPayment()
  }, [paymentKey, orderId, amount])

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="결제를 확인하고 있습니다..." />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제 실패
            </h1>
            <p className="text-gray-600 mb-8">
              {errorMessage}
            </p>
            <Button onClick={() => router.back()}>
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제가 완료되었습니다!
          </h1>
          <p className="text-gray-600 mb-2">
            프로젝트가 시작되었습니다.
          </p>
          {amount && (
            <p className="text-lg font-semibold text-accent-camel mb-8">
              {formatPrice(parseInt(amount))}
            </p>
          )}

          <div className="space-y-3">
            {contractId && (
              <Link href={`/contracts/${contractId}`}>
                <Button className="w-full">
                  계약서 보기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/contracts">
              <Button variant="outline" className="w-full">
                계약 목록으로
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="결제를 확인하고 있습니다..." />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
