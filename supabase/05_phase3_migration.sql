-- ===========================
-- Sewn 플랫폼 - Phase 3 마이그레이션
-- 메시징 시스템 강화 및 알림 시스템
-- ===========================

-- 대화 테이블에 새 컬럼 추가
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS
  last_message_preview TEXT;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS
  unread_count JSONB DEFAULT '{}'::JSONB;
-- unread_count 형식: {"user_id1": 3, "user_id2": 0}

-- 메시지 테이블에 타입 컬럼 추가
ALTER TABLE messages ADD COLUMN IF NOT EXISTS
  message_type VARCHAR(20) DEFAULT 'text';
-- text, image, file

ALTER TABLE messages ADD COLUMN IF NOT EXISTS
  file_url TEXT;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS
  file_name VARCHAR(255);

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- message, proposal_received, proposal_accepted, proposal_rejected, project_update
  title VARCHAR(200) NOT NULL,
  content TEXT,
  link VARCHAR(500),
  related_id UUID, -- 관련 entity ID (conversation_id, proposal_id, project_id 등)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id)
  WHERE is_read = FALSE;

-- 대화 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_conversations_participants
  ON conversations USING GIN(participant_ids);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations(last_message_at DESC);

-- 메시지 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

-- ===========================
-- RLS 정책: 알림 테이블
-- ===========================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 수정 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 시스템이 알림 생성 (서비스 역할 또는 트리거 사용)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ===========================
-- 알림 생성 함수 (트리거용)
-- ===========================

-- 새 메시지 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_record RECORD;
  participant UUID;
  sender_name TEXT;
BEGIN
  -- 대화 정보 조회
  SELECT * INTO conv_record FROM conversations WHERE id = NEW.conversation_id;

  -- 발신자 이름 조회
  SELECT name INTO sender_name FROM users WHERE id = NEW.sender_id;

  -- 모든 참가자에게 알림 (발신자 제외)
  FOR participant IN SELECT jsonb_array_elements_text(conv_record.participant_ids)::UUID
  LOOP
    IF participant != NEW.sender_id THEN
      INSERT INTO notifications (user_id, type, title, content, link, related_id)
      VALUES (
        participant,
        'message',
        sender_name || '님이 메시지를 보냈습니다',
        LEFT(NEW.content, 100),
        '/messages/' || NEW.conversation_id,
        NEW.conversation_id
      );
    END IF;
  END LOOP;

  -- 대화의 마지막 메시지 업데이트
  UPDATE conversations
  SET
    last_message_at = NOW(),
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 메시지 트리거
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 새 제안서 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_new_proposal()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  expert_name TEXT;
BEGIN
  -- 프로젝트 정보 조회
  SELECT * INTO project_record FROM projects WHERE id = NEW.project_id;

  -- 전문가 이름 조회
  SELECT u.name INTO expert_name
  FROM expert_profiles ep
  JOIN users u ON u.id = ep.user_id
  WHERE ep.id = NEW.expert_id;

  -- 클라이언트에게 알림
  INSERT INTO notifications (user_id, type, title, content, link, related_id)
  VALUES (
    project_record.client_id,
    'proposal_received',
    '새 제안서가 도착했습니다',
    expert_name || '님이 "' || project_record.title || '" 프로젝트에 제안서를 보냈습니다.',
    '/projects/' || NEW.project_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 제안서 트리거
DROP TRIGGER IF EXISTS on_new_proposal ON proposals;
CREATE TRIGGER on_new_proposal
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_proposal();

-- 제안서 상태 변경 알림 함수
CREATE OR REPLACE FUNCTION notify_proposal_status_change()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  expert_user_id UUID;
  notification_type VARCHAR(50);
  notification_title VARCHAR(200);
  notification_content TEXT;
BEGIN
  -- 상태가 변경되었을 때만 실행
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 프로젝트 정보 조회
  SELECT * INTO project_record FROM projects WHERE id = NEW.project_id;

  -- 전문가 user_id 조회
  SELECT user_id INTO expert_user_id FROM expert_profiles WHERE id = NEW.expert_id;

  -- 상태에 따른 알림 내용 설정
  IF NEW.status = 'accepted' THEN
    notification_type := 'proposal_accepted';
    notification_title := '제안서가 수락되었습니다!';
    notification_content := '"' || project_record.title || '" 프로젝트의 제안서가 수락되었습니다.';
  ELSIF NEW.status = 'rejected' THEN
    notification_type := 'proposal_rejected';
    notification_title := '제안서가 거절되었습니다';
    notification_content := '"' || project_record.title || '" 프로젝트의 제안서가 거절되었습니다.';
  ELSE
    RETURN NEW;
  END IF;

  -- 전문가에게 알림
  INSERT INTO notifications (user_id, type, title, content, link, related_id)
  VALUES (
    expert_user_id,
    notification_type,
    notification_title,
    notification_content,
    '/projects/' || NEW.project_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 제안서 상태 변경 트리거
DROP TRIGGER IF EXISTS on_proposal_status_change ON proposals;
CREATE TRIGGER on_proposal_status_change
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_status_change();

-- ===========================
-- Realtime 활성화
-- ===========================

-- 메시지 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 알림 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 대화 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
