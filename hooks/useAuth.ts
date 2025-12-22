'use client'

// ===========================
// 인증 훅
// ===========================

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  isLoading: boolean
}

export function useAuth() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  })

  // 사용자 프로필 가져오기
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return data as User | null
  }, [supabase])

  // 초기 세션 확인 및 인증 상태 구독
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, isLoading: false })
      } else {
        setState({ user: null, profile: null, isLoading: false })
      }
    }

    initAuth()

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, isLoading: false })
        } else {
          setState({ user: null, profile: null, isLoading: false })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // 이메일 로그인
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  // 이메일 회원가입
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { name?: string; user_type?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
    return data
  }

  // 카카오 로그인
  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  // 구글 로그인
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push(ROUTES.HOME)
    router.refresh()
  }

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id)
      setState((prev) => ({ ...prev, profile }))
    }
  }

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithKakao,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }
}
