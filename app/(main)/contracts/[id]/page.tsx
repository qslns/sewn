'use client'

// ===========================
// 계약 상세 페이지
// ===========================

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { LoadingState } from '@/components/ui/spinner'
import { StarRating } from '@/components/ui/star-rating'
import { useToast } from '@/components/ui/toast'
import { useContract } from '@/hooks/useContracts'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  CheckCircle,
  Clock,
  CreditCard,
  AlertCircle,
  XCircle,
  MessageSquare,
  FileCheck,
  Calendar,
  DollarSign,
  User,
  Building,
  Star,
} from 'lucide-react'
import type { ContractStatus } from '@/types'

const STATUS_STEPS = [
  { status: 'pending_payment', label: '계약 생성', icon: FileCheck },
  { status: 'payment', label: '결제 완료', icon: CreditCard },
  { status: 'in_progress', label: '작업 진행', icon: Clock },
  { status: 'pending_approval', label: '완료 승인', icon: AlertCircle },
  { status: 'completed', label: '정산 완료', icon: CheckCircle },
]

const STATUS_ORDER: Record<string, number> = {
  pending_payment: 0,
  in_progress: 2,
  pending_approval: 3,
  completed: 4,
  disputed: 3,
  cancelled: -1,
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const showReviewModal = searchParams.get('review') === 'true'

  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const { contract, isLoading, requestCompletion, approveCompletion, refetch } = useContract(id)

  const [isProcessing, setIsProcessing] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(showReviewModal)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const isClient = user?.id === contract?.client_id
  const isExpert = user?.id === contract?.expert_id
  const currentStep = contract ? STATUS_ORDER[contract.status] : 0

  const handlePayment = async () => {
    if (!contract) return

    // 결제 페이지로 이동
    router.push(`/payment?contractId=${contract.id}`)
  }

  const handleRequestCompletion = async () => {
    try {
      setIsProcessing(true)
      await requestCompletion()
      showToast('success', '완료 요청을 보냈습니다.')
    } catch {
      showToast('error', '완료 요청에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApproveCompletion = async () => {
    try {
      setIsProcessing(true)
      await approveCompletion()
      showToast('success', '계약이 완료되었습니다!')
      setReviewModalOpen(true)
    } catch {
      showToast('error', '완료 승인에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!contract || !user) return

    try {
      setIsSubmittingReview(true)
      const revieweeId = isClient ? contract.expert_id : contract.client_id

      const { error } = await supabase.from('reviews').insert({
        contract_id: contract.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: reviewForm.rating,
        comment: reviewForm.comment || null,
      })

      if (error) {
        if (error.code === '23505') {
          showToast('error', '이미 리뷰를 작성했습니다.')
        } else {
          throw error
        }
      } else {
        showToast('success', '리뷰가 등록되었습니다.')
        setReviewModalOpen(false)
        setReviewForm({ rating: 5, comment: '' })
      }
    } catch {
      showToast('error', '리뷰 등록에 실패했습니다.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="계약 정보를 불러오는 중..." />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          계약을 찾을 수 없습니다
        </h1>
        <Link href={ROUTES.DASHBOARD_CONTRACTS}>
          <Button>계약 목록으로</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge
            variant={
              contract.status === 'completed'
                ? 'success'
                : contract.status === 'cancelled' || contract.status === 'disputed'
                ? 'danger'
                : contract.status === 'pending_payment'
                ? 'warning'
                : 'accent'
            }
          >
            {contract.status === 'pending_payment' && '결제 대기'}
            {contract.status === 'in_progress' && '진행 중'}
            {contract.status === 'pending_approval' && '완료 승인 대기'}
            {contract.status === 'completed' && '완료'}
            {contract.status === 'disputed' && '분쟁 중'}
            {contract.status === 'cancelled' && '취소됨'}
          </Badge>
          <span className="text-sm text-gray-500">
            계약 #{contract.id.slice(0, 8)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {contract.project_title}
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 참여자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>계약 참여자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 클라이언트 */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar
                    src={contract.client_image}
                    alt={contract.client_name || '클라이언트'}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      클라이언트
                    </p>
                    <p className="font-medium text-gray-900">
                      {contract.client_name}
                    </p>
                    {isClient && (
                      <Badge variant="secondary" className="mt-1">나</Badge>
                    )}
                  </div>
                </div>

                {/* 전문가 */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar
                    src={contract.expert_image}
                    alt={contract.expert_name || '전문가'}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      전문가
                    </p>
                    <p className="font-medium text-gray-900">
                      {contract.expert_name}
                    </p>
                    {isExpert && (
                      <Badge variant="secondary" className="mt-1">나</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계약 금액 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>계약 내용</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">계약 금액</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(contract.agreed_amount)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">
                    플랫폼 수수료 ({(contract.platform_fee_rate * 100).toFixed(0)}%)
                  </p>
                  <p className="text-xl font-medium text-gray-700">
                    {formatPrice(contract.platform_fee || contract.agreed_amount * contract.platform_fee_rate)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">전문가 수령액</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatPrice(contract.expert_amount || contract.agreed_amount * (1 - contract.platform_fee_rate))}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {contract.deadline && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">작업 기한</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(contract.deadline)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">계약 생성일</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(contract.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 진행 상황 타임라인 */}
          <Card>
            <CardHeader>
              <CardTitle>진행 상황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon
                  const isCompleted = currentStep > index || (currentStep === index && contract.status === 'completed')
                  const isCurrent = currentStep === index && contract.status !== 'completed'

                  // 결제 단계 특별 처리
                  const isPaymentStep = step.status === 'payment'
                  const paymentCompleted = contract.status !== 'pending_payment'

                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          (isCompleted || (isPaymentStep && paymentCompleted))
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-accent-camel text-white animate-pulse'
                            : 'bg-gray-200 text-gray-400'
                        )}
                      >
                        {(isCompleted || (isPaymentStep && paymentCompleted)) ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 border-l-2 border-gray-100 pl-4 -ml-4">
                        <p
                          className={cn(
                            'font-medium',
                            (isCompleted || (isPaymentStep && paymentCompleted))
                              ? 'text-gray-900'
                              : isCurrent
                              ? 'text-accent-camel'
                              : 'text-gray-400'
                          )}
                        >
                          {step.label}
                        </p>
                        {isPaymentStep && paymentCompleted && contract.started_at && (
                          <p className="text-sm text-gray-500">
                            {formatDate(contract.started_at)}
                          </p>
                        )}
                        {step.status === 'completed' && contract.completed_at && (
                          <p className="text-sm text-gray-500">
                            {formatDate(contract.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 - 액션 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              {/* 결제 대기 - 클라이언트 */}
              {contract.status === 'pending_payment' && isClient && (
                <Button className="w-full" onClick={handlePayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  결제하기
                </Button>
              )}

              {/* 결제 대기 - 전문가 */}
              {contract.status === 'pending_payment' && isExpert && (
                <div className="text-center py-4 bg-yellow-50 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700">
                    클라이언트의 결제를 기다리고 있습니다.
                  </p>
                </div>
              )}

              {/* 진행 중 - 전문가 */}
              {contract.status === 'in_progress' && isExpert && (
                <Button
                  className="w-full"
                  onClick={handleRequestCompletion}
                  isLoading={isProcessing}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  완료 요청
                </Button>
              )}

              {/* 진행 중 - 클라이언트 */}
              {contract.status === 'in_progress' && isClient && (
                <div className="text-center py-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-700">
                    전문가가 작업을 진행 중입니다.
                  </p>
                </div>
              )}

              {/* 완료 승인 대기 - 클라이언트 */}
              {contract.status === 'pending_approval' && isClient && (
                <>
                  <Button
                    className="w-full"
                    onClick={handleApproveCompletion}
                    isLoading={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    완료 승인
                  </Button>
                  <Button variant="outline" className="w-full">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    분쟁 신청
                  </Button>
                </>
              )}

              {/* 완료 승인 대기 - 전문가 */}
              {contract.status === 'pending_approval' && isExpert && (
                <div className="text-center py-4 bg-purple-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-700">
                    클라이언트의 승인을 기다리고 있습니다.
                  </p>
                </div>
              )}

              {/* 완료됨 */}
              {contract.status === 'completed' && (
                <>
                  <div className="text-center py-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700 font-medium">
                      계약이 완료되었습니다!
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    리뷰 작성하기
                  </Button>
                </>
              )}

              {/* 공통 액션 */}
              <Link href={ROUTES.MESSAGES} className="block">
                <Button variant="ghost" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  메시지 보내기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="리뷰 작성"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Avatar
              src={isClient ? contract.expert_image : contract.client_image}
              alt={isClient ? contract.expert_name : contract.client_name}
              size="xl"
              className="mx-auto mb-3"
            />
            <p className="text-lg font-medium text-gray-900">
              {isClient ? contract.expert_name : contract.client_name}님과의 작업은 어떠셨나요?
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">전체 평점</p>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= reviewForm.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="상세 리뷰 (선택)"
            value={reviewForm.comment}
            onChange={(e) =>
              setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
            }
            placeholder="작업에 대한 경험을 공유해주세요..."
            className="min-h-[100px]"
          />

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setReviewModalOpen(false)}
            >
              나중에
            </Button>
            <Button
              onClick={handleSubmitReview}
              isLoading={isSubmittingReview}
            >
              리뷰 작성하기
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
