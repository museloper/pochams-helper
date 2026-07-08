<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 포켓몬 챔피언스 헬퍼 (pochams-helper)

포켓몬 챔피언스 대전을 위한 도구 사이트. 팀 빌딩, 상성 계산, 데미지 계산 기능을 제공한다.
검색 유입(SEO)용 정적 페이지 + 북마크해서 쓰는 인터랙티브 계산기, 두 성격을 모두 가진다.

## Commands

- `npm run dev` — 개발 서버 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드 + 타입 체크 (변경 후 이걸로 검증)
- `npm run lint` — ESLint
- `npm run format` — Prettier 전체 포맷 (파일 수정 시 훅이 자동 실행하므로 보통 직접 돌릴 필요 없음)

테스트 러너는 아직 없다. 도입 시 이 문서를 갱신할 것.

자동 훅(.claude/settings.json):

- **파일 수정 후**: Prettier 포맷 → ESLint(`--fix`) → `.ts/.tsx`는 `tsc --noEmit` 타입 검사가 실행되어 포맷·린트·타입 오류가 즉시 피드백된다.
- **`.env*` 읽기**: `.env.example`/`.sample`/`.template` 외의 실제 env 파일은 읽기 전 확인(ask)을 거친다 — 시크릿이 컨텍스트에 노출되는 것을 막기 위함. 값은 런타임/MCP가 `process.env`로 받으므로 보통 파일을 직접 읽을 필요는 없다.
- **`.env*` 커밋**: `git add`/`git commit`에 env 파일이 섞이면 차단(deny)된다.
- **커밋 시크릿 스캔**: `git commit` 직전 staged diff에서 시크릿 패턴(`sk-…`, `AKIA…`, `ghp_…`, PEM 개인키)이 감지되면 확인(ask)을 거친다.
- **`tailwind.config` 생성 / `@config` 지시어**: 차단(deny). Tailwind v4는 CSS-first이므로 설정은 `globals.css`의 `@theme`에만 둔다 (Conventions 참고).
- **`rm -rf`**: 재귀 삭제 명령은 실행 전 확인(ask)을 거친다.

### 도입 예정 훅 (조건 충족 시 추가할 것)

아래는 아직 넣지 않았지만, 조건이 갖춰지면 `.claude/settings.json`에 추가하기로 한 훅이다. 해당 조건에 도달한 에이전트/기여자는 이 항목을 참고해 훅을 넣고, 넣은 뒤 이 목록에서 위 활성 목록으로 옮긴다.

- **테스트 자동 실행** — _조건: 테스트 러너(예: Vitest) 도입 시._ 상성/데미지 계산은 `src/lib/`의 순수 함수라 유닛 테스트에 적합하다. `src/lib/**` 수정 시 관련 테스트만 돌리는 PostToolUse 훅, 또는 세션 종료 시 전체 테스트 1회 도는 Stop 훅으로 넣는다.
- **최종 빌드 검증(Stop 훅)** — _조건: 프로젝트가 커져 "깨진 상태로 세션 종료"의 비용이 커질 때._ 세션 종료 시 `npm run build`를 1회 돌려 타입/빌드를 최종 검증한다. 매번 돌면 무거우므로 그전까지는 보류.

## Stack & Architecture

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4.

- `src/app/` — 라우트. 루트 레이아웃이 `providers.tsx`(TanStack Query, staleTime 1시간)로 전체를 감싼다. 페이지 제목은 layout.tsx의 title template(`%s | 포켓몬 챔피언스 헬퍼`)이 조합한다.
- `src/components/` — 공용 UI 컴포넌트
- `src/stores/` — Zustand 스토어 (클라이언트 상태: 팀 구성, 계산기 입력 등)
- `src/lib/` — 순수 로직·유틸 (상성/데미지 계산은 React 없는 순수 함수로 여기에 둔다)
- import는 `@/*` 별칭 사용 (`@/lib/...`, `@/components/...`)

렌더링 원칙: 검색 노출이 필요한 콘텐츠 페이지(포켓몬/기술 정보 등)는 서버 컴포넌트 + 정적 생성, 계산기·팀 빌더 같은 인터랙티브 부분만 클라이언트 컴포넌트로 분리한다.

- Tailwind v4는 설정 파일 없이 `src/app/globals.css`에서 CSS로 설정한다 (tailwind.config 만들지 말 것).

## Conventions

- UI 문구와 문서는 한국어, 코드(변수·함수·주석)는 영어.
- 기능 계획은 `docs/ROADMAP.md`, 기술 결정 기록은 `docs/DECISIONS.md`를 따른다. 과거 결정을 바꿀 때는 DECISIONS.md에 새 항목을 추가한다.
