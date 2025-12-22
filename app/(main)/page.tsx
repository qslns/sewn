// ===========================
// 랜딩 페이지
// ===========================

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES, EXPERT_CATEGORIES } from '@/lib/constants'
import {
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Zap,
  Star,
} from 'lucide-react'

// 히어로 섹션
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            패션 프로덕션 전문가 플랫폼
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            패션 프로덕션의
            <br />
            <span className="text-gray-600">모든 전문가</span>를 한 곳에서
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            패턴메이커, 3D 디자이너, 샘플리스트, 모델, 포토그래퍼까지.
            <br className="hidden sm:block" />
            당신의 패션 프로젝트에 딱 맞는 전문가를 찾아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={ROUTES.EXPERTS}>
              <Button size="lg" className="w-full sm:w-auto">
                전문가 찾기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                전문가로 등록하기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-gray-100 to-gray-50 rounded-full blur-3xl opacity-60" />
      </div>
    </section>
  )
}

// 카테고리 섹션
function CategorySection() {
  const featuredCategories = EXPERT_CATEGORIES.slice(0, 8)

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            다양한 분야의 전문가
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            패션 프로덕션에 필요한 모든 분야의 검증된 전문가들이 기다리고 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredCategories.map((category) => (
            <Link
              key={category.value}
              href={`${ROUTES.EXPERTS}?category=${category.value}`}
              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-black">
                {category.label}
              </h3>
              <p className="text-sm text-gray-500">{category.description}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href={ROUTES.EXPERTS}>
            <Button variant="outline">
              모든 카테고리 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// 가치 제안 섹션
function ValueSection() {
  const values = [
    {
      icon: Users,
      title: '검증된 전문가',
      description:
        '포트폴리오와 리뷰를 통해 검증된 패션 프로덕션 전문가들만 활동합니다.',
    },
    {
      icon: Shield,
      title: '안전한 거래',
      description:
        '에스크로 기반 결제 시스템으로 안전하게 프로젝트를 진행할 수 있습니다.',
    },
    {
      icon: Zap,
      title: '빠른 매칭',
      description:
        '프로젝트를 등록하면 적합한 전문가들이 바로 제안서를 보내드립니다.',
    },
    {
      icon: Star,
      title: '합리적인 수수료',
      description:
        '전문가는 0-10%, 클라이언트는 10-15%의 투명한 수수료 체계를 운영합니다.',
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            왜 Sewn인가요?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            패션 프로덕션에 특화된 전문 플랫폼으로서 최고의 경험을 제공합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div key={value.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                <value.icon className="h-7 w-7 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-sm text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 작동 방식 섹션
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: '프로젝트 등록',
      description: '필요한 작업의 상세 내용과 예산, 일정을 등록하세요.',
    },
    {
      step: '02',
      title: '제안서 검토',
      description: '전문가들의 제안서를 비교하고 포트폴리오를 확인하세요.',
    },
    {
      step: '03',
      title: '전문가 선정',
      description: '가장 적합한 전문가를 선정하고 세부 사항을 조율하세요.',
    },
    {
      step: '04',
      title: '안전한 결제',
      description: '에스크로로 금액을 예치하고 작업 완료 후 정산됩니다.',
    },
  ]

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">이렇게 진행됩니다</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            간단한 4단계로 프로젝트를 시작해보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="text-5xl font-bold text-gray-700 mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>

              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 전문가용 CTA 섹션
function ExpertCTASection() {
  const benefits = [
    '자유로운 작업 선택',
    '투명한 낮은 수수료',
    '안정적인 대금 정산',
    '전문 포트폴리오 페이지',
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-100 rounded-2xl p-8 md:p-12 lg:p-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              전문가로 활동하세요
            </h2>
            <p className="text-gray-600 mb-6">
              당신의 전문성을 필요로 하는 브랜드와 디자이너들이 기다리고 있습니다.
              프로필을 등록하고 새로운 기회를 만나보세요.
            </p>
            <ul className="grid grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link href={ROUTES.REGISTER}>
              <Button size="lg">
                전문가 등록 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// 대기자 등록 섹션
function WaitlistSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            출시 알림 받기
          </h2>
          <p className="text-gray-600 mb-8">
            Sewn의 정식 출시 소식과 특별 혜택을 가장 먼저 받아보세요.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  )
}

// 대기자 등록 폼 (클라이언트 컴포넌트로 분리)
import { WaitlistForm } from '@/components/waitlist-form'

// 메인 페이지 컴포넌트
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <ValueSection />
      <HowItWorksSection />
      <ExpertCTASection />
      <WaitlistSection />
    </>
  )
}
