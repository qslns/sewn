-- ===========================
-- Sewn 플랫폼 - 01. 테이블 및 ENUM 타입
-- 실행 순서: 1번째
-- ===========================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- ENUM 타입 정의
-- ===========================

CREATE TYPE user_type AS ENUM ('expert', 'client', 'both');
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE contract_status AS ENUM ('pending_payment', 'in_progress', 'completed', 'disputed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('escrow_deposit', 'release_to_expert', 'refund_to_client', 'platform_fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');

-- ===========================
-- 테이블 생성
-- ===========================

-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  user_type user_type NOT NULL DEFAULT 'client',
  name TEXT,
  profile_image_url TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 전문가 프로필 테이블
CREATE TABLE expert_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  categories JSONB DEFAULT '[]'::JSONB,
  skills JSONB DEFAULT '[]'::JSONB,
  experience_years INTEGER,
  education TEXT,
  location TEXT,
  hourly_rate_min INTEGER,
  hourly_rate_max INTEGER,
  project_rate_min INTEGER,
  project_rate_max INTEGER,
  availability availability_status DEFAULT 'available',
  rating_avg NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 포트폴리오 아이템 테이블
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_urls JSONB DEFAULT '[]'::JSONB,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  categories JSONB DEFAULT '[]'::JSONB,
  budget_min INTEGER,
  budget_max INTEGER,
  deadline DATE,
  location TEXT,
  attachment_urls JSONB DEFAULT '[]'::JSONB,
  status project_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제안서 테이블
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  proposed_rate INTEGER NOT NULL,
  estimated_duration TEXT,
  status proposal_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, expert_id)
);

-- 계약 테이블
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreed_amount INTEGER NOT NULL,
  platform_fee_rate NUMERIC(4,2) DEFAULT 0.15,
  status contract_status DEFAULT 'pending_payment',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래 테이블
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화 테이블
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids JSONB NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_urls JSONB DEFAULT '[]'::JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리뷰 테이블
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, reviewer_id)
);

-- 대기자 명단 테이블 (MVP용)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  user_type user_type,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
