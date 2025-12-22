// ===========================
// 메인 레이아웃 (헤더/푸터 포함)
// ===========================

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
