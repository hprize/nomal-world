-- ============================================================================
-- 로컬 전용 seed (supabase db reset / start 시 실행, 운영에는 push 되지 않음)
--
-- 스키마 자체는 마이그레이션(001~006)이 운영과 동일하게 재현한다.
-- 여기에는 "운영에는 없거나, 운영에서는 기본 제공되는" 로컬 전용 항목만 둔다.
--
--   1) Data API 롤 GRANT — 운영은 레거시 자동 노출로 이미 부여되어 있으나,
--      최신 CLI 로 만든 로컬 DB 는 부여되지 않아 API 요청이 42501 로 거부됨
--   2) 회원가입 시 profiles 자동 생성 트리거 — 운영에는 없음(자체 가입 기능이
--      없어 계정을 수동 생성). 로컬에서 테스트 계정을 만들기 위한 편의 장치
-- ============================================================================

-- ─── 1) Data API 롤 GRANT ───────────────────────────────────────────────────
-- 최신 CLI 기본값은 새 테이블을 API 롤에 자동 노출하지 않는다.
-- 실제 접근 제어는 각 테이블의 RLS 정책이 담당한다.
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- ─── 2) 회원가입 시 profiles 자동 생성 (로컬 전용) ──────────────────────────
-- gatherings.host_id 가 profiles(id) 를 참조하므로, 로그인한 호스트에게
-- profiles 행이 반드시 있어야 모임을 만들 수 있다.
-- 운영에는 이 트리거가 없다(계정/프로필을 수동 생성) — 로컬 테스트 편의용.
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

-- ─── 참고: 로컬 테스트 계정 ─────────────────────────────────────────────────
-- 로컬은 이메일 확인(enable_confirmations)이 꺼져 있어 Studio 나 Auth API 로
-- 계정을 만들면 위 트리거가 profiles 행을 자동 생성한다.
-- 어드민 권한이 필요하면 가입 후 승격:
--   update public.profiles set role = 'admin' where email = '<your-email>';
