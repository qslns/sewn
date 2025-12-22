// ===========================
// 인증 페이지 레이아웃
// ===========================

import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 심플 헤더 */}
      <header className="py-6 px-4">
        <div className="container mx-auto">
          <Link href={ROUTES.HOME} className="text-xl font-bold">
            Sewn
          </Link>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* 심플 푸터 */}
      <footer className="py-6 px-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Sewn. All rights reserved.
      </footer>
    </div>
  )
}
