-- ===========================
-- Sewn 플랫폼 - 04. 뷰 및 함수
-- 실행 순서: 4번째 (01_tables.sql, 02_indexes_rls.sql, 03_functions_triggers.sql 이후)
-- ===========================

-- ===========================
-- 전문가 목록 뷰 (검색/필터링용)
-- ===========================
CREATE OR REPLACE VIEW expert_listing AS
SELECT
  u.id AS user_id,
  u.name,
  u.profile_image_url,
  u.is_verified,
  ep.id AS expert_profile_id,
  ep.bio,
  ep.categories,
  ep.skills,
  ep.experience_years,
  ep.location,
  ep.hourly_rate_min,
  ep.hourly_rate_max,
  ep.project_rate_min,
  ep.project_rate_max,
  ep.availability,
  ep.rating_avg,
  ep.review_count,
  ep.completed_projects,
  ep.created_at,
  -- 포트폴리오 썸네일 (첫 3개)
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'title', pi.title,
        'image_url', pi.image_urls->0
      )
    )
    FROM (
      SELECT id, title, image_urls
      FROM portfolio_items
      WHERE expert_id = ep.id
      ORDER BY created_at DESC
      LIMIT 3
    ) pi
  ) AS portfolio_preview
FROM users u
INNER JOIN expert_profiles ep ON u.id = ep.user_id
WHERE u.is_active = TRUE;

-- ===========================
-- 프로젝트 목록 뷰 (전문가용)
-- ===========================
CREATE OR REPLACE VIEW project_listing AS
SELECT
  p.id,
  p.title,
  p.description,
  p.categories,
  p.budget_min,
  p.budget_max,
  p.deadline,
  p.location,
  p.status,
  p.created_at,
  -- 클라이언트 정보
  u.id AS client_id,
  u.name AS client_name,
  u.profile_image_url AS client_image,
  -- 제안 수
  (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) AS proposal_count
FROM projects p
INNER JOIN users u ON p.client_id = u.id
WHERE p.status IN ('open', 'in_progress');

-- ===========================
-- 대화 목록 뷰 (메시징용)
-- ===========================
CREATE OR REPLACE VIEW conversation_listing AS
SELECT
  c.id,
  c.participant_ids,
  c.project_id,
  c.last_message_at,
  c.created_at,
  -- 마지막 메시지
  (
    SELECT jsonb_build_object(
      'content', m.content,
      'sender_id', m.sender_id,
      'created_at', m.created_at,
      'is_read', m.is_read
    )
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message,
  -- 읽지 않은 메시지 수 (현재 사용자 기준, 함수에서 처리)
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
    AND m.is_read = FALSE
    AND m.sender_id != auth.uid()
  ) AS unread_count,
  -- 프로젝트 정보
  (
    SELECT jsonb_build_object(
      'title', p.title,
      'status', p.status
    )
    FROM projects p
    WHERE p.id = c.project_id
  ) AS project_info
FROM conversations c;

-- ===========================
-- 대시보드 통계 함수 (클라이언트)
-- ===========================
CREATE OR REPLACE FUNCTION get_client_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  total_projects BIGINT,
  active_projects BIGINT,
  completed_projects BIGINT,
  total_spent BIGINT,
  pending_proposals BIGINT
) AS $body$
BEGIN
  RETURN QUERY
  SELECT
    -- 전체 프로젝트 수
    (SELECT COUNT(*) FROM projects WHERE client_id = p_user_id),
    -- 진행중 프로젝트
    (SELECT COUNT(*) FROM projects WHERE client_id = p_user_id AND status = 'in_progress'),
    -- 완료된 프로젝트
    (SELECT COUNT(*) FROM projects WHERE client_id = p_user_id AND status = 'completed'),
    -- 총 지출
    (
      SELECT COALESCE(SUM(agreed_amount), 0)
      FROM contracts
      WHERE client_id = p_user_id AND status = 'completed'
    ),
    -- 대기중인 제안
    (
      SELECT COUNT(*)
      FROM proposals prop
      INNER JOIN projects p ON prop.project_id = p.id
      WHERE p.client_id = p_user_id AND prop.status = 'pending'
    );
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 대시보드 통계 함수 (전문가)
-- ===========================
CREATE OR REPLACE FUNCTION get_expert_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  active_contracts BIGINT,
  completed_contracts BIGINT,
  total_earned BIGINT,
  pending_proposals BIGINT,
  rating_avg NUMERIC,
  review_count INTEGER
) AS $body$
DECLARE
  v_expert_id UUID;
BEGIN
  -- 전문가 프로필 ID 조회
  SELECT id INTO v_expert_id FROM expert_profiles WHERE user_id = p_user_id;

  IF v_expert_id IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC, 0::INTEGER;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    -- 진행중 계약
    (SELECT COUNT(*) FROM contracts WHERE expert_id = p_user_id AND status = 'in_progress'),
    -- 완료된 계약
    (SELECT COUNT(*) FROM contracts WHERE expert_id = p_user_id AND status = 'completed'),
    -- 총 수익
    (
      SELECT COALESCE(SUM(agreed_amount - (agreed_amount * platform_fee_rate)), 0)::BIGINT
      FROM contracts
      WHERE expert_id = p_user_id AND status = 'completed'
    ),
    -- 대기중인 제안
    (SELECT COUNT(*) FROM proposals WHERE expert_id = v_expert_id AND status = 'pending'),
    -- 평균 평점
    (SELECT ep.rating_avg FROM expert_profiles ep WHERE ep.id = v_expert_id),
    -- 리뷰 수
    (SELECT ep.review_count FROM expert_profiles ep WHERE ep.id = v_expert_id);
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 전문가 검색 함수
-- ===========================
CREATE OR REPLACE FUNCTION search_experts(
  p_query TEXT DEFAULT NULL,
  p_categories JSONB DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_min_rate INTEGER DEFAULT NULL,
  p_max_rate INTEGER DEFAULT NULL,
  p_availability availability_status DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  profile_image_url TEXT,
  is_verified BOOLEAN,
  expert_profile_id UUID,
  bio TEXT,
  categories JSONB,
  skills JSONB,
  experience_years INTEGER,
  location TEXT,
  hourly_rate_min INTEGER,
  hourly_rate_max INTEGER,
  availability availability_status,
  rating_avg NUMERIC,
  review_count INTEGER,
  completed_projects INTEGER,
  portfolio_preview JSONB
) AS $body$
BEGIN
  RETURN QUERY
  SELECT
    el.user_id,
    el.name,
    el.profile_image_url,
    el.is_verified,
    el.expert_profile_id,
    el.bio,
    el.categories,
    el.skills,
    el.experience_years,
    el.location,
    el.hourly_rate_min,
    el.hourly_rate_max,
    el.availability,
    el.rating_avg,
    el.review_count,
    el.completed_projects,
    el.portfolio_preview
  FROM expert_listing el
  WHERE
    -- 텍스트 검색
    (p_query IS NULL OR (
      el.name ILIKE '%' || p_query || '%' OR
      el.bio ILIKE '%' || p_query || '%' OR
      el.skills::TEXT ILIKE '%' || p_query || '%'
    ))
    -- 카테고리 필터
    AND (p_categories IS NULL OR el.categories ?| ARRAY(SELECT jsonb_array_elements_text(p_categories)))
    -- 위치 필터
    AND (p_location IS NULL OR el.location ILIKE '%' || p_location || '%')
    -- 요금 필터
    AND (p_min_rate IS NULL OR el.hourly_rate_min >= p_min_rate)
    AND (p_max_rate IS NULL OR el.hourly_rate_max <= p_max_rate)
    -- 가용성 필터
    AND (p_availability IS NULL OR el.availability = p_availability)
    -- 최소 평점 필터
    AND (p_min_rating IS NULL OR el.rating_avg >= p_min_rating)
  ORDER BY
    el.is_verified DESC,
    el.rating_avg DESC NULLS LAST,
    el.completed_projects DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 프로젝트 검색 함수
-- ===========================
CREATE OR REPLACE FUNCTION search_projects(
  p_query TEXT DEFAULT NULL,
  p_categories JSONB DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_min_budget INTEGER DEFAULT NULL,
  p_max_budget INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  categories JSONB,
  budget_min INTEGER,
  budget_max INTEGER,
  deadline DATE,
  location TEXT,
  status project_status,
  created_at TIMESTAMPTZ,
  client_id UUID,
  client_name TEXT,
  client_image TEXT,
  proposal_count BIGINT
) AS $body$
BEGIN
  RETURN QUERY
  SELECT
    pl.id,
    pl.title,
    pl.description,
    pl.categories,
    pl.budget_min,
    pl.budget_max,
    pl.deadline,
    pl.location,
    pl.status,
    pl.created_at,
    pl.client_id,
    pl.client_name,
    pl.client_image,
    pl.proposal_count
  FROM project_listing pl
  WHERE
    pl.status = 'open'
    -- 텍스트 검색
    AND (p_query IS NULL OR (
      pl.title ILIKE '%' || p_query || '%' OR
      pl.description ILIKE '%' || p_query || '%'
    ))
    -- 카테고리 필터
    AND (p_categories IS NULL OR pl.categories ?| ARRAY(SELECT jsonb_array_elements_text(p_categories)))
    -- 위치 필터
    AND (p_location IS NULL OR pl.location ILIKE '%' || p_location || '%')
    -- 예산 필터
    AND (p_min_budget IS NULL OR pl.budget_min >= p_min_budget)
    AND (p_max_budget IS NULL OR pl.budget_max <= p_max_budget)
  ORDER BY pl.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 메시지 읽음 처리 함수
-- ===========================
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID)
RETURNS VOID AS $body$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 실시간 메시지 알림용 함수
-- ===========================
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS BIGINT AS $body$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages m
    INNER JOIN conversations c ON m.conversation_id = c.id
    WHERE c.participant_ids ? p_user_id::TEXT
      AND m.sender_id != p_user_id
      AND m.is_read = FALSE
  );
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;
