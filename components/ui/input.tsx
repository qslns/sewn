'use client'

// ===========================
// 입력 필드 컴포넌트 (디자인 시스템 적용)
// ===========================

import { forwardRef, type InputHTMLAttributes, useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      type,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type

    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-1.5 transition-colors',
              hasError ? 'text-error' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-colors',
                hasError ? 'text-error' : 'text-gray-400'
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={actualType}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              // 기본 상태
              !hasError && !hasSuccess && 'border-gray-300 focus:ring-black',
              // 에러 상태
              hasError && 'border-error focus:ring-error',
              // 성공 상태
              hasSuccess && 'border-success focus:ring-success',
              // 아이콘 패딩
              leftIcon && 'pl-10',
              (rightIcon || (isPassword && showPasswordToggle)) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {/* 오른쪽 아이콘 영역 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasError && !rightIcon && !showPasswordToggle && (
              <AlertCircle className="h-4 w-4 text-error" />
            )}
            {hasSuccess && !rightIcon && !showPasswordToggle && (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {rightIcon && !showPasswordToggle && (
              <span className="text-gray-400">{rightIcon}</span>
            )}
          </div>
        </div>
        {/* 힌트/에러/성공 메시지 */}
        {error && (
          <p className="mt-1.5 text-sm text-error flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-1.5 text-sm text-success flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {success}
          </p>
        )}
        {hint && !error && !success && (
          <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// 검색 입력 컴포넌트
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={ref}
          type="search"
          className={cn(
            'flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            className
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch((e.target as HTMLInputElement).value)
            }
          }}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export { Input, SearchInput }
