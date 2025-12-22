'use client'

// ===========================
// 리뷰 작성 폼 컴포넌트
// ===========================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  contractId: string
  reviewerId: string
  revieweeId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  contractId,
  reviewerId,
  revieweeId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      showToast('error', '별점을 선택해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('reviews').insert({
        contract_id: contractId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      })

      if (error) {
        if (error.code === '23505') {
          showToast('error', '이미 리뷰를 작성했습니다.')
        } else {
          throw error
        }
      } else {
        showToast('success', '리뷰가 등록되었습니다.')
        onSuccess?.()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      showToast('error', '리뷰 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 별점 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          평점
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {rating === 1
              ? '별로예요'
              : rating === 2
              ? '그저 그래요'
              : rating === 3
              ? '보통이에요'
              : rating === 4
              ? '좋아요'
              : '최고예요'}
          </p>
        )}
      </div>

      {/* 코멘트 */}
      <Textarea
        label="리뷰 (선택)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="함께 작업한 경험을 공유해주세요."
        className="min-h-[120px]"
      />

      {/* 버튼 */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          리뷰 등록
        </Button>
      </div>
    </form>
  )
}
