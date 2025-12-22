'use client'

// ===========================
// 프로젝트 등록 페이지
// ===========================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES, EXPERT_CATEGORIES, LOCATIONS } from '@/lib/constants'
import { ArrowLeft, X } from 'lucide-react'
import type { ExpertCategory } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [] as ExpertCategory[],
    budget_min: '',
    budget_max: '',
    deadline: '',
    location: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isClient = profile?.user_type === 'client' || profile?.user_type === 'both'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
    } else if (!authLoading && user && !isClient) {
      showToast('error', '클라이언트만 프로젝트를 등록할 수 있습니다.')
      router.push(ROUTES.PROJECTS)
    }
  }, [authLoading, user, isClient, router, showToast])

  const handleCategoryToggle = (category: ExpertCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    }
    if (!formData.description.trim()) {
      newErrors.description = '상세 설명을 입력해주세요.'
    }
    if (formData.categories.length === 0) {
      newErrors.categories = '최소 하나의 분야를 선택해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'open') => {
    e.preventDefault()

    if (status === 'open' && !validate()) return

    if (!user) return

    setIsLoading(true)

    try {
      const projectData = {
        client_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        categories: formData.categories,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        deadline: formData.deadline || null,
        location: formData.location || null,
        status,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error

      showToast(
        'success',
        status === 'open'
          ? '프로젝트가 등록되었습니다.'
          : '임시저장되었습니다.'
      )

      router.push(ROUTES.PROJECT_DETAIL(data.id))
    } catch (error) {
      console.error('Failed to create project:', error)
      showToast('error', '프로젝트 등록에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900">프로젝트 등록</h1>
        <p className="text-gray-600 mt-2">
          프로젝트 정보를 입력하고 전문가를 찾아보세요.
        </p>
      </div>

      <div className="max-w-3xl">
        <form className="space-y-8">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="프로젝트 제목"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="예: 2024 S/S 컬렉션 패턴 제작"
                error={errors.title}
              />

              <Textarea
                label="상세 설명"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="프로젝트에 대한 상세한 설명을 작성해주세요. 작업 범위, 기대 결과물, 참고 사항 등을 포함하면 좋습니다."
                className="min-h-[150px]"
                error={errors.description}
              />
            </CardContent>
          </Card>

          {/* 필요 분야 */}
          <Card>
            <CardHeader>
              <CardTitle>필요 분야</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {EXPERT_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.categories.includes(category.value)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-2 text-sm text-red-500">{errors.categories}</p>
              )}

              {formData.categories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">선택된 분야:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {EXPERT_CATEGORIES.find((c) => c.value === cat)?.label}
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 예산 및 일정 */}
          <Card>
            <CardHeader>
              <CardTitle>예산 및 일정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="최소 예산 (원)"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget_min: e.target.value,
                    }))
                  }
                  placeholder="500000"
                />
                <Input
                  label="최대 예산 (원)"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget_max: e.target.value,
                    }))
                  }
                  placeholder="2000000"
                />
              </div>

              <Input
                label="마감 일정"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
                min={new Date().toISOString().split('T')[0]}
              />

              <Select
                label="작업 지역"
                options={[
                  { value: '', label: '지역 선택' },
                  ...LOCATIONS.map((loc) => ({ value: loc, label: loc })),
                ]}
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
              disabled={isLoading}
            >
              임시저장
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'open')}
              isLoading={isLoading}
            >
              등록하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
