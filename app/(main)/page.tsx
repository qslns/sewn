// ===========================
// 랜딩 페이지 (디자인 시스템 적용)
// ===========================

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES, EXPERT_CATEGORIES, EXPERT_CATEGORY_GROUPS } from '@/lib/constants'
import { WaitlistForm } from '@/components/waitlist-form'
import {
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Zap,
  Star,
  Scissors,
  Camera,
  Palette,
  Box,
} from 'lucide-react'

// 히어로 섹션
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-accent-cream">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="accent" className="mb-6 animate-fade-in">
            패션 프로덕션 전문가 플랫폼
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-in-up">
            패션 프로덕션의
            <br />
            <span className="text-accent-camel">모든 전문가</span>를 한 곳에서
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in-up">
            패턴메이커, 3D 디자이너, 샘플리스트, 모델, 포토그래퍼까지.
            <br className="hidden sm:block" />
            당신의 패션 프로젝트에 딱 맞는 전문가를 찾아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Link href={ROUTES.EXPERTS}>
              <Button size="lg" className="w-full sm:w-auto shadow-medium">
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

          {/* 통계 */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">전문가</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">16</p>
              <p className="text-sm text-gray-500">전문 분야</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">98%</p>
              <p className="text-sm text-gray-500">만족도</p>
            </div>
          </div>
        </div>
      </div>

      {/* 배경 요소 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent-beige/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent-sand/20 to-transparent" />
      </div>
    </section>
  )
}

// 카테고리 그룹 섹션
function CategorySection() {
  const groupIcons = {
    TECHNICAL: Box,
    PRODUCTION: Scissors,
    CREATIVE: Palette,
    MEDIA: Camera,
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            16개 분야의 전문가
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            패션 프로덕션에 필요한 모든 분야의 검증된 전문가들이 기다리고 있습니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(EXPERT_CATEGORY_GROUPS).map(([groupKey, group]) => {
            const Icon = groupIcons[groupKey as keyof typeof groupIcons]
            const categories = EXPERT_CATEGORIES.filter((c) => c.group === groupKey)

            return (
              <div
                key={groupKey}
                className="p-6 bg-gray-50 rounded-2xl hover:bg-accent-cream transition-colors duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-xl shadow-soft">
                    <Icon className="h-5 w-5 text-accent-camel" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{group.label}</h3>
                </div>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.value}>
                      <Link
                        href={`${ROUTES.EXPERTS}?category=${category.value}`}
                        className="text-sm text-gray-600 hover:text-accent-camel transition-colors"
                      >
                        {category.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link href={ROUTES.EXPERTS}>
            <Button variant="outline" size="lg">
              전체 전문가 보기
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
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            왜 Sewn인가요?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            패션 프로덕션에 특화된 전문 플랫폼으로서 최고의 경험을 제공합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-medium transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-cream mb-6">
                <value.icon className="h-8 w-8 text-accent-camel" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600">{value.description}</p>
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
    <section className="py-24 bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">이렇게 진행됩니다</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            간단한 4단계로 프로젝트를 시작해보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* 연결선 */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gray-700" />

          {steps.map((item) => (
            <div key={item.step} className="relative text-center md:text-left">
              <div className="inline-flex md:flex items-center justify-center w-24 h-24 md:w-auto md:h-auto mb-6">
                <span className="text-6xl md:text-7xl font-bold text-gray-800">
                  {item.step}
                </span>
              </div>
              <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href={ROUTES.PROJECT_NEW}>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              프로젝트 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 왼쪽: 이미지 영역 */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-accent-beige to-accent-cream rounded-3xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Scissors className="h-24 w-24 text-accent-camel/50 mx-auto mb-4" />
                  <p className="text-accent-camel font-medium">전문가 이미지</p>
                </div>
              </div>
            </div>
            {/* 플로팅 카드 */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lift p-6 max-w-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-accent-sand" />
                  <div className="w-8 h-8 rounded-full bg-accent-camel" />
                  <div className="w-8 h-8 rounded-full bg-accent-beige" />
                </div>
                <span className="text-sm font-medium text-gray-900">+500명의 전문가</span>
              </div>
              <p className="text-xs text-gray-500">지금 바로 참여하세요</p>
            </div>
          </div>

          {/* 오른쪽: 텍스트 */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              전문가로 활동하세요
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              당신의 전문성을 필요로 하는 브랜드와 디자이너들이 기다리고 있습니다.
              프로필을 등록하고 새로운 기회를 만나보세요.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-light flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" variant="accent">
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
    <section className="py-24 bg-accent-cream">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            출시 알림 받기
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Sewn의 정식 출시 소식과 특별 혜택을 가장 먼저 받아보세요.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  )
}

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
