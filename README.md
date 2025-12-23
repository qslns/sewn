# Sewn - 패션 프로덕션 전문가 매칭 플랫폼

패턴메이커, 3D 디자이너, 샘플리스트, 모델, 포토그래퍼 등 패션 프로덕션 전 과정의 전문가를 매칭해주는 플랫폼입니다.

## 주요 기능

### 전문가
- 16개 카테고리의 패션 프로덕션 전문가 프로필
- 포트폴리오 관리
- 프로젝트 제안서 관리
- 실시간 메시지
- 수익 현황 대시보드

### 클라이언트
- 프로젝트 등록 및 관리
- 전문가 검색 및 필터링
- 제안서 검토 및 수락
- 에스크로 결제 시스템

### 공통
- 카카오/구글 소셜 로그인
- 실시간 알림
- 계약 관리
- 리뷰 시스템

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **결제**: 토스페이먼츠
- **배포**: Vercel

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/qslns/sewn.git
cd sewn
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 필요한 값을 설정합니다:

```bash
cp .env.example .env.local
```

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키 (선택)

### 4. 데이터베이스 설정

Supabase SQL Editor에서 다음 순서로 마이그레이션을 실행합니다:

1. `supabase/01_tables.sql` - 테이블 생성
2. `supabase/02_indexes_rls.sql` - 인덱스 및 RLS
3. `supabase/03_functions_triggers.sql` - 함수 및 트리거
4. `supabase/04_views.sql` - 뷰 생성
5. `supabase/05_phase3_migration.sql` - Phase 3 마이그레이션
6. `supabase/06_phase4_migration.sql` - Phase 4 마이그레이션

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 프로젝트 구조

```
sewn/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/            # 메인 레이아웃 페이지
│   └── api/               # API 라우트
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                 # 커스텀 React 훅
├── lib/                   # 유틸리티 함수
│   ├── supabase/         # Supabase 클라이언트
│   └── payment/          # 결제 관련 유틸리티
├── types/                 # TypeScript 타입 정의
└── supabase/             # 데이터베이스 마이그레이션
```

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # 린트 검사
```

## 배포

Vercel을 통해 자동 배포됩니다:

1. GitHub 저장소 연결
2. 환경 변수 설정
3. 자동 배포 활성화

## 라이선스

MIT License
