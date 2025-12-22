'use client'

// ===========================
// 탭 컴포넌트
// ===========================

import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// 탭 컨텍스트
interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// 탭 루트 컴포넌트
export interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = value ?? internalValue

  const setActiveTab = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// 탭 목록 컴포넌트
export interface TabsListProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'pills' | 'underline'
  fullWidth?: boolean
}

export function TabsList({
  children,
  className,
  variant = 'default',
  fullWidth = false,
}: TabsListProps) {
  const variants = {
    default: 'bg-gray-100 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200 gap-0',
  }

  return (
    <div
      className={cn(
        'flex items-center',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

// 탭 트리거 컴포넌트
export interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'pills' | 'underline'
  disabled?: boolean
}

export function TabsTrigger({
  value,
  children,
  className,
  variant = 'default',
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400',
    'disabled:pointer-events-none disabled:opacity-50'
  )

  const variants = {
    default: cn(
      'px-3 py-1.5 text-sm rounded-md',
      isActive
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-600 hover:text-gray-900'
    ),
    pills: cn(
      'px-4 py-2 text-sm rounded-full',
      isActive
        ? 'bg-black text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    ),
    underline: cn(
      'px-4 py-3 text-sm border-b-2 -mb-px',
      isActive
        ? 'border-black text-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    ),
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </button>
  )
}

// 탭 콘텐츠 컴포넌트
export interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
  forceMount?: boolean
}

export function TabsContent({
  value,
  children,
  className,
  forceMount = false,
}: TabsContentProps) {
  const { activeTab } = useTabsContext()
  const isActive = activeTab === value

  if (!isActive && !forceMount) return null

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      className={cn(
        'focus-visible:outline-none',
        isActive && 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  )
}
