// ===========================
// Next.js 미들웨어 (인증 및 세션 관리)
// ===========================

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 인증이 필요한 경로
const protectedRoutes = [
  '/dashboard',
  '/messages',
  '/projects/new',
]

// 로그인한 사용자가 접근하면 안 되는 경로
const authRoutes = [
  '/login',
  '/register',
]

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // 보호된 경로 체크 (현재는 세션 갱신만 수행)
  // 실제 인증 체크는 각 페이지에서 수행

  return response
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * - public 폴더의 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
