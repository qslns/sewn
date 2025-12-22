-- ===========================
-- Sewn 플랫폼 데이터베이스 스키마
-- Supabase PostgreSQL
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
-- 사용자 테이블
-- ===========================

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

-- ===========================
-- 인덱스
-- ===========================

CREATE INDEX idx_expert_profiles_user_id ON expert_profiles(user_id);
CREATE INDEX idx_expert_profiles_categories ON expert_profiles USING GIN(categories);
CREATE INDEX idx_expert_profiles_availability ON expert_profiles(availability);
CREATE INDEX idx_expert_profiles_rating ON expert_profiles(rating_avg DESC);

CREATE INDEX idx_portfolio_items_expert_id ON portfolio_items(expert_id);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_categories ON projects USING GIN(categories);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX idx_proposals_project_id ON proposals(project_id);
CREATE INDEX idx_proposals_expert_id ON proposals(expert_id);

CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_expert_id ON contracts(expert_id);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

-- ===========================
-- 트리거 함수
-- ===========================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 생성 시 users 테이블에 자동 삽입
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 리뷰 작성 시 전문가 평점 업데이트
CREATE OR REPLACE FUNCTION update_expert_rating()
RETURNS TRIGGER AS $$
DECLARE
  expert_user_id UUID;
  new_avg NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  -- 리뷰 대상이 전문가인 경우에만 업데이트
  SELECT user_id INTO expert_user_id
  FROM expert_profiles ep
  JOIN users u ON ep.user_id = u.id
  WHERE u.id = NEW.reviewee_id;

  IF expert_user_id IS NOT NULL THEN
    SELECT AVG(rating), COUNT(*)
    INTO new_avg, new_count
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id;

    UPDATE expert_profiles
    SET rating_avg = COALESCE(new_avg, 0),
        review_count = COALESCE(new_count, 0)
    WHERE user_id = NEW.reviewee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 트리거
-- ===========================

-- updated_at 트리거
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expert_profiles_updated_at
  BEFORE UPDATE ON expert_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 새 사용자 처리 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 리뷰 평점 업데이트 트리거
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_expert_rating();

-- ===========================
-- Row Level Security (RLS)
-- ===========================

-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users 정책
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Expert Profiles 정책
CREATE POLICY "Expert profiles are viewable by everyone" ON expert_profiles
  FOR SELECT USING (true);

CREATE POLICY "Experts can insert own profile" ON expert_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts can update own profile" ON expert_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio Items 정책
CREATE POLICY "Portfolio items are viewable by everyone" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own portfolio" ON portfolio_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expert_profiles
      WHERE id = portfolio_items.expert_id
      AND user_id = auth.uid()
    )
  );

-- Projects 정책
CREATE POLICY "Open projects are viewable by everyone" ON projects
  FOR SELECT USING (status != 'draft' OR client_id = auth.uid());

CREATE POLICY "Clients can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = client_id);

-- Proposals 정책
CREATE POLICY "Proposals viewable by project owner or expert" ON proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = proposals.project_id AND client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM expert_profiles WHERE id = proposals.expert_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Experts can create proposals" ON proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expert_profiles WHERE id = proposals.expert_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Experts can update own proposals" ON proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expert_profiles WHERE id = proposals.expert_id AND user_id = auth.uid()
    )
  );

-- Contracts 정책
CREATE POLICY "Contracts viewable by participants" ON contracts
  FOR SELECT USING (client_id = auth.uid() OR expert_id = auth.uid());

-- Transactions 정책
CREATE POLICY "Transactions viewable by contract participants" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE id = transactions.contract_id
      AND (client_id = auth.uid() OR expert_id = auth.uid())
    )
  );

-- Conversations 정책
CREATE POLICY "Conversations viewable by participants" ON conversations
  FOR SELECT USING (participant_ids ? auth.uid()::text);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (participant_ids ? auth.uid()::text);

-- Messages 정책
CREATE POLICY "Messages viewable by conversation participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND participant_ids ? auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND participant_ids ? auth.uid()::text
    )
  );

-- Reviews 정책
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their contracts" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM contracts
      WHERE id = reviews.contract_id
      AND (client_id = auth.uid() OR expert_id = auth.uid())
      AND status = 'completed'
    )
  );

-- Waitlist 정책
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);
