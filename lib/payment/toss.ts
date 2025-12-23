// ===========================
// 토스페이먼츠 결제 유틸리티
// ===========================

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'

// 결제 요청 파라미터
export interface PaymentRequestParams {
  orderId: string
  orderName: string
  amount: number
  customerName: string
  customerEmail: string
  successUrl: string
  failUrl: string
}

// 결제 요청
export async function requestPayment(params: PaymentRequestParams) {
  // @ts-ignore - tosspayments SDK dynamic import
  const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)

  const payment = tossPayments.payment({
    customerKey: params.orderId, // 고객 식별자로 orderId 사용
  })

  await payment.requestPayment({
    method: 'CARD',
    amount: {
      value: params.amount,
      currency: 'KRW',
    },
    orderId: params.orderId,
    orderName: params.orderName,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    card: {
      useEscrow: false,
      flowMode: 'DEFAULT',
      useCardPoint: false,
      useAppCardOnly: false,
    },
  })
}

// 결제 승인 (서버사이드)
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'

  try {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '결제 승인에 실패했습니다.',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return {
      success: false,
      error: '결제 승인 중 오류가 발생했습니다.',
    }
  }
}

// 금액 포맷팅 (결제용)
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}
