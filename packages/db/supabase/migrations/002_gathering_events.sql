-- Gathering Events: 조회수 및 신청 클릭 추적

CREATE TABLE gathering_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'apply_click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 통계 쿼리 성능을 위한 인덱스
CREATE INDEX idx_gathering_events_gathering_id ON gathering_events(gathering_id);
CREATE INDEX idx_gathering_events_type_date ON gathering_events(event_type, created_at);

ALTER TABLE gathering_events ENABLE ROW LEVEL SECURITY;

-- 비로그인 사용자도 이벤트 기록 가능 (gathering_id + event_type만 저장, 개인정보 없음)
CREATE POLICY "events_insert_public" ON gathering_events FOR INSERT WITH CHECK (true);

-- 관리자만 통계 조회 가능
CREATE POLICY "events_read_admin" ON gathering_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
