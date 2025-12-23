// ===========================
// 소셜 로그인 함수
// ===========================

import { getSupabaseClient } from '@/lib/supabase/client'

export type SocialProvider = 'kakao' | 'google'

// 카카오 로그인
export async function signInWithKakao() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  })

  if (error) {
    console.error('Kakao sign in error:', error)
    throw error
  }

  return data
}

// 구글 로그인
export async function signInWithGoogle() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Google sign in error:', error)
    throw error
  }

  return data
}

// 통합 소셜 로그인 함수
export async function signInWithSocial(provider: SocialProvider) {
  switch (provider) {
    case 'kakao':
      return signInWithKakao()
    case 'google':
      return signInWithGoogle()
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
