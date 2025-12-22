'use client'

// ===========================
// 프로필 편집 페이지
// ===========================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES, EXPERT_CATEGORIES, LOCATIONS, COMMON_SKILLS } from '@/lib/constants'
import { Camera, Plus, X } from 'lucide-react'
import type { ExpertCategory, AvailabilityStatus } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expertProfile, setExpertProfile] = useState<{
    bio: string
    categories: ExpertCategory[]
    skills: string[]
    experience_years: number | null
    education: string
    location: string
    hourly_rate_min: number | null
    hourly_rate_max: number | null
    project_rate_min: number | null
    project_rate_max: number | null
    availability: AvailabilityStatus
  } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    categories: [] as ExpertCategory[],
    skills: [] as string[],
    experience_years: '',
    education: '',
    location: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    project_rate_min: '',
    project_rate_max: '',
    availability: 'available' as AvailabilityStatus,
  })

  const [newSkill, setNewSkill] = useState('')

  const isExpert = profile?.user_type === 'expert' || profile?.user_type === 'both'

  // 데이터 로드
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    const loadProfile = async () => {
      if (!user) return

      setIsLoading(true)

      try {
        // 기본 사용자 정보
        setFormData((prev) => ({
          ...prev,
          name: profile?.name || '',
        }))

        // 전문가 프로필 조회
        if (isExpert) {
          const { data: expertData } = await supabase
            .from('expert_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (expertData) {
            setExpertProfile(expertData)
            setFormData((prev) => ({
              ...prev,
              bio: expertData.bio || '',
              categories: expertData.categories || [],
              skills: expertData.skills || [],
              experience_years: expertData.experience_years?.toString() || '',
              education: expertData.education || '',
              location: expertData.location || '',
              hourly_rate_min: expertData.hourly_rate_min?.toString() || '',
              hourly_rate_max: expertData.hourly_rate_max?.toString() || '',
              project_rate_min: expertData.project_rate_min?.toString() || '',
              project_rate_max: expertData.project_rate_max?.toString() || '',
              availability: expertData.availability || 'available',
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, profile, authLoading, isExpert, router, supabase])

  const handleCategoryToggle = (category: ExpertCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsSaving(true)

    try {
      // 사용자 기본 정보 업데이트
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', user.id)

      if (userError) throw userError

      // 전문가 프로필 업데이트
      if (isExpert) {
        const expertData = {
          user_id: user.id,
          bio: formData.bio || null,
          categories: formData.categories,
          skills: formData.skills,
          experience_years: formData.experience_years
            ? parseInt(formData.experience_years)
            : null,
          education: formData.education || null,
          location: formData.location || null,
          hourly_rate_min: formData.hourly_rate_min
            ? parseInt(formData.hourly_rate_min)
            : null,
          hourly_rate_max: formData.hourly_rate_max
            ? parseInt(formData.hourly_rate_max)
            : null,
          project_rate_min: formData.project_rate_min
            ? parseInt(formData.project_rate_min)
            : null,
          project_rate_max: formData.project_rate_max
            ? parseInt(formData.project_rate_max)
            : null,
          availability: formData.availability,
        }

        if (expertProfile) {
          // 업데이트
          const { error: expertError } = await supabase
            .from('expert_profiles')
            .update(expertData)
            .eq('user_id', user.id)

          if (expertError) throw expertError
        } else {
          // 새로 생성
          const { error: expertError } = await supabase
            .from('expert_profiles')
            .insert(expertData)

          if (expertError) throw expertError
        }
      }

      await refreshProfile()
      showToast('success', '프로필이 저장되었습니다.')
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast('error', '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="프로필을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필 편집</h1>
        <p className="text-gray-600 mt-1">
          프로필 정보를 수정하고 저장하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 프로필 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={profile?.profile_image_url}
                  alt={profile?.name || '프로필'}
                  size="xl"
                />
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  JPG, PNG 파일을 업로드하세요. 최대 5MB.
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  이미지 변경
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="이름"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="홍길동"
            />

            {isExpert && (
              <Textarea
                label="자기소개"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="간단한 자기소개를 작성해주세요"
                className="min-h-[120px]"
              />
            )}
          </CardContent>
        </Card>

        {/* 전문가 정보 */}
        {isExpert && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>전문 분야</CardTitle>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>스킬</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="스킬 입력 (예: CLO3D, Illustrator)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-gray-500">추천 스킬:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (!formData.skills.includes(skill)) {
                          setFormData((prev) => ({
                            ...prev,
                            skills: [...prev.skills, skill],
                          }))
                        }
                      }}
                      disabled={formData.skills.includes(skill)}
                      className="text-xs px-2 py-1 bg-gray-50 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>경력 및 학력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="경력 (년)"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience_years: e.target.value,
                    }))
                  }
                  placeholder="5"
                  min="0"
                  max="50"
                />
                <Input
                  label="학력"
                  value={formData.education}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      education: e.target.value,
                    }))
                  }
                  placeholder="예: 서울대학교 의류학과 학사"
                />
                <Select
                  label="지역"
                  options={LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="지역 선택"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>요금</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="최소 시급 (원)"
                    type="number"
                    value={formData.hourly_rate_min}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hourly_rate_min: e.target.value,
                      }))
                    }
                    placeholder="30000"
                  />
                  <Input
                    label="최대 시급 (원)"
                    type="number"
                    value={formData.hourly_rate_max}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hourly_rate_max: e.target.value,
                      }))
                    }
                    placeholder="50000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="최소 프로젝트 단가 (원)"
                    type="number"
                    value={formData.project_rate_min}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        project_rate_min: e.target.value,
                      }))
                    }
                    placeholder="500000"
                  />
                  <Input
                    label="최대 프로젝트 단가 (원)"
                    type="number"
                    value={formData.project_rate_max}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        project_rate_max: e.target.value,
                      }))
                    }
                    placeholder="2000000"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>가용 상태</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {(['available', 'busy', 'unavailable'] as AvailabilityStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, availability: status }))
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.availability === status
                            ? status === 'available'
                              ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                              : status === 'busy'
                              ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500'
                              : 'bg-gray-100 text-gray-800 ring-2 ring-gray-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
              </CardContent>
            </Card>
          </>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={isSaving}>
            저장하기
          </Button>
        </div>
      </form>
    </div>
  )
}
