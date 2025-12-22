'use client'

// ===========================
// 프로젝트 등록 페이지 (멀티스텝 폼)
// ===========================

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES, EXPERT_CATEGORIES, EXPERT_CATEGORY_GROUPS, LOCATIONS } from '@/lib/constants'
import { cn, formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  X,
  Upload,
  FileText,
  Check,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import type { ExpertCategory } from '@/types'

type Step = 1 | 2 | 3 | 4

interface FormData {
  title: string
  description: string
  categories: ExpertCategory[]
  budget_min: string
  budget_max: string
  deadline: string
  location: string
  attachments: File[]
  attachmentUrls: string[]
}

const STEPS = [
  { id: 1, title: '기본 정보', description: '프로젝트 제목과 설명' },
  { id: 2, title: '필요 분야', description: '필요한 전문 분야 선택' },
  { id: 3, title: '예산 및 일정', description: '예산과 마감일 설정' },
  { id: 4, title: '첨부 파일', description: '참고 자료 업로드' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categories: [],
    budget_min: '',
    budget_max: '',
    deadline: '',
    location: '',
    attachments: [],
    attachmentUrls: [],
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

  // 임시저장 불러오기
  useEffect(() => {
    const savedData = localStorage.getItem('project_draft')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData((prev) => ({
          ...prev,
          title: parsed.title || '',
          description: parsed.description || '',
          categories: parsed.categories || [],
          budget_min: parsed.budget_min || '',
          budget_max: parsed.budget_max || '',
          deadline: parsed.deadline || '',
          location: parsed.location || '',
        }))
      } catch (e) {
        console.error('Failed to parse saved draft:', e)
      }
    }
  }, [])

  // 임시저장
  const saveDraft = () => {
    const draft = {
      title: formData.title,
      description: formData.description,
      categories: formData.categories,
      budget_min: formData.budget_min,
      budget_max: formData.budget_max,
      deadline: formData.deadline,
      location: formData.location,
    }
    localStorage.setItem('project_draft', JSON.stringify(draft))
    showToast('success', '임시저장되었습니다.')
  }

  const handleCategoryToggle = (category: ExpertCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
    setErrors((prev) => ({ ...prev, categories: '' }))
  }

  // 파일 업로드
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        showToast('error', `${file.name}: 지원하지 않는 파일 형식입니다.`)
        return false
      }
      if (file.size > maxSize) {
        showToast('error', `${file.name}: 파일 크기가 10MB를 초과합니다.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

        const { data, error } = await supabase.storage
          .from('project-attachments')
          .upload(fileName, file)

        if (error) {
          console.error('Upload error:', error)
          showToast('error', `${file.name} 업로드에 실패했습니다.`)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('project-attachments')
          .getPublicUrl(data.path)

        uploadedUrls.push(urlData.publicUrl)
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles],
        attachmentUrls: [...prev.attachmentUrls, ...uploadedUrls],
      }))

      showToast('success', `${uploadedUrls.length}개 파일이 업로드되었습니다.`)
    } catch (error) {
      console.error('Upload failed:', error)
      showToast('error', '파일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = async (index: number) => {
    const url = formData.attachmentUrls[index]

    // Storage에서 파일 삭제 시도 (실패해도 UI에서는 제거)
    try {
      const path = url.split('/project-attachments/')[1]
      if (path) {
        await supabase.storage.from('project-attachments').remove([path])
      }
    } catch (e) {
      console.error('Failed to delete file from storage:', e)
    }

    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
      attachmentUrls: prev.attachmentUrls.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = '제목을 입력해주세요.'
        }
        if (!formData.description.trim()) {
          newErrors.description = '상세 설명을 입력해주세요.'
        } else if (formData.description.length < 50) {
          newErrors.description = '설명은 50자 이상 입력해주세요.'
        }
        break
      case 2:
        if (formData.categories.length === 0) {
          newErrors.categories = '최소 하나의 분야를 선택해주세요.'
        }
        break
      case 3:
        // 예산과 일정은 선택사항
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as Step)
    }
  }

  const goToPrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as Step)
  }

  const handleSubmit = async (status: 'draft' | 'open') => {
    if (status === 'open') {
      // 모든 필수 항목 검증
      if (!validateStep(1) || !validateStep(2)) {
        showToast('error', '필수 항목을 모두 입력해주세요.')
        return
      }
    }

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
        attachment_urls: formData.attachmentUrls,
        status,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error

      // 임시저장 데이터 삭제
      localStorage.removeItem('project_draft')

      showToast(
        'success',
        status === 'open'
          ? '프로젝트가 등록되었습니다! 전문가들의 제안을 기다려주세요.'
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
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900">프로젝트 등록</h1>
        <p className="text-gray-600 mt-2">
          프로젝트 정보를 입력하고 전문가를 찾아보세요.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* 스텝 인디케이터 */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* 연결선 */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>

            {STEPS.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    step > s.id
                      ? 'bg-black text-white'
                      : step === s.id
                      ? 'bg-black text-white ring-4 ring-black/20'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {step > s.id ? <Check className="h-5 w-5" /> : s.id}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn(
                    'text-sm font-medium',
                    step >= s.id ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-400">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 스텝 1: 기본 정보 */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <Input
                  label="프로젝트 제목"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                    setErrors((prev) => ({ ...prev, title: '' }))
                  }}
                  placeholder="예: 2024 S/S 컬렉션 패턴 제작"
                  error={errors.title}
                />
                <p className="mt-1 text-xs text-gray-400">
                  구체적이고 명확한 제목이 더 많은 전문가의 관심을 받습니다.
                </p>
              </div>

              <div>
                <Textarea
                  label="상세 설명"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                    setErrors((prev) => ({ ...prev, description: '' }))
                  }}
                  placeholder={`프로젝트에 대한 상세한 설명을 작성해주세요.

포함하면 좋은 내용:
• 작업 범위와 구체적인 요구사항
• 기대하는 결과물
• 참고할 스타일이나 레퍼런스
• 특별히 필요한 경험이나 스킬`}
                  className="min-h-[200px]"
                  error={errors.description}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {formData.description.length}/50자 이상 (현재 {formData.description.length}자)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 스텝 2: 필요 분야 */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                어떤 분야의 전문가가 필요하신가요?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                프로젝트에 필요한 분야를 모두 선택해주세요.
              </p>

              <div className="space-y-6">
                {Object.entries(EXPERT_CATEGORY_GROUPS).map(([groupKey, group]) => (
                  <div key={groupKey}>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{group.label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {EXPERT_CATEGORIES.filter((c) => c.group === groupKey).map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleCategoryToggle(category.value)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all',
                            formData.categories.includes(category.value)
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          )}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {errors.categories && (
                <p className="mt-4 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.categories}
                </p>
              )}

              {formData.categories.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    선택된 분야 ({formData.categories.length})
                  </p>
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
        )}

        {/* 스텝 3: 예산 및 일정 */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">예산</h3>
                <p className="text-sm text-gray-500 mb-4">
                  예상 예산 범위를 설정해주세요. (선택사항)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="최소 예산"
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, budget_min: e.target.value }))
                    }
                    placeholder="500,000"
                    leftIcon={<DollarSign className="h-5 w-5" />}
                  />
                  <Input
                    label="최대 예산"
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, budget_max: e.target.value }))
                    }
                    placeholder="2,000,000"
                    leftIcon={<DollarSign className="h-5 w-5" />}
                  />
                </div>
                {(formData.budget_min || formData.budget_max) && (
                  <p className="mt-2 text-sm text-gray-600">
                    예산 범위: {formData.budget_min ? formatPrice(parseInt(formData.budget_min)) : '협의'} ~ {formData.budget_max ? formatPrice(parseInt(formData.budget_max)) : '협의'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">마감 일정</h3>
                <p className="text-sm text-gray-500 mb-4">
                  프로젝트 완료 희망일을 선택해주세요. (선택사항)
                </p>
                <Input
                  label="마감일"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<Calendar className="h-5 w-5" />}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">작업 지역</h3>
                <p className="text-sm text-gray-500 mb-4">
                  오프라인 작업이 필요한 경우 지역을 선택해주세요. (선택사항)
                </p>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* 스텝 4: 첨부 파일 */}
        {step === 4 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">참고 자료</h3>
              <p className="text-sm text-gray-500 mb-6">
                디자인 스케치, 레퍼런스 이미지, 사양서 등을 업로드해주세요. (선택사항)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isUploading
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                )}
              >
                {isUploading ? (
                  <LoadingState message="업로드 중..." />
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      클릭하거나 파일을 드래그해서 업로드
                    </p>
                    <p className="text-sm text-gray-400">
                      이미지 (JPG, PNG, WebP) 또는 PDF, 최대 10MB
                    </p>
                  </>
                )}
              </div>

              {formData.attachmentUrls.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.attachmentUrls.map((url, index) => {
                    const isImage = url.match(/\.(jpg|jpeg|png|webp)$/i)
                    return (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
                      >
                        {isImage ? (
                          <Image
                            src={url}
                            alt={`첨부 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <FileText className="h-12 w-12 text-gray-400" />
                            <p className="text-xs text-gray-500 mt-2">PDF</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={goToPrevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={saveDraft}>
              임시저장
            </Button>

            {step < 4 ? (
              <Button onClick={goToNextStep}>
                다음
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => handleSubmit('open')} isLoading={isLoading}>
                프로젝트 등록하기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
