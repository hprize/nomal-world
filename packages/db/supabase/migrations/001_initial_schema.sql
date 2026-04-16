-- NomalWorld MVP Initial Schema

-- 카테고리
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 (Supabase Auth 연동)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'host' CHECK (role IN ('host', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 모임
CREATE TABLE gatherings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB,
  thumbnail_url TEXT,
  location TEXT,
  date TIMESTAMPTZ,
  capacity INT,
  cost INT DEFAULT 0,
  google_form_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 모임 이미지
CREATE TABLE gathering_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gatherings_status ON gatherings(status);
CREATE INDEX idx_gatherings_host_id ON gatherings(host_id);
CREATE INDEX idx_gatherings_category_id ON gatherings(category_id);
CREATE INDEX idx_gathering_images_gathering_id ON gathering_images(gathering_id);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_images ENABLE ROW LEVEL SECURITY;

-- Categories: 모든 사용자 읽기 가능
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Profiles: 자기 프로필 읽기/수정, admin은 전체 읽기
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "profiles_read_admin" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Gatherings: published는 모든 사용자 읽기, host는 자기 모임 CRUD, admin은 전체 CRUD
CREATE POLICY "gatherings_read_published" ON gatherings FOR SELECT
  USING (status = 'published');
CREATE POLICY "gatherings_read_own" ON gatherings FOR SELECT
  USING (host_id = auth.uid());
CREATE POLICY "gatherings_read_admin" ON gatherings FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "gatherings_insert_host" ON gatherings FOR INSERT
  WITH CHECK (host_id = auth.uid());
CREATE POLICY "gatherings_update_own" ON gatherings FOR UPDATE
  USING (host_id = auth.uid());
CREATE POLICY "gatherings_update_admin" ON gatherings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "gatherings_delete_admin" ON gatherings FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Gathering Images: 모임과 동일한 정책
CREATE POLICY "gathering_images_read" ON gathering_images FOR SELECT USING (true);
CREATE POLICY "gathering_images_insert" ON gathering_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM gatherings WHERE id = gathering_id AND host_id = auth.uid()));
CREATE POLICY "gathering_images_delete" ON gathering_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM gatherings WHERE id = gathering_id AND host_id = auth.uid()));

-- Seed categories
INSERT INTO categories (name, slug) VALUES
  ('아웃도어', 'outdoor'),
  ('문화·예술', 'culture'),
  ('맛집·카페', 'food'),
  ('운동·스포츠', 'sports'),
  ('스터디', 'study'),
  ('취미', 'hobby'),
  ('소셜', 'social'),
  ('여행', 'travel');

-- Storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gathering-images', 'gathering-images', true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gatherings_updated_at
  BEFORE UPDATE ON gatherings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
