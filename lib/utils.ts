// ===========================
// 유틸리티 함수
// ===========================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS 클래스 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅 (원화)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price)
}

// 가격 범위 포맷팅
export function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '협의'
  if (min === null) return `${formatPrice(max!)} 이하`
  if (max === null) return `${formatPrice(min)} 이상`
  if (min === max) return formatPrice(min)
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

// 날짜 포맷팅
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// 상대 시간 포맷팅
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  if (weeks < 4) return `${weeks}주 전`
  if (months < 12) return `${months}개월 전`
  return `${years}년 전`
}

// 텍스트 자르기
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// 별점 배열 생성
export function getStarArray(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < fullStars; i++) {
    stars.push('full')
  }
  if (hasHalfStar && stars.length < 5) {
    stars.push('half')
  }
  while (stars.length < 5) {
    stars.push('empty')
  }

  return stars
}

// 이메일 유효성 검사
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 비밀번호 강도 검사
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string
} {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) score++
  else feedback.push('8자 이상')

  if (/[a-z]/.test(password)) score++
  else feedback.push('소문자 포함')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('대문자 포함')

  if (/[0-9]/.test(password)) score++
  else feedback.push('숫자 포함')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('특수문자 포함')

  return {
    score,
    feedback: feedback.length > 0 ? `필요: ${feedback.join(', ')}` : '강력한 비밀번호입니다',
  }
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 파일 확장자 추출
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// 이미지 파일인지 확인
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
}

// 슬러그 생성
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// 쿼리 스트링 생성
export function createQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  return searchParams.toString()
}

// 디바운스 함수
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// 랜덤 ID 생성
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
