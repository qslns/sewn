// ===========================
// 루트 레이아웃
// ===========================

import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Sewn - 패션 프로덕션 전문가 매칭 플랫폼',
    template: '%s | Sewn',
  },
  description:
    '패턴메이커, 3D 디자이너, 샘플리스트, 모델, 포토그래퍼 등 패션 프로덕션 전 과정의 전문가를 만나보세요.',
  keywords: [
    '패션',
    '프리랜서',
    '패턴메이커',
    '3D 디자이너',
    '샘플리스트',
    '모델',
    '포토그래퍼',
    '스타일리스트',
    '패션 프로덕션',
  ],
  authors: [{ name: 'Sewn' }],
  creator: 'Sewn',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://sewn.kr',
    siteName: 'Sewn',
    title: 'Sewn - 패션 프로덕션 전문가 매칭 플랫폼',
    description:
      '패션 프로덕션 전 과정의 전문가를 한 곳에서 만나보세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sewn - 패션 프로덕션 전문가 매칭 플랫폼',
    description:
      '패션 프로덕션 전 과정의 전문가를 한 곳에서 만나보세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
