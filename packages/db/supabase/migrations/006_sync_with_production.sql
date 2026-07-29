-- ============================================================================
-- 운영 DB와 마이그레이션 동기화
--
-- 001~005 이후 운영 DB에는 대시보드에서 직접 적용된 변경들이 쌓여 있었고,
-- 마이그레이션은 그보다 뒤처져 있었다(스키마 드리프트).
-- 이 마이그레이션은 운영의 실제 상태를 코드로 옮겨, 마이그레이션만으로
-- 운영과 동일한 스키마를 재현할 수 있게 한다.
--
-- 반영 내용
--   1) gatherings 누락 컬럼 3개
--   2) header_buttons 테이블 + RLS
--   3) is_admin() 함수
--   4) 어드민 정책을 is_admin() 기반으로 교체 (001의 무한재귀 수정)
--   5) 호스트의 자기 모임 삭제 정책
--   6) gathering-images 스토리지 정책
-- ============================================================================

-- ─── 1) gatherings 누락 컬럼 ────────────────────────────────────────────────
alter table public.gatherings
  add column if not exists thumbnail_detail_url text,   -- 상세용 16:9 썸네일
  add column if not exists recruitment_start timestamptz,
  add column if not exists recruitment_end timestamptz;

-- ─── 2) header_buttons: 어드민이 관리하는 헤더 커스텀 버튼 ──────────────────
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

-- ─── 3) is_admin(): 어드민 판별 ─────────────────────────────────────────────
-- SECURITY DEFINER 로 RLS 바깥에서 profiles 를 조회한다.
-- 001 의 어드민 정책들은 profiles 정책 안에서 다시 profiles 를 조회해
-- "infinite recursion detected in policy for relation profiles"(42P17) 를 유발했다.
-- 이 함수로 조회 경로를 RLS 밖으로 빼내 재귀 고리를 끊는다.
-- search_path 를 고정해 SECURITY DEFINER 함수의 권한 상승 벡터를 제거한다.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── 4) 어드민 정책을 is_admin() 기반으로 교체 ──────────────────────────────
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

-- header_buttons 정책
-- 읽기: 활성 버튼은 누구나(비로그인 포함) — user 사이트 헤더가 사용
drop policy if exists "Public can read active header buttons" on public.header_buttons;
create policy "Public can read active header buttons" on public.header_buttons
  for select using (is_active = true);

-- 쓰기: 어드민만. (실제 관리 요청은 admin 앱이 service_role 로 수행해 RLS 를 우회하므로
--       이 정책은 anon/authenticated 의 직접 호출을 막는 방어선 역할)
drop policy if exists "Admins can manage header buttons" on public.header_buttons;
drop policy if exists "header_buttons_admin_write" on public.header_buttons;
create policy "header_buttons_admin_write" on public.header_buttons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 5) 호스트의 자기 모임 삭제 ─────────────────────────────────────────────
drop policy if exists "gatherings_delete_own" on public.gatherings;
create policy "gatherings_delete_own" on public.gatherings
  for delete using (host_id = auth.uid());

-- ─── 6) gathering-images 스토리지 정책 ──────────────────────────────────────
-- 버킷은 public 이라 개별 파일 읽기는 public URL 로 처리된다.
-- SELECT 정책이 반드시 필요한 이유: storage 의 remove() 는 삭제 전에 대상 객체를
-- SELECT 로 조회한다. 이 정책이 없으면 remove() 가 0건을 조회해 아무것도 지우지
-- 못하고 200 + [] 를 반환하며(조용한 무동작), 업로드 실패 롤백이 무력화된다.
drop policy if exists "gathering-images 인증 조회" on storage.objects;
create policy "gathering-images 인증 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'gathering-images');

drop policy if exists "gathering-images 인증 업로드" on storage.objects;
create policy "gathering-images 인증 업로드" on storage.objects
  for insert
  with check (bucket_id = 'gathering-images' and auth.role() = 'authenticated');

drop policy if exists "gathering-images 인증 수정" on storage.objects;
create policy "gathering-images 인증 수정" on storage.objects
  for update
  using (bucket_id = 'gathering-images' and auth.role() = 'authenticated');

drop policy if exists "gathering-images 인증 삭제" on storage.objects;
create policy "gathering-images 인증 삭제" on storage.objects
  for delete
  using (bucket_id = 'gathering-images' and auth.role() = 'authenticated');
