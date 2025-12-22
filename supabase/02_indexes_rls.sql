-- ===========================
-- Sewn 플랫폼 - 02. 인덱스 및 RLS 정책
-- 실행 순서: 2번째 (01_tables.sql 실행 후)
-- ===========================

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
-- Row Level Security (RLS) 활성화
-- ===========================

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

-- ===========================
-- RLS 정책
-- ===========================

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
