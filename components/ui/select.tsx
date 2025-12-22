'use client'

// ===========================
// 셀렉트 컴포넌트
// ===========================

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  selectSize?: 'sm' | 'md' | 'lg'
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      selectSize = 'md',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name

    const sizeClasses = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base',
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'flex w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10',
              'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              sizeClasses[selectSize],
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
