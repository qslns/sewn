'use client'

// ===========================
// 온보딩 페이지 (전문가 프로필 설정)
// ===========================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StepProgress } from '@/components/ui/progress'
import { EXPERT_CATEGORIES, EXPERT_CATEGORY_GROUPS, COMMON_SKILLS, LOCATIONS, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ExpertCategory, AvailabilityStatus } from '@/types'
import {
  User,
  Briefcase,
  MapPin,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react'

// 온보딩 단계
const STEPS = [
  { label: '기본 정보', description: '이름과 소개' },
  { label: '전문 분야', description: '카테고리 선택' },
  { label: '스킬', description: '보유 기술' },
  { label: '경력/위치', description: '경험과 활동 지역' },
  { label: '요금 설정', description: '시급 및 프로젝트 비용' },
]

interface OnboardingData {
  name: string
  bio: string
  categories: ExpertCategory[]
  skills: string[]
  experience_years: number | null
  location: string
  hourly_rate_min: number | null
  hourly_rate_max: number | null
  project_rate_min: number | null
  project_rate_max: number | null
  availability: AvailabilityStatus
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const [data, setData] = useState<OnboardingData>({
    name: '',
    bio: '',
    categories: [],
    skills: [],
    experience_years: null,
    location: '',
    hourly_rate_min: null,
    hourly_rate_max: null,
    project_rate_min: null,
    project_rate_max: null,
    availability: 'available',
  })

  // 초기 데이터 로드
  useEffect(() => {
    if (profile?.name) {
      setData((prev) => ({ ...prev, name: profile.name || '' }))
    }
  }, [profile])

  // 인증 체크
  useEffect(() => {
    if (!user && !profile) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, profile, router])

  const updateData = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleCategory = (category: ExpertCategory) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !data.skills.includes(skill.trim())) {
      setData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.name.trim().length >= 2
      case 1:
        return data.categories.length > 0
      case 2:
        return data.skills.length > 0
      case 3:
        return data.location !== ''
      case 4:
        return true // 요금은 선택사항
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // 사용자 이름 업데이트
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: data.name,
          user_type: 'expert',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (userError) throw userError

      // 전문가 프로필 생성
      const { error: profileError } = await supabase.from('expert_profiles').upsert({
        user_id: user.id,
        bio: data.bio,
        categories: data.categories,
        skills: data.skills,
        experience_years: data.experience_years,
        location: data.location,
        hourly_rate_min: data.hourly_rate_min,
        hourly_rate_max: data.hourly_rate_max,
        project_rate_min: data.project_rate_min,
        project_rate_max: data.project_rate_max,
        availability: data.availability,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      await refreshProfile()
      showToast('success', '프로필이 완성되었습니다!')
      router.push(ROUTES.DASHBOARD)
    } catch (error) {
      console.error('Onboarding error:', error)
      showToast('error', '프로필 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">전문가 프로필 설정</h1>
          <p className="text-gray-600 mt-2">
            프로필을 완성하고 클라이언트에게 발견되세요
          </p>
        </div>

        {/* 프로그레스 */}
        <div className="mb-8">
          <StepProgress steps={STEPS} currentStep={currentStep} />
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8">
          {/* Step 0: 기본 정보 */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">기본 정보</h2>
                  <p className="text-sm text-gray-500">
                    클라이언트에게 보여질 이름과 소개를 입력하세요
                  </p>
                </div>
              </div>

              <Input
                label="이름 (필수)"
                placeholder="활동명 또는 실명"
                value={data.name}
                onChange={(e) => updateData('name', e.target.value)}
              />

              <Textarea
                label="자기소개"
                placeholder="자신의 전문성과 경험을 간략히 소개해주세요. (200자 이상 권장)"
                value={data.bio}
                onChange={(e) => updateData('bio', e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          )}

          {/* Step 1: 전문 분야 */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Briefcase className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">전문 분야 선택</h2>
                  <p className="text-sm text-gray-500">
                    활동할 전문 분야를 선택하세요 (복수 선택 가능)
                  </p>
                </div>
              </div>

              {Object.entries(EXPERT_CATEGORY_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPERT_CATEGORIES.filter((c) => c.group === groupKey).map(
                      (category) => (
                        <button
                          key={category.value}
                          onClick={() => toggleCategory(category.value)}
                          className={cn(
                            'p-3 text-left rounded-xl border transition-all',
                            data.categories.includes(category.value)
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {category.label}
                            </span>
                            {data.categories.includes(category.value) && (
                              <CheckCircle className="h-4 w-4 text-black" />
                            )}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: 스킬 */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">보유 스킬</h2>
                  <p className="text-sm text-gray-500">
                    사용 가능한 소프트웨어와 기술을 추가하세요
                  </p>
                </div>
              </div>

              {/* 선택된 스킬 */}
              {data.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 스킬 입력 */}
              <div className="flex gap-2">
                <Input
                  placeholder="스킬 이름을 입력하세요"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill(skillInput)
                    }
                  }}
                />
                <Button onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}>
                  추가
                </Button>
              </div>

              {/* 추천 스킬 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">추천 스킬</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.filter((s) => !data.skills.includes(s))
                    .slice(0, 12)
                    .map((skill) => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:border-gray-400 transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 경력/위치 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <MapPin className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">경력 및 활동 지역</h2>
                  <p className="text-sm text-gray-500">
                    경력과 주로 활동하는 지역을 알려주세요
                  </p>
                </div>
              </div>

              <Input
                label="경력 (년)"
                type="number"
                placeholder="예: 5"
                value={data.experience_years?.toString() || ''}
                onChange={(e) =>
                  updateData(
                    'experience_years',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 지역 (필수)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LOCATIONS.map((location) => (
                    <button
                      key={location}
                      onClick={() => updateData('location', location)}
                      className={cn(
                        'p-2 text-sm rounded-lg border transition-all',
                        data.location === location
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 요금 설정 */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">요금 설정</h2>
                  <p className="text-sm text-gray-500">
                    시급 및 프로젝트 요금 범위를 설정하세요 (선택사항)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">시급 범위 (원)</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="최소 시급"
                    type="number"
                    value={data.hourly_rate_min?.toString() || ''}
                    onChange={(e) =>
                      updateData(
                        'hourly_rate_min',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                  <Input
                    placeholder="최대 시급"
                    type="number"
                    value={data.hourly_rate_max?.toString() || ''}
                    onChange={(e) =>
                      updateData(
                        'hourly_rate_max',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  프로젝트 비용 범위 (원)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="최소 비용"
                    type="number"
                    value={data.project_rate_min?.toString() || ''}
                    onChange={(e) =>
                      updateData(
                        'project_rate_min',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                  <Input
                    placeholder="최대 비용"
                    type="number"
                    value={data.project_rate_max?.toString() || ''}
                    onChange={(e) =>
                      updateData(
                        'project_rate_max',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 작업 가능 상태
                </label>
                <div className="flex gap-2">
                  {(['available', 'busy', 'unavailable'] as AvailabilityStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => updateData('availability', status)}
                        className={cn(
                          'flex-1 py-2 px-4 rounded-lg border text-sm transition-all',
                          data.availability === status
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {status === 'available'
                          ? '가능'
                          : status === 'busy'
                          ? '바쁨'
                          : '불가'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 네비게이션 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <div>
              {currentStep > 0 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  이전
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  건너뛰기
                </Button>
              )}
            </div>

            <Button onClick={handleNext} disabled={!canProceed()} isLoading={isLoading}>
              {currentStep === STEPS.length - 1 ? '완료' : '다음'}
              {currentStep < STEPS.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
