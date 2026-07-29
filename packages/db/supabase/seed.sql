-- ============================================================================
-- 로컬 전용 seed (supabase db reset / start 시 실행, 운영에는 push 되지 않음)
--
-- 목적: 운영 대시보드에만 존재해 마이그레이션에 없는 항목을 로컬에 재현.
--   1) gathering-images 스토리지 RLS 정책 (authenticated 업로드/수정/삭제)
--   2) 회원가입 시 profiles 자동 생성 트리거
--   3) 마이그레이션에 누락된 public 스키마(gatherings 컬럼, header_buttons)
-- 이것들이 없으면 로컬에서 이미지 업로드/모임 생성 테스트가 불가능합니다.
--
-- ※ 운영 DB에서 `supabase db pull` 로 스키마를 정식 동기화하면 3)은 마이그레이션이
--   대신하게 되며, 여기 IF NOT EXISTS 구문은 무해한 no-op 이 됩니다.
-- ============================================================================

-- ─── 1) 스토리지 RLS 정책 (gathering-images) ───────────────────────────────
-- 버킷은 public=true 라 읽기는 public URL 로 처리되므로 SELECT 정책은 불필요.
-- (운영도 migration 005에서 공개 읽기 정책을 제거함 — 동일하게 맞춤)
-- authenticated 역할에 INSERT/UPDATE/DELETE 허용.

drop policy if exists "gathering-images 인증 업로드" on storage.objects;
create policy "gathering-images 인증 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gathering-images');

drop policy if exists "gathering-images 인증 수정" on storage.objects;
create policy "gathering-images 인증 수정" on storage.objects
  for update to authenticated
  using (bucket_id = 'gathering-images')
  with check (bucket_id = 'gathering-images');

drop policy if exists "gathering-images 인증 삭제" on storage.objects;
create policy "gathering-images 인증 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gathering-images');

-- authenticated SELECT 정책 필수:
-- storage의 remove()는 대상 객체를 먼저 SELECT로 조회한 뒤 삭제하므로,
-- 이 정책이 없으면 remove()가 조회 0건 → 아무것도 못 지우고 HTTP 200 + [] 를 반환(조용한 no-op).
-- 그 결과 앱의 실패-롤백(remove)이 무력화되어 고아 파일이 남게 됨.
-- (공개 읽기는 public 버킷 public URL 로 처리되므로 anon SELECT 정책은 두지 않음)
drop policy if exists "gathering-images 인증 조회" on storage.objects;
create policy "gathering-images 인증 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'gathering-images');

-- ─── 2) 회원가입 시 profiles 자동 생성 트리거 ──────────────────────────────
-- gatherings.host_id 는 profiles(id) 를 FK 로 참조하므로, 로그인한 호스트에게
-- profiles 행이 반드시 있어야 모임을 만들 수 있음.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'name', ''),
    'host'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2-1) profiles RLS 무한재귀 수정 ──────────────────────────────────────
-- migration 001의 "profiles_read_admin" 정책이 자기 테이블(profiles)을 다시 조회해
-- "infinite recursion detected in policy for relation profiles" (42P17)를 유발함.
-- (gatherings/events의 admin 정책이 profiles를 조회할 때도 이 재귀에 걸려 저장/조회가 실패)
-- SECURITY DEFINER 함수로 role 조회를 RLS 밖에서 수행해 재귀 고리를 끊는다(표준 패턴).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 재귀를 일으키던 admin 정책들을 is_admin() 기반으로 재정의
drop policy if exists "profiles_read_admin" on public.profiles;
create policy "profiles_read_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "gatherings_read_admin" on public.gatherings;
create policy "gatherings_read_admin" on public.gatherings
  for select using (public.is_admin());

drop policy if exists "gatherings_update_admin" on public.gatherings;
create policy "gatherings_update_admin" on public.gatherings
  for update using (public.is_admin());

drop policy if exists "gatherings_delete_admin" on public.gatherings;
create policy "gatherings_delete_admin" on public.gatherings
  for delete using (public.is_admin());

drop policy if exists "events_read_admin" on public.gathering_events;
create policy "events_read_admin" on public.gathering_events
  for select using (public.is_admin());

-- ─── 3) 마이그레이션에 누락된 public 스키마 ────────────────────────────────
-- gatherings 추가 컬럼 (카드/상세 썸네일 분리, 모집 기간)
alter table public.gatherings
  add column if not exists thumbnail_detail_url text,
  add column if not exists recruitment_start timestamptz,
  add column if not exists recruitment_end timestamptz;

-- header_buttons: 어드민이 관리하는 헤더 커스텀 버튼
create table if not exists public.header_buttons (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  url text not null,
  color text not null default '#000000',
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.header_buttons enable row level security;

-- 읽기: 누구나 / 쓰기: 어드민만
drop policy if exists "header_buttons_read" on public.header_buttons;
create policy "header_buttons_read" on public.header_buttons
  for select using (true);

drop policy if exists "header_buttons_admin_write" on public.header_buttons;
create policy "header_buttons_admin_write" on public.header_buttons
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 4) Data API 롤 GRANT ─────────────────────────────────────────────────
-- 최신 CLI 기본값은 새 테이블을 API 롤에 자동 노출하지 않음(권한 없으면 42501).
-- 운영 DB는 레거시(자동 노출) 동작이므로 로컬도 동일하게 public 스키마 전체에 GRANT.
-- 실제 접근 제어는 각 테이블의 RLS 정책이 담당함.
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- ─── 참고: 테스트 계정 ──────────────────────────────────────────────────────
-- 로컬 이메일 확인(enable_confirmations)이 꺼져 있으므로, host 앱 /login 에서
-- 바로 회원가입하면 위 트리거가 profiles 행을 자동 생성합니다.
-- 어드민 권한이 필요하면 가입 후 아래로 승격하세요:
--   update public.profiles set role = 'admin' where email = '<your-email>';
