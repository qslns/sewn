import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { confirmPayment } from '@/lib/payment/toss'

// 서버 사이드 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // 필수 파라미터 확인
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 계약 ID 추출 (orderId format: contract_xxxxx)
    const contractId = orderId.replace('contract_', '')

    // 계약 정보 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { success: false, error: '계약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 결제 완료된 계약인지 확인
    if (contract.status !== 'pending_payment') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 계약입니다.' },
        { status: 400 }
      )
    }

    // 금액 검증
    if (contract.agreed_amount !== amount) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 결제 승인
    const paymentResult = await confirmPayment(paymentKey, orderId, amount)

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error },
        { status: 400 }
      )
    }

    // 트랜잭션 기록 생성
    const { error: transactionError } = await supabase.from('transactions').insert({
      contract_id: contractId,
      amount: amount,
      type: 'escrow_deposit',
      status: 'completed',
      payment_method: 'card',
      payment_id: paymentKey,
    })

    if (transactionError) {
      console.error('Transaction record error:', transactionError)
      // 결제는 성공했으므로 계속 진행
    }

    // 계약 상태 업데이트
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        payment_key: paymentKey,
        payment_id: paymentKey,
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('Contract update error:', updateError)
      return NextResponse.json(
        { success: false, error: '계약 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contractId,
      message: '결제가 완료되었습니다.',
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { success: false, error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
