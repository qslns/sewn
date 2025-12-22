// ===========================
// 리뷰 목록 컴포넌트
// ===========================

import { Avatar } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    name: string
    profile_image_url: string | null
  }
}

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        아직 리뷰가 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
          <div className="flex items-start gap-3">
            <Avatar
              src={review.reviewer.profile_image_url}
              alt={review.reviewer.name}
              size="md"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {review.reviewer.name}
                </p>
                <span className="text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </span>
              </div>

              {/* 별점 */}
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-4 w-4',
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>

              {/* 코멘트 */}
              {review.comment && (
                <p className="mt-2 text-gray-600">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
