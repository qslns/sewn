'use client'

// ===========================
// 대시보드 레이아웃
// ===========================

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  FileText,
  Settings,
} from 'lucide-react'

const sidebarLinks = [
  {
    href: ROUTES.DASHBOARD,
    label: '대시보드',
    icon: LayoutDashboard,
  },
  {
    href: ROUTES.DASHBOARD_PROFILE,
    label: '프로필',
    icon: User,
  },
  {
    href: ROUTES.DASHBOARD_PORTFOLIO,
    label: '포트폴리오',
    icon: ImageIcon,
  },
  {
    href: ROUTES.DASHBOARD_CONTRACTS,
    label: '계약 관리',
    icon: FileText,
  },
  {
    href: ROUTES.DASHBOARD_SETTINGS,
    label: '설정',
    icon: Settings,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* 사이드바 - 데스크탑 */}
          <aside className="hidden lg:block w-64 py-8 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sidebarLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== ROUTES.DASHBOARD &&
                    pathname.startsWith(link.href))

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* 메인 컨텐츠 */}
          <main className="flex-1 py-8 min-w-0">{children}</main>
        </div>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          {sidebarLinks.slice(0, 4).map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== ROUTES.DASHBOARD && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 text-xs',
                  isActive ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
