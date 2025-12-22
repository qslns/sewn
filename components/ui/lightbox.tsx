'use client'

// ===========================
// 라이트박스 컴포넌트
// ===========================

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LightboxProps {
  images: { url: string; title?: string; description?: string }[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)

  const currentImage = images[currentIndex]
  const hasMultiple = images.length > 1

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setIsZoomed(false)
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setIsZoomed(false)
  }, [images.length])

  // 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, goToPrev, goToNext, onClose])

  if (!isOpen || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          {hasMultiple && (
            <span className="text-sm opacity-80">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          {currentImage.title && (
            <h3 className="font-medium mt-1">{currentImage.title}</h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(!isZoomed)
            }}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div
        className={cn(
          'relative w-full h-full flex items-center justify-center p-16',
          isZoomed && 'cursor-zoom-out'
        )}
        onClick={(e) => {
          if (isZoomed) {
            e.stopPropagation()
            setIsZoomed(false)
          }
        }}
      >
        <div
          className={cn(
            'relative max-w-full max-h-full transition-transform duration-300',
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          )}
          onClick={(e) => {
            e.stopPropagation()
            setIsZoomed(!isZoomed)
          }}
        >
          <Image
            src={currentImage.url}
            alt={currentImage.title || `Image ${currentIndex + 1}`}
            width={1200}
            height={800}
            className="max-w-full max-h-[80vh] object-contain"
            priority
          />
        </div>
      </div>

      {/* 이전/다음 버튼 */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* 하단 설명 */}
      {currentImage.description && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white/90 text-center max-w-2xl mx-auto">
            {currentImage.description}
          </p>
        </div>
      )}

      {/* 썸네일 스트립 (5개 이상일 때) */}
      {images.length > 4 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
                setIsZoomed(false)
              }}
              className={cn(
                'w-12 h-12 rounded overflow-hidden transition-all',
                idx === currentIndex
                  ? 'ring-2 ring-white opacity-100'
                  : 'opacity-50 hover:opacity-75'
              )}
            >
              <Image
                src={img.url}
                alt={img.title || `Thumbnail ${idx + 1}`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 포트폴리오 그리드용 훅
export function useLightbox(images: { url: string; title?: string; description?: string }[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  const open = useCallback((index: number = 0) => {
    setInitialIndex(index)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    initialIndex,
    open,
    close,
    LightboxComponent: () => (
      <Lightbox
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={close}
      />
    ),
  }
}
