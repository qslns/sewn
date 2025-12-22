-- ===========================
-- Sewn 플랫폼 - 03. 함수 및 트리거
-- 실행 순서: 3번째 (02_indexes_rls.sql 실행 후)
-- ===========================

-- ===========================
-- 함수 1: updated_at 자동 업데이트
-- ===========================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $body$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$body$;

-- ===========================
-- 함수 2: 신규 사용자 처리
-- ===========================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
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
$body$;

-- ===========================
-- 함수 3: 전문가 평점 업데이트
-- ===========================

CREATE OR REPLACE FUNCTION update_expert_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $body$
DECLARE
  expert_user_id UUID;
  new_avg NUMERIC(3,2);
  new_count INTEGER;
BEGIN
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
$body$;

-- ===========================
-- 트리거: updated_at 자동 업데이트
-- ===========================

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expert_profiles_updated_at
  BEFORE UPDATE ON expert_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================
-- 트리거: 새 사용자 처리
-- ===========================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================
-- 트리거: 리뷰 평점 업데이트
-- ===========================

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_expert_rating();
