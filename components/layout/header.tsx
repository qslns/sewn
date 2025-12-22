'use client'

// ===========================
// 헤더 컴포넌트
// ===========================

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ROUTES } from '@/lib/constants'
import { Menu, X, MessageSquare, Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: '전문가 찾기', href: ROUTES.EXPERTS },
  { name: '프로젝트', href: ROUTES.PROJECTS },
]

export function Header() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="text-xl font-bold tracking-tight">
              Sewn
            </Link>
          </div>

          {/* 데스크탑 네비게이션 */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 데스크탑 우측 메뉴 */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <>
                {/* 메시지 */}
                <Link
                  href={ROUTES.MESSAGES}
                  className="p-2 text-gray-500 hover:text-black transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                {/* 알림 */}
                <button className="p-2 text-gray-500 hover:text-black transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

                {/* 사용자 메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Avatar
                      src={profile?.profile_image_url}
                      alt={profile?.name || '사용자'}
                      size="sm"
                    />
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.name || '사용자'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href={ROUTES.DASHBOARD}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          대시보드
                        </Link>
                        <Link
                          href={ROUTES.DASHBOARD_PROFILE}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          프로필 편집
                        </Link>
                        <Link
                          href={ROUTES.DASHBOARD_SETTINGS}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          설정
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              signOut()
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                          >
                            로그아웃
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href={ROUTES.REGISTER}>
                  <Button size="sm">시작하기</Button>
                </Link>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block py-2 text-base font-medium',
                  isActive(item.href) ? 'text-black' : 'text-gray-500'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-4">
              {user ? (
                <>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className="block py-2 text-base font-medium text-gray-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    대시보드
                  </Link>
                  <Link
                    href={ROUTES.MESSAGES}
                    className="block py-2 text-base font-medium text-gray-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    메시지
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="block py-2 text-base font-medium text-red-600"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href={ROUTES.LOGIN} className="flex-1">
                    <Button variant="outline" className="w-full">
                      로그인
                    </Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} className="flex-1">
                    <Button className="w-full">시작하기</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
