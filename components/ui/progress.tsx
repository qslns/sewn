// ===========================
// 진행률 컴포넌트
// ===========================

import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'

// 프로그레스 바
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
  showLabel?: boolean
  labelPosition?: 'inside' | 'outside'
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      labelPosition = 'outside',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    }

    const variants = {
      default: 'bg-black',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-error',
      accent: 'bg-accent-camel',
    }

    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        {showLabel && labelPosition === 'outside' && (
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            'w-full bg-gray-200 rounded-full overflow-hidden',
            sizes[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              variants[variant],
              showLabel && labelPosition === 'inside' && 'flex items-center justify-center'
            )}
            style={{ width: `${percentage}%` }}
          >
            {showLabel && labelPosition === 'inside' && size === 'lg' && (
              <span className="text-xs font-medium text-white px-2">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

// 원형 프로그레스
export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  strokeWidth?: number
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
  showLabel?: boolean
}

const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      strokeWidth = 4,
      variant = 'default',
      showLabel = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    }

    const variants = {
      default: 'stroke-black',
      success: 'stroke-success',
      warning: 'stroke-warning',
      danger: 'stroke-error',
      accent: 'stroke-accent-camel',
    }

    const sizeValue = sizes[size]
    const radius = (sizeValue - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: sizeValue, height: sizeValue }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <svg
          className="transform -rotate-90"
          width={sizeValue}
          height={sizeValue}
        >
          {/* 배경 원 */}
          <circle
            className="stroke-gray-200"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={sizeValue / 2}
            cy={sizeValue / 2}
          />
          {/* 진행률 원 */}
          <circle
            className={cn('transition-all duration-300 ease-out', variants[variant])}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={sizeValue / 2}
            cy={sizeValue / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {showLabel && (
          <span
            className={cn(
              'absolute font-semibold text-gray-900',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-xl'
            )}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)

CircularProgress.displayName = 'CircularProgress'

// 스텝 프로그레스
export interface StepProgressProps {
  steps: { label: string; description?: string }[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={index} className={cn('flex items-center', !isLast && 'flex-1')}>
              {/* 스텝 원 */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-black text-white',
                    isCurrent && 'bg-black text-white ring-4 ring-gray-100',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isCurrent ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {/* 연결선 */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    isCompleted ? 'bg-black' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { Progress, CircularProgress }
