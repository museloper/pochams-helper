# 로드맵

AI와 협업할 때 이 문서가 작업의 기준이 된다.
작업을 시작하면 해당 항목에 `(진행 중)`을 붙이고, 끝나면 체크한다.
새 아이디어는 우선 Backlog에 추가하고, 우선순위를 정한 뒤 Milestone으로 옮긴다.

## Milestone 1 — 기반

- [x] 프로젝트 초기 세팅 (Next.js 16 + TS + Tailwind v4 + Zustand + TanStack Query)
- [x] AI 협업 문서 체계 (AGENTS.md, ROADMAP, DECISIONS)
- [x] 데이터 소스 결정: 포켓몬 챔피언스 데이터를 어디서 가져올지 (→ DECISIONS.md에 기록)
- [x] 포켓몬 기본 데이터 타입 정의 (`src/lib/types.ts`)

## Milestone 2 — 핵심 기능

- [x] 스피드 계산기: 포켓몬·성격·노력치 → 최저속/준속/최속/구애스카프 기준 추월 못하는 상대 (`/speed`)
- [ ] 상성 계산기: 타입 입력 → 공/방 상성 배율 표시
- [x] 데미지 계산기: 공격 포켓몬·기술·노력치 + 방어 포켓몬·내구 → 데미지 % 범위·확정/난수 1타 (`/damage`)

## Milestone 3 — 검색 유입

- [x] 포켓몬별 정적 페이지 (`/pokemon/[slug]`) — SSG (종족값·타입·특성·기술·폼)
- [ ] 메타데이터·sitemap·OG 이미지 정비
- [ ] 배포 (GitHub Pages — 정적 추출 `output: export`, basePath `/pochams-helper`, Actions 워크플로)

## Backlog

- 팀 공유 URL (팀 구성을 링크로 공유)
- 다국어 지원 (영어)
- 자주 쓰는 팀 로컬 저장
