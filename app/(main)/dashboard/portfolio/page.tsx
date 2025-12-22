'use client'

// ===========================
// 포트폴리오 관리 페이지
// ===========================

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { LoadingState } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import { Plus, Image as ImageIcon, Trash2, Edit2, X } from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_urls: string[]
  category: string | null
  created_at: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const supabase = getSupabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expertId, setExpertId] = useState<string | null>(null)

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as File[],
    existingImages: [] as string[],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const isExpert = profile?.user_type === 'expert' || profile?.user_type === 'both'

  // 데이터 로드
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN)
      return
    }

    const loadData = async () => {
      if (!user || !isExpert) {
        setIsLoading(false)
        return
      }

      try {
        // 전문가 ID 조회
        const { data: expertData } = await supabase
          .from('expert_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!expertData) {
          showToast('info', '먼저 프로필을 작성해주세요.')
          router.push(ROUTES.DASHBOARD_PROFILE)
          return
        }

        setExpertId(expertData.id)

        // 포트폴리오 조회
        const { data: portfolioData, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('expert_id', expertData.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setItems(portfolioData || [])
      } catch (error) {
        console.error('Failed to load portfolio:', error)
        showToast('error', '포트폴리오를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, profile, authLoading, isExpert, router, supabase, showToast])

  const handleOpenModal = (item?: PortfolioItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        description: item.description || '',
        images: [],
        existingImages: item.image_urls,
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: '',
        description: '',
        images: [],
        existingImages: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      title: '',
      description: '',
      images: [],
      existingImages: [],
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }))
  }

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    }
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('portfolios')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('portfolios')
        .getPublicUrl(data.path)

      urls.push(urlData.publicUrl)
    }

    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!expertId || !formData.title.trim()) {
      showToast('error', '제목을 입력해주세요.')
      return
    }

    setIsSaving(true)

    try {
      let imageUrls = formData.existingImages

      // 새 이미지 업로드
      if (formData.images.length > 0) {
        setUploadingImages(true)
        const newUrls = await uploadImages(formData.images)
        imageUrls = [...imageUrls, ...newUrls]
        setUploadingImages(false)
      }

      const itemData = {
        expert_id: expertId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        image_urls: imageUrls,
      }

      if (editingItem) {
        // 수정
        const { error } = await supabase
          .from('portfolio_items')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) throw error

        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? { ...item, ...itemData }
              : item
          )
        )
        showToast('success', '포트폴리오가 수정되었습니다.')
      } else {
        // 생성
        const { data, error } = await supabase
          .from('portfolio_items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error

        setItems((prev) => [data, ...prev])
        showToast('success', '포트폴리오가 추가되었습니다.')
      }

      handleCloseModal()
    } catch (error) {
      console.error('Failed to save portfolio:', error)
      showToast('error', '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
      setUploadingImages(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems((prev) => prev.filter((item) => item.id !== id))
      showToast('success', '포트폴리오가 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete portfolio:', error)
      showToast('error', '삭제 중 오류가 발생했습니다.')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="포트폴리오를 불러오는 중..." />
      </div>
    )
  }

  if (!isExpert) {
    return (
      <div className="py-16">
        <EmptyState
          icon={ImageIcon}
          title="전문가만 이용 가능합니다"
          description="포트폴리오 기능은 전문가 회원만 사용할 수 있습니다."
          action={{
            label: '프로필 설정하기',
            onClick: () => router.push(ROUTES.DASHBOARD_PROFILE),
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">포트폴리오</h1>
          <p className="text-gray-600 mt-1">
            작업물을 업로드하여 클라이언트에게 보여주세요.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          추가하기
        </Button>
      </div>

      {/* 포트폴리오 그리드 */}
      {items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="포트폴리오가 없습니다"
          description="첫 번째 작업물을 추가해보세요."
          action={{
            label: '추가하기',
            onClick: () => handleOpenModal(),
          }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                {item.image_urls[0] ? (
                  <Image
                    src={item.image_urls[0]}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenModal(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-gray-900 truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 추가/편집 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? '포트폴리오 수정' : '포트폴리오 추가'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="제목"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="작업물 제목"
            required
          />

          <Textarea
            label="설명"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="작업물에 대한 설명을 입력하세요"
          />

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지
            </label>

            {/* 기존 이미지 */}
            {formData.existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.existingImages.map((url, index) => (
                  <div key={url} className="relative w-20 h-20">
                    <Image
                      src={url}
                      alt={`이미지 ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, true)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 새 이미지 미리보기 */}
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.map((file, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`새 이미지 ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, false)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              이미지 추가
            </Button>
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              취소
            </Button>
            <Button type="submit" isLoading={isSaving || uploadingImages}>
              {uploadingImages ? '업로드 중...' : isSaving ? '저장 중...' : '저장'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
