-- ===========================
-- Sewn 플랫폼 - Phase 4 마이그레이션
-- 계약 시스템, 결제, 정산, 리뷰 완성
-- ===========================

-- ===========================
-- 1. contract_status ENUM 업데이트
-- ===========================

-- pending_approval 상태 추가 (기존 ENUM에 값 추가)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_approval' AND enumtypid = 'contract_status'::regtype) THEN
    ALTER TYPE contract_status ADD VALUE 'pending_approval' AFTER 'in_progress';
  END IF;
END $$;

-- ===========================
-- 2. contracts 테이블 컬럼 추가
-- ===========================

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_key VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS completion_requested_at TIMESTAMPTZ;

-- ===========================
-- 3. 알림 타입 추가
-- ===========================

-- notifications 테이블이 varchar라면 체크 필요 없음
-- 새로운 알림 타입들: contract_created, payment_completed, completion_requested, contract_completed, review_request

-- ===========================
-- 4. 전문가 수익 뷰 생성
-- ===========================

CREATE OR REPLACE VIEW expert_earnings AS
SELECT
  ep.user_id,
  ep.id as expert_profile_id,
  u.name as expert_name,
  COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_contracts,
  COALESCE(SUM(CASE WHEN c.status = 'completed'
    THEN c.agreed_amount * (1 - c.platform_fee_rate)
    ELSE 0 END), 0)::INTEGER as total_earnings,
  COALESCE(SUM(CASE WHEN c.status = 'in_progress' OR c.status = 'pending_approval'
    THEN c.agreed_amount * (1 - c.platform_fee_rate)
    ELSE 0 END), 0)::INTEGER as pending_earnings,
  COALESCE(SUM(CASE WHEN c.status = 'completed'
      AND c.completed_at >= date_trunc('month', CURRENT_DATE)
    THEN c.agreed_amount * (1 - c.platform_fee_rate)
    ELSE 0 END), 0)::INTEGER as this_month_earnings
FROM expert_profiles ep
JOIN users u ON ep.user_id = u.id
LEFT JOIN contracts c ON c.expert_id = u.id
GROUP BY ep.user_id, ep.id, u.name;

-- ===========================
-- 5. 계약 상세 뷰 생성
-- ===========================

CREATE OR REPLACE VIEW contract_details AS
SELECT
  c.id,
  c.project_id,
  c.client_id,
  c.expert_id,
  c.agreed_amount,
  c.platform_fee_rate,
  c.status,
  c.started_at,
  c.completed_at,
  c.created_at,
  c.payment_id,
  c.payment_key,
  c.proposal_id,
  c.deadline,
  c.completion_requested_at,
  -- 계산된 금액
  (c.agreed_amount * c.platform_fee_rate)::INTEGER as platform_fee,
  (c.agreed_amount * (1 - c.platform_fee_rate))::INTEGER as expert_amount,
  -- 프로젝트 정보
  p.title as project_title,
  p.description as project_description,
  -- 클라이언트 정보
  client.name as client_name,
  client.email as client_email,
  client.profile_image_url as client_image,
  -- 전문가 정보
  expert.name as expert_name,
  expert.email as expert_email,
  expert.profile_image_url as expert_image
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN users client ON c.client_id = client.id
JOIN users expert ON c.expert_id = expert.id;

-- ===========================
-- 6. 제안서 수락 시 계약 자동 생성 함수
-- ===========================

CREATE OR REPLACE FUNCTION create_contract_on_proposal_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
  v_project projects%ROWTYPE;
  v_expert expert_profiles%ROWTYPE;
  v_proposal proposals%ROWTYPE;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 프로젝트 정보 가져오기
    SELECT * INTO v_project FROM projects WHERE id = NEW.project_id;
    -- 전문가 프로필 정보 가져오기
    SELECT * INTO v_expert FROM expert_profiles WHERE id = NEW.expert_id;
    -- 제안서 정보
    SELECT * INTO v_proposal FROM proposals WHERE id = NEW.id;

    -- 계약 생성
    INSERT INTO contracts (
      project_id,
      client_id,
      expert_id,
      agreed_amount,
      platform_fee_rate,
      status,
      proposal_id,
      deadline
    ) VALUES (
      NEW.project_id,
      v_project.client_id,
      v_expert.user_id,
      NEW.proposed_rate,
      0.10, -- 10% 플랫폼 수수료
      'pending_payment',
      NEW.id,
      v_project.deadline
    );

    -- 프로젝트 상태 업데이트
    UPDATE projects SET status = 'in_progress' WHERE id = NEW.project_id;

    -- 다른 pending 제안서들 자동 거절
    UPDATE proposals
    SET status = 'rejected'
    WHERE project_id = NEW.project_id
      AND id != NEW.id
      AND status = 'pending';

    -- 전문가에게 알림 발송
    INSERT INTO notifications (user_id, type, title, content, link, related_id)
    VALUES (
      v_expert.user_id,
      'proposal_accepted',
      '제안서가 수락되었습니다',
      v_project.title || ' 프로젝트의 제안서가 수락되었습니다. 결제를 기다려주세요.',
      '/contracts',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$body$;

-- 트리거 생성 (있으면 재생성)
DROP TRIGGER IF EXISTS on_proposal_accepted ON proposals;
CREATE TRIGGER on_proposal_accepted
  AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION create_contract_on_proposal_accept();

-- ===========================
-- 7. 계약 상태 변경 알림 함수
-- ===========================

CREATE OR REPLACE FUNCTION notify_contract_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
  v_project projects%ROWTYPE;
  v_client users%ROWTYPE;
  v_expert users%ROWTYPE;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = NEW.project_id;
  SELECT * INTO v_client FROM users WHERE id = NEW.client_id;
  SELECT * INTO v_expert FROM users WHERE id = NEW.expert_id;

  -- 결제 완료 시
  IF NEW.status = 'in_progress' AND OLD.status = 'pending_payment' THEN
    INSERT INTO notifications (user_id, type, title, content, link, related_id)
    VALUES (
      NEW.expert_id,
      'project_update',
      '결제가 완료되었습니다',
      v_project.title || ' 프로젝트의 결제가 완료되었습니다. 작업을 시작해주세요.',
      '/contracts/' || NEW.id,
      NEW.id
    );
  END IF;

  -- 완료 요청 시
  IF NEW.status = 'pending_approval' AND OLD.status = 'in_progress' THEN
    INSERT INTO notifications (user_id, type, title, content, link, related_id)
    VALUES (
      NEW.client_id,
      'project_update',
      '완료 승인 요청',
      v_expert.name || '님이 ' || v_project.title || ' 작업 완료를 요청했습니다.',
      '/contracts/' || NEW.id,
      NEW.id
    );
  END IF;

  -- 완료 승인 시
  IF NEW.status = 'completed' AND OLD.status = 'pending_approval' THEN
    -- 전문가에게 알림
    INSERT INTO notifications (user_id, type, title, content, link, related_id)
    VALUES (
      NEW.expert_id,
      'project_update',
      '계약이 완료되었습니다',
      v_project.title || ' 프로젝트가 완료되었습니다. 정산이 진행됩니다.',
      '/contracts/' || NEW.id,
      NEW.id
    );

    -- 양측에게 리뷰 요청 알림
    INSERT INTO notifications (user_id, type, title, content, link, related_id)
    VALUES
    (
      NEW.client_id,
      'project_update',
      '리뷰를 작성해주세요',
      v_expert.name || '님과의 작업은 어떠셨나요? 리뷰를 남겨주세요.',
      '/contracts/' || NEW.id || '?review=true',
      NEW.id
    ),
    (
      NEW.expert_id,
      'project_update',
      '리뷰를 작성해주세요',
      v_client.name || '님과의 작업은 어떠셨나요? 리뷰를 남겨주세요.',
      '/contracts/' || NEW.id || '?review=true',
      NEW.id
    );

    -- 정산 트랜잭션 생성
    INSERT INTO transactions (contract_id, amount, type, status)
    VALUES
    (
      NEW.id,
      (NEW.agreed_amount * (1 - NEW.platform_fee_rate))::INTEGER,
      'release_to_expert',
      'completed'
    ),
    (
      NEW.id,
      (NEW.agreed_amount * NEW.platform_fee_rate)::INTEGER,
      'platform_fee',
      'completed'
    );

    -- 전문가 완료 프로젝트 수 증가
    UPDATE expert_profiles
    SET completed_projects = completed_projects + 1
    WHERE user_id = NEW.expert_id;

    -- 프로젝트 상태 완료로 변경
    UPDATE projects SET status = 'completed' WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$body$;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_contract_status_change ON contracts;
CREATE TRIGGER on_contract_status_change
  AFTER UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION notify_contract_status_change();

-- ===========================
-- 8. 계약 RLS 정책
-- ===========================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can create contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;

CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (client_id = auth.uid() OR expert_id = auth.uid());

CREATE POLICY "System can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (client_id = auth.uid() OR expert_id = auth.uid());

-- ===========================
-- 9. Realtime 발행 설정
-- ===========================

-- contracts 테이블 realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
