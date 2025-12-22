'use client'

// ===========================
// 버튼 컴포넌트 (디자인 시스템 적용)
// ===========================

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-[0.98]'
    )

    const variants = {
      primary: cn(
        'bg-black text-white',
        'hover:bg-gray-800',
        'focus-visible:ring-gray-900'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus-visible:ring-gray-500'
      ),
      outline: cn(
        'border border-gray-300 bg-transparent text-gray-900',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus-visible:ring-gray-500'
      ),
      ghost: cn(
        'bg-transparent text-gray-700',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus-visible:ring-gray-500'
      ),
      danger: cn(
        'bg-error text-white',
        'hover:bg-error-dark',
        'focus-visible:ring-error'
      ),
      accent: cn(
        'bg-accent-camel text-white',
        'hover:bg-accent-sand',
        'focus-visible:ring-accent-camel'
      ),
    }

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-lg gap-2',
      xl: 'h-14 px-8 text-lg rounded-xl gap-3',
    }

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// 아이콘 버튼 컴포넌트
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  'aria-label': string
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-[0.95]'
    )

    const variants = {
      primary: 'bg-black text-white hover:bg-gray-800 focus-visible:ring-gray-900',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
      danger: 'bg-error text-white hover:bg-error-dark focus-visible:ring-error',
    }

    const sizes = {
      sm: 'h-8 w-8 rounded-md',
      md: 'h-10 w-10 rounded-lg',
      lg: 'h-12 w-12 rounded-xl',
    }

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          <span className={iconSizes[size]}>{children}</span>
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export { Button, IconButton }
