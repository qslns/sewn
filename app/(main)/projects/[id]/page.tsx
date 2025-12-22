'use client'

// ===========================
// 프로젝트 상세 페이지
// ===========================

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useProject } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES, PROJECT_STATUS_LABELS, PROPOSAL_STATUS_LABELS } from '@/lib/constants'
import { CATEGORY_LABELS } from '@/types'
import { formatPriceRange, formatDate, formatRelativeTime, formatPrice } from '@/lib/utils'
import {
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Star,
  MessageSquare,
  Send,
  Check,
  X,
} from 'lucide-react'
import type { ExpertCategory } from '@/types'

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const { data: project, proposals, isLoading, error, refetch } = useProject(id)

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [proposalForm, setProposalForm] = useState({
    cover_letter: '',
    proposed_rate: '',
    estimated_duration: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isClient = profile?.user_type === 'client' || profile?.user_type === 'both'
  const isExpert = profile?.user_type === 'expert' || profile?.user_type === 'both'
  const isOwner = user?.id === project?.client_id

  // 이미 제안서를 제출했는지 확인
  const hasSubmittedProposal = proposals.some(
    (p) => p.expert?.user?.name === profile?.name
  )

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !proposalForm.cover_letter || !proposalForm.proposed_rate) {
      showToast('error', '필수 항목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 전문가 프로필 ID 조회
      const { data: expertProfile } = await supabase
        .from('expert_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!expertProfile) {
        showToast('error', '먼저 전문가 프로필을 작성해주세요.')
        router.push(ROUTES.DASHBOARD_PROFILE)
        return
      }

      const { error } = await supabase.from('proposals').insert({
        project_id: id,
        expert_id: expertProfile.id,
        cover_letter: proposalForm.cover_letter,
        proposed_rate: parseInt(proposalForm.proposed_rate),
        estimated_duration: proposalForm.estimated_duration || null,
      })

      if (error) {
        if (error.code === '23505') {
          showToast('error', '이미 제안서를 제출했습니다.')
        } else {
          throw error
        }
      } else {
        showToast('success', '제안서가 제출되었습니다.')
        setIsProposalModalOpen(false)
        setProposalForm({ cover_letter: '', proposed_rate: '', estimated_duration: '' })
        refetch()
      }
    } catch (error) {
      console.error('Failed to submit proposal:', error)
      showToast('error', '제안서 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposalId)

      if (error) throw error

      // 프로젝트 상태도 업데이트
      await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', id)

      showToast('success', '제안서를 수락했습니다.')
      refetch()
    } catch (error) {
      console.error('Failed to accept proposal:', error)
      showToast('error', '처리에 실패했습니다.')
    }
  }

  const handleRejectProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId)

      if (error) throw error

      showToast('success', '제안서를 거절했습니다.')
      refetch()
    } catch (error) {
      console.error('Failed to reject proposal:', error)
      showToast('error', '처리에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState message="프로젝트를 불러오는 중..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          프로젝트를 찾을 수 없습니다
        </h1>
        <Link href={ROUTES.PROJECTS}>
          <Button>프로젝트 목록으로</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 헤더 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant={
                  project.status === 'open'
                    ? 'success'
                    : project.status === 'in_progress'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatRelativeTime(project.created_at)}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {project.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {CATEGORY_LABELS[cat as ExpertCategory]}
                </Badge>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              프로젝트 설명
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-line text-gray-600">
                {project.description}
              </p>
            </div>
          </section>

          {/* 제안서 목록 (프로젝트 소유자만) */}
          {isOwner && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                받은 제안서 ({proposals.length})
              </h2>

              {proposals.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    아직 제안서가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <Card key={proposal.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={proposal.expert?.user?.profile_image_url}
                              alt={proposal.expert?.user?.name || '전문가'}
                              size="md"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {proposal.expert?.user?.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {proposal.expert?.review_count > 0 && (
                                  <>
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {proposal.expert.rating_avg.toFixed(1)}
                                    <span>({proposal.expert.review_count})</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              proposal.status === 'pending'
                                ? 'secondary'
                                : proposal.status === 'accepted'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof PROPOSAL_STATUS_LABELS]}
                          </Badge>
                        </div>

                        <p className="text-gray-600 mb-4">{proposal.cover_letter}</p>

                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <span className="font-medium text-gray-900">
                            {formatPrice(proposal.proposed_rate)}
                          </span>
                          {proposal.estimated_duration && (
                            <span>예상 기간: {proposal.estimated_duration}</span>
                          )}
                        </div>

                        {proposal.status === 'pending' && (
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptProposal(proposal.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              수락
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectProposal(proposal.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              거절
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              메시지
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-6">
              {/* 예산 */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <DollarSign className="h-4 w-4" />
                  예산
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPriceRange(project.budget_min, project.budget_max)}
                </p>
              </div>

              {/* 마감일 */}
              {project.deadline && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4" />
                    마감일
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatDate(project.deadline)}
                  </p>
                </div>
              )}

              {/* 위치 */}
              {project.location && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4" />
                    위치
                  </div>
                  <p className="font-medium text-gray-900">{project.location}</p>
                </div>
              )}

              {/* 제안 수 */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <FileText className="h-4 w-4" />
                  제안서
                </div>
                <p className="font-medium text-gray-900">
                  {proposals.length}개
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                {/* 클라이언트 정보 */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={project.client.profile_image_url}
                    alt={project.client.name}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {project.client.name}
                    </p>
                    <p className="text-sm text-gray-500">클라이언트</p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                {isExpert && project.status === 'open' && !isOwner && (
                  <>
                    {hasSubmittedProposal ? (
                      <Button className="w-full" disabled>
                        이미 제안함
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!user) {
                            router.push(ROUTES.LOGIN)
                          } else {
                            setIsProposalModalOpen(true)
                          }
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        제안서 보내기
                      </Button>
                    )}
                  </>
                )}

                {!isExpert && !isOwner && (
                  <p className="text-sm text-gray-500 text-center">
                    전문가만 제안서를 보낼 수 있습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 제안서 작성 모달 */}
      <Modal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        title="제안서 작성"
        size="lg"
      >
        <form onSubmit={handleSubmitProposal} className="space-y-4">
          <Textarea
            label="커버레터"
            value={proposalForm.cover_letter}
            onChange={(e) =>
              setProposalForm((prev) => ({
                ...prev,
                cover_letter: e.target.value,
              }))
            }
            placeholder="왜 이 프로젝트에 적합한지, 어떤 경험이 있는지 설명해주세요."
            className="min-h-[150px]"
            required
          />

          <Input
            label="제안 금액 (원)"
            type="number"
            value={proposalForm.proposed_rate}
            onChange={(e) =>
              setProposalForm((prev) => ({
                ...prev,
                proposed_rate: e.target.value,
              }))
            }
            placeholder="1000000"
            required
          />

          <Input
            label="예상 작업 기간"
            value={proposalForm.estimated_duration}
            onChange={(e) =>
              setProposalForm((prev) => ({
                ...prev,
                estimated_duration: e.target.value,
              }))
            }
            placeholder="예: 2주, 1개월"
          />

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsProposalModalOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              제안서 제출
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
