# CLAUDE.md

이 문서는 이 저장소에서 작업하는 Claude Code(claude.ai/code)를 위한 안내서입니다.

## 프로젝트 개요

**NomalWorld** — 오프라인 모임(소셜/스터디/취미 등)을 소개하고 신청받는 서비스입니다.
호스트가 모임을 만들어 공개하면, 일반 사용자가 둘러보고 구글폼으로 신청합니다.
어드민은 전체 콘텐츠와 사용자, 통계, 헤더 버튼 등을 관리합니다.

**pnpm + Turborepo 모노레포**이며, Next.js 14 앱 3개와 공유 패키지 3개로 구성됩니다.
백엔드는 **Supabase**(Postgres + Auth + Storage)를 사용합니다.

## 명령어

```bash
# 의존성 설치
pnpm install

# 전체 앱 개발 모드 (Turborepo)
pnpm dev

# 개별 앱 실행
pnpm --filter @nomal-world/user dev    # 포트 3000 (일반 사용자)
pnpm --filter @nomal-world/host dev    # 포트 3001 (호스트)
pnpm --filter @nomal-world/admin dev   # 포트 3002 (어드민)

# 빌드
pnpm build
pnpm --filter @nomal-world/host build  # 개별 앱 빌드

# 린트
pnpm lint

# 타입체크 (개별 앱)
pnpm --filter @nomal-world/host exec tsc --noEmit -p tsconfig.json
```

> 테스트는 아직 구성되어 있지 않습니다. 변경 검증은 **타입체크 + 프로덕션 빌드**로 합니다.
> `next lint`는 host 앱에 ESLint가 초기 설정되지 않아 대화형 프롬프트가 뜹니다(기존 상태).

## 환경 변수

각 Next 앱은 **자기 디렉토리(`apps/user`, `apps/host`, `apps/admin`)의 env 파일**을 읽습니다.
로컬/운영을 **NODE_ENV 기준으로 자동 분리**합니다(수동 전환 불필요):

| 파일 | 로드 시점 | 내용 |
|------|-----------|------|
| `apps/<app>/.env.development.local` | `next dev` (development) | 로컬 Supabase (`127.0.0.1:54331`) |
| `apps/<app>/.env.production.local`  | `next build` / 배포 (production) | 운영 Supabase |

세 변수 모두 필요: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

- 루트 `.env.example`은 필요한 변수의 참고 템플릿(비밀값 없음, 유일하게 커밋되는 env 파일)
- `turbo.json`의 `globalEnv`가 세 변수를 캐시 키로 선언
- 모든 `.env*` 실값 파일은 `.gitignore`로 보호 — 절대 커밋 금지
- Vercel 배포는 파일이 아니라 대시보드 env를 사용
- 로컬 값은 `cd packages/db && supabase status`로 확인

## 아키텍처

### 앱

| 앱 | 포트 | 대상 | 인증 |
|-----|------|------|------|
| `apps/user` | 3000 | 모임을 둘러보는 일반 사용자 | 없음 (공개) |
| `apps/host` | 3001 | 모임을 만들고 수정하는 호스트 | 필요 (로그인한 사용자) |
| `apps/admin` | 3002 | 전체 콘텐츠를 관리하는 어드민 | 필요 (role = 'admin') |

모든 앱은 `next.config.js`에서 `transpilePackages: ["@nomal-world/ui", "@nomal-world/db"]`로
공유 패키지를 TypeScript 소스 그대로 소비합니다.

**주요 라우트**
- `user`: `/` (카테고리 필터 + 모임 그리드), `/gatherings/[id]` (상세, 신청 버튼, 조회수 트래킹)
- `host`: `/gatherings/new`, `/gatherings/[id]/edit`, `/login`, `/api/upload-image-by-url` (외부 이미지 프록시 업로드)
- `admin`: `/` `/gatherings` (전체 관리), `/gatherings/pinned` (고정 관리), `/users` (권한 관리), `/stats` (통계), `/header-buttons` (헤더 버튼 관리), `/login`

### 공유 패키지

**`packages/db`** — Supabase 클라이언트 팩토리 + TypeScript 타입.
- `@nomal-world/db/client` → `createClient()` : 브라우저용 (anon key)
- `@nomal-world/db/server` → `createServerClient()` : 서버 컴포넌트/미들웨어용 (`@supabase/ssr` 쿠키 처리)
- `@nomal-world/db/types` → DB 타입: `Gathering`, `Category`, `Profile`, `HeaderButton`, `GatheringEvent`, `GatheringWithCategory`, `EditorJSContent`
- `packages/db/supabase/` → **로컬 Supabase 프로젝트 루트** (config.toml, migrations/) — 아래 "로컬 Supabase" 참고

**`packages/ui`** — 전 앱에서 쓰는 공유 React 컴포넌트.
- 기본 컴포넌트: `Button`, `Card`, `Badge`, `Input`, `Textarea`
- 도메인 컴포넌트: `GatheringCard`, `GatheringDetail`, `ContentRenderer`, `Logo`
- 유틸: `cn()`, `formatCost()`, `formatDate()`

**`packages/config`** — 공유 Tailwind / TypeScript 베이스 설정.

### 데이터 모델

핵심 엔티티는 **Gathering(모임)** 이며 상태는 `draft | published | closed`입니다.
모임은 **Profile(host)** 에 속하고 선택적으로 **Category** 를 가집니다.
본문(content)은 Editor.js 블록을 JSON(`EditorJSContent`)으로 저장합니다.

주요 테이블 (실제 스키마 기준 — `packages/db/src/types.ts`가 최종 소스):
- `categories` — 카테고리 (초기 시드 8종)
- `profiles` — `auth.users` 연동 프로필, `role`: `host | admin`
- `gatherings` — 모임. 컬럼: 기본 정보 + `thumbnail_url`, `thumbnail_detail_url`(카드 4:3 / 상세 16:9), `recruitment_start`, `recruitment_end`, `is_pinned`, `pin_order`, `google_form_url`, `content`(jsonb)
- `gathering_events` — 통계 이벤트 (`view`, `apply_click`). 비로그인도 insert 가능, 조회는 admin만
- `header_buttons` — 어드민이 관리하는 헤더 커스텀 버튼

**RLS 정책 (요약)**
- 일반 사용자는 `published` 모임만 읽기 가능
- 호스트는 자기 모임만 CRUD
- 어드민은 전체 모임 CRUD + 전체 프로필 읽기
- 통계 이벤트는 누구나 기록, 조회는 어드민만

### 인증

Supabase Auth + `@supabase/ssr` 기반. 인증이 필요한 앱(`host`, `admin`)은 각각
`src/middleware.ts`를 두어, 미인증 사용자는 `/login`으로, 인증된 사용자는 `/login`에서
벗어나도록 리다이렉트합니다. `user` 앱은 미들웨어가 없고 공개 데이터만 읽습니다.

서버 액션(예: `apps/host/src/app/actions/gathering.ts`)에서 RLS 우회가 필요한 스토리지 삭제 등은
`SUPABASE_SERVICE_ROLE_KEY`로 만든 admin 클라이언트를 사용합니다.

### 콘텐츠 에디터 & 이미지 지연 업로드

`host` 앱은 모임 본문에 **Editor.js**(`@editorjs/*`)를 사용합니다.
`ContentEditor`는 브라우저 전용이라 `dynamic(..., { ssr: false })`로 로드하고,
렌더링은 `@nomal-world/ui`의 `ContentRenderer`가 담당합니다.

**이미지 지연 업로드(deferred upload) 아키텍처** — 이미지를 선택/붙여넣기하는 즉시
Supabase에 올리지 않고, **폼을 실제로 저장할 때** 한꺼번에 업로드합니다.
저장하지 않고 이탈한 이미지가 스토리지에 고아(orphan) 파일로 쌓이는 것을 방지하기 위함입니다.

- `content-editor.tsx` / `thumbnail-crop-section.tsx`는 `forwardRef`로
  `flushPendingUploads()`(업로드 실행 + 업로드 경로 반환)와 `commit()`(성공 확정 시 정리)을 노출
- 업로드 전에는 `blob:` URL과 `File`/`Blob`을 메모리(ref)에 보관
- 저장 흐름(`gathering-form.tsx`의 `handleSave`)은 **2단계**:
  1. **Phase 1 (upload)**: 두 컴포넌트의 `flushPendingUploads()`로 업로드, 경로 누적. 이때 pending은 정리하지 않음
  2. **Phase 2 (DB 저장)** 성공 시 `commit()`으로 정리, 실패 시 이번에 올린 파일을 전부 `remove()`로 롤백(pending은 보존 → 재시도 정상)
- 편집 모드 저장(`updateGathering`)은 DB 업데이트 **성공 후에만** 교체된 옛 이미지를 삭제하며,
  그 삭제는 best-effort(실패해도 throw하지 않음)로 처리해 커밋된 행이 깨진 이미지를 참조하지 않도록 합니다

### 스토리지

Supabase Storage 버킷 `gathering-images`가 썸네일과 본문 이미지를 보관합니다(public 버킷).
운영 환경에서는 대시보드에서 버킷과 스토리지 RLS 정책(authenticated INSERT/UPDATE/DELETE, public 읽기)을
관리합니다. 로컬은 `config.toml`의 `[storage.buckets.gathering-images]`로 버킷이 자동 생성되고,
스토리지 RLS 정책은 마이그레이션 `006`이 관리합니다(아래 "로컬 Supabase" 참고).
이미지는 `*.supabase.co`(로컬은 `127.0.0.1:54331`)의 public URL로 서빙됩니다.

### 통계

`@vercel/analytics`가 세 앱 레이아웃에 설치되어 있고, 서비스 자체 통계는
`gathering_events` 테이블(조회수 `view`, 신청 클릭 `apply_click`)로 수집해 어드민 `/stats`에서 봅니다.

## 로컬 Supabase 개발 환경 (Docker)

로컬에서 Supabase를 띄워 테스트합니다. **Docker 런타임이 필요**하며, 이 환경은 **Colima**를 사용합니다.

```bash
# 1) Docker(Colima) 데몬 시작
colima start

# 2) 로컬 Supabase 스택 기동 (packages/db 가 프로젝트 루트)
cd packages/db
supabase start        # 최초 1회는 이미지 다운로드로 수 분 소요
supabase status       # API URL / anon key / service_role key 확인

# 종료 / 초기화
supabase stop         # 컨테이너 정지
supabase db reset     # 마이그레이션 + seed.sql 재적용(로컬 DB 초기화)
```

**포트** — 다른 로컬 Supabase 프로젝트와 충돌을 피하려고 기본값(5432x)이 아닌 **5433x 대역**을 씁니다
(`packages/db/supabase/config.toml`):
- API: `54331` · DB: `54332` · Studio: `54333` · Mail(SMTP UI): `54334`
- Studio: http://127.0.0.1:54333

**Colima 주의점** — Vector(analytics 로깅) 컨테이너가 Colima에서 docker.sock 마운트에 실패하므로
`config.toml`에서 `[analytics] enabled = false`로 꺼 두었습니다.

**포트 대역** — 다른 로컬 Supabase 프로젝트(예: Hanteo)와 충돌하지 않도록 기본 5432x 대신 5433x를 씁니다.

**로컬 전용 `seed.sql`** — `supabase/seed.sql`은 `db reset` 시 실행되며(운영에 push 안 됨),
**스키마가 아니라 로컬에만 필요한 두 가지**만 담습니다:
- **Data API 롤 GRANT** — 운영은 레거시 자동 노출로 이미 부여돼 있으나, 최신 CLI로 만든
  로컬 DB는 부여되지 않아 API 요청이 `42501`로 거부됨
- **회원가입 시 profiles 자동 생성 트리거** — 운영에는 없음(앱에 자체 가입 기능이 없어
  계정을 수동 생성). 로컬에서 테스트 계정을 만들기 위한 편의 장치

스키마 자체(컬럼·테이블·정책·함수)는 **마이그레이션 001~006이 운영과 동일하게 재현**합니다.

**앱을 로컬 Supabase에 연결** — 별도 작업 없이 `pnpm --filter @nomal-world/host dev`를 실행하면
`next dev`가 `apps/host/.env.development.local`(로컬 값)을 자동으로 읽습니다. 운영 값은
`apps/<app>/.env.production.local`에 보존되어 있어 빌드/배포 시 사용됩니다.
`.env.development.local`의 로컬 값은 `cd packages/db && supabase status`로 확인·갱신하세요
(로컬 anon/service_role 키는 모든 로컬 Supabase에서 동일한 데모 키).

### 마이그레이션 & 스키마 드리프트

운영 DB는 오랫동안 대시보드에서 직접 수정돼 마이그레이션(001~005)보다 앞서 있었습니다.
**`006_sync_with_production.sql`이 그 차이를 코드로 옮겨 해소**했습니다:
- `gatherings.thumbnail_detail_url`, `recruitment_start`, `recruitment_end` 컬럼
- `header_buttons` 테이블 + 정책
- `is_admin()` 함수, 어드민 정책들을 이 함수 기반으로 교체
- `gatherings_delete_own` 정책
- `gathering-images` 스토리지 정책

**001의 알려진 함정** — `profiles_read_admin`이 자기 테이블(`profiles`)을 다시 조회해
`42P17 infinite recursion` 을 유발합니다. 006이 `is_admin()`(SECURITY DEFINER)로 교체해
재귀 고리를 끊습니다. 001을 직접 고치지 않는 이유는 이미 적용된 마이그레이션이기 때문입니다.

**스토리지 SELECT 정책이 필수인 이유** — `storage`의 `remove()`는 삭제 전에 대상 객체를
SELECT로 조회합니다. SELECT 정책이 없으면 조회가 0건이 되어 아무것도 지우지 못한 채
`200 + []`를 반환하고(조용한 무동작), 업로드 실패 시 롤백이 무력화됩니다.

> 운영에 마이그레이션 이력 테이블(`supabase_migrations.schema_migrations`)이 없어
> `db push`/`db pull`을 바로 쓸 수 없습니다. 사용하려면 먼저
> `supabase migration repair --status applied 001 … 006` 으로 이력을 맞춰야 합니다.
> 앞으로 스키마를 바꿀 때는 대시보드 직접 수정 대신 마이그레이션 파일로 관리하세요.

## 커밋 규칙

- 사용자가 요청할 때만 커밋/푸시합니다. 기본 브랜치에 있으면 먼저 브랜치를 만듭니다.
- 커밋 메시지는 한국어 관례를 따릅니다(예: `feat:`, `fix:` + 한국어 설명).
