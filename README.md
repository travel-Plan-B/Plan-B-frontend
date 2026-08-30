# PlanB

PlanB는 여행 중 계획이 틀어졌을 때 현재 상황과 이동 조건에 맞는 대체 일정을 추천하는 여행 일정 복구 서비스입니다.

**Production:** [https://planb-recovery.vercel.app/](https://planb-recovery.vercel.app/)

## 주요 기능

- 간편 복구: 하나의 일정 문제를 빠르게 대체
- 상세 복구: 여러 일정과 조건을 입력하고 선택한 일정을 재구성
- TourAPI·Kakao 기반 장소 검색 및 대체 장소 추천
- 장소 상세 정보와 Kakao 지도
- ODsay 대중교통 이동시간과 이동수단별 일정 계산
- 추천 결과 편집 및 최종 일정 확인
- 압축된 URL 기반 일정 공유와 일정 이미지 저장

## 기술 스택

| 구분         | 기술                                     |
| ------------ | ---------------------------------------- |
| Framework    | Next.js 16 App Router, React 19          |
| Language     | TypeScript                               |
| Styling      | Tailwind CSS 4, Pretendard               |
| State        | Zustand 5, TanStack Query 5              |
| API          | ky, MSW 2                                |
| External     | Kakao Maps JavaScript SDK, ODsay Web API |
| Testing      | Vitest, Playwright                       |
| Quality / CI | ESLint, Prettier, Husky, GitHub Actions  |
| Deployment   | Vercel                                   |

## 프로젝트 구조

```text
src/
├── app/          # App Router 진입점과 feature 조립
├── features/     # recovery, recommendation 등 기능별 UI·도메인 로직
├── mocks/        # MSW worker, handler, fixture
└── shared/       # 공통 UI, API client, query 설정, 유틸리티
```

기능 코드는 feature 단위로 응집하고, 특정 도메인에 의존하지 않는 코드만 `shared`에서 관리합니다. 자세한 기준은 [폴더 구조 가이드](./docs/architecture/folder-structure.md)를 참고하세요.

## 데이터와 상태 흐름

```text
PlanB Frontend → Backend API → TourAPI / Kakao 기반 장소 데이터
PlanB Frontend → ODsay Web API (브라우저 직접 호출)
PlanB Frontend → Kakao Maps JavaScript SDK
```

- 간편 복구 상태는 Zustand 메모리 상태로 관리하며 새 복구 시작 시 초기화합니다.
- 상세 복구 초안은 Zustand persist로 저장해 단계 이동과 새로고침을 지원합니다.
- 추천 조건이 변경되면 이전 추천 결과를 무효화합니다.
- 요청 도중 조건이 바뀐 경우 늦게 도착한 응답이 최신 상태를 덮지 않도록 방어합니다.
- 서버 데이터 조회와 캐시는 TanStack Query가 담당합니다.

## 로컬 실행

Node.js 22와 `packageManager`에 지정된 pnpm 10 사용을 권장합니다.

```bash
pnpm install
pnpm dev
```

루트의 `.env.example`을 참고해 `.env.local`을 구성해야 실제 Backend API, Kakao Maps, ODsay 연동을 사용할 수 있습니다. `NEXT_PUBLIC_API_MOCKING=true`로 설정하면 로컬 브라우저에서 MSW를 사용할 수 있습니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run
node --test scripts/lib/automation.test.mjs src/features/recovery/simple/simpleRecoveryForm.test.mjs
pnpm build
```

## 지원 환경과 MVP 범위

- 간편 복구는 모바일을 포함한 반응형 UI를 지원합니다.
- 상세 복구는 일정 편집에 필요한 화면 폭을 고려해 1024px 이상 PC 환경을 지원합니다.
- MVP에서는 로그인, 예약·결제, 실시간 교통 관제를 제공하지 않습니다.

## 문서

- [Git 협업 운영 가이드](./docs/conventions/git-workflow.md)
- [프론트엔드 폴더 구조 가이드](./docs/architecture/folder-structure.md)
- [디자인 시스템](./docs/design/design-system.md)
