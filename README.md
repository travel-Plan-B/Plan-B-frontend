# PlanB

PlanB는 여행 일정에 문제가 생겼을 때 대체 장소나 일정을 추천하는 여행 일정 복구 서비스입니다. 이 저장소는 Next.js App Router 기반의 프론트엔드 애플리케이션을 관리합니다.

## 기술 스택

| 구분            | 기술                                 |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 App Router, React 19      |
| Language        | TypeScript                           |
| Styling         | Tailwind CSS 4, Pretendard           |
| Server State    | TanStack Query 도입 예정             |
| Package Manager | pnpm 10                              |
| Code Quality    | ESLint, Prettier, Husky, lint-staged |
| Commit Check    | commitlint                           |
| CI              | GitHub Actions                       |

TanStack Query는 현재 dependency에 포함되어 있지 않으며, 백엔드 API 연동을 시작할 때 도입할 예정입니다.

## 시작하기

Node.js 22와 pnpm 10 사용을 권장합니다. 저장소의 `packageManager`에는 pnpm `10.30.2`가 지정되어 있습니다.

```bash
pnpm install
pnpm dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 주요 명령어

| 명령어            | 설명                                                     |
| ----------------- | -------------------------------------------------------- |
| `pnpm dev`        | 로컬 개발 서버를 실행합니다.                             |
| `pnpm build`      | 프로덕션 빌드를 생성합니다.                              |
| `pnpm start`      | 생성된 프로덕션 빌드를 실행합니다.                       |
| `pnpm lint`       | ESLint로 코드 품질을 검사합니다.                         |
| `pnpm typecheck`  | Next.js route type을 생성하고 TypeScript를 검사합니다.   |
| `pnpm commitlint` | 표준 입력 또는 옵션으로 전달한 커밋 메시지를 검사합니다. |
| `pnpm prepare`    | Git hook을 사용할 수 있도록 Husky를 설정합니다.          |

## 프로젝트 구조

현재 저장소는 필요한 폴더만 만드는 feature-based 구조를 사용합니다.

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── features/
│   └── README.md
└── shared/
    └── README.md
```

- `app`: route, layout, loading, error 등 Next.js 전용 진입점과 feature 조립을 담당합니다.
- `features`: `trip`, `recovery`, `recommendation`과 같은 도메인·기능 단위 UI와 비즈니스 로직을 둡니다. 필요한 기능이 생길 때 폴더를 추가합니다.
- `shared`: 특정 여행 도메인을 모르는 공통 UI, hook, API 기반 코드, 유틸리티와 타입을 둡니다.

구조를 확장할 때는 다음 원칙을 따릅니다.

- `features`끼리는 직접 참조하지 않고 `app`에서 조합합니다.
- 여러 곳에서 실제로 재사용되는 코드만 `shared`로 이동합니다.
- 기본적으로 Server Component를 우선합니다.
- `"use client"`는 상태, 이벤트, 브라우저 API가 필요한 컴포넌트에만 사용합니다.
- 필요하지 않은 하위 폴더를 미리 만들지 않습니다.

자세한 구조와 의존성 규칙은 [프론트엔드 폴더 구조 가이드](./docs/architecture/folder-structure.md)를 참고하세요.

## 브랜치 전략

```text
main
└── dev
    └── feat/*, fix/*, refactor/*, chore/*, docs/*, test/*
```

- `main`: 최종 배포용 브랜치입니다.
- `dev`: 개발 내용을 통합하는 브랜치입니다.
- 작업 브랜치는 최신 `dev`에서 생성합니다.
- 일반 작업 PR은 `dev`를 대상으로 생성합니다.
- `main`은 최종 배포 단계에서만 사용합니다.

작업 브랜치는 `<prefix>/<kebab-case-summary>` 형식을 사용하며, 필요하면 `<prefix>/<issue-number>-<summary>`로 Issue 번호를 포함합니다. 상세 협업 규칙은 [Git 협업 운영 가이드](./docs/conventions/git-workflow.md)를 참고하세요.

## 커밋 컨벤션

일반 작업 커밋은 다음 형식을 사용합니다.

```text
type: subject (#이슈번호)
```

허용 type은 다음과 같습니다.

```text
feat
fix
refactor
chore
docs
style
test
```

예시:

```text
feat: 여행 일정 입력 폼 추가 (#12)
fix: 추천 카드 이미지 비율 수정 (#24)
refactor: 장소 데이터 변환 로직 분리 (#31)
```

- type은 지정된 소문자 값만 사용합니다.
- type 뒤에 콜론과 공백(`: `)을 사용합니다.
- subject는 비워둘 수 없고 마지막에 마침표를 붙이지 않습니다.
- 숫자 이슈 번호 하나를 메시지 마지막에 `(#숫자)` 형식으로 작성합니다.
- Git이 자동 생성하는 merge/revert 커밋은 검사 대상에서 제외됩니다.
- Husky `commit-msg` hook에서 commitlint가 메시지를 자동으로 검사합니다.

자세한 예시와 운영 기준은 [Git 협업 운영 가이드](./docs/conventions/git-workflow.md)를 참고하세요.

## PR 규칙

- 작업 전에 GitHub Issue를 생성하고 범위와 완료 조건을 정리합니다.
- 최신 `dev`에서 작업 브랜치를 생성하고 PR 대상도 기본적으로 `dev`로 설정합니다.
- PR 본문에 변경 내용, 변경 이유, 검증 방법과 결과를 작성합니다.
- `Closes #12`, `Fixes #12`, `Refs #12` 등으로 관련 Issue를 연결합니다.
- PR 제목은 커밋과 같은 `type: subject (#이슈번호)` 형식을 사용합니다.
- CI 통과와 리뷰가 끝나면 기본적으로 Squash and merge합니다.

세부 리뷰 및 merge 기준은 [Git 협업 운영 가이드](./docs/conventions/git-workflow.md)를 참고하세요.

## 상태 관리 기준

### Server State

서버에서 관리되는 데이터는 TanStack Query로 관리할 예정입니다.

- 백엔드 Swagger 명세를 기준으로 API를 연결합니다.
- query key는 feature별 factory 형태로 관리합니다.
- 서버 데이터의 조회, 캐시와 동기화는 TanStack Query가 담당합니다.

TanStack Query와 공통 QueryClient 구성은 아직 구현되지 않았습니다.

### Client State

전역 상태 라이브러리를 기본 전제로 두지 않습니다. 현재는 로그인이나 장기간 유지해야 하는 사용자 상태보다 화면 간 정보 전달이 중심이므로 다음 방법을 우선 검토합니다.

- URL과 `searchParams`
- 컴포넌트 state
- 필요한 범위의 Context

여러 화면에서 복잡한 클라이언트 상태를 공유해야 하는 요구가 생기면 Zustand 도입을 검토합니다.

## API 연동

백엔드에서 제공하는 Swagger 명세를 기준으로 API를 연동합니다. 프론트엔드에서 별도의 API 서버나 BFF를 운영하지 않으며, 현재 공통 API client는 아직 구현되지 않았습니다.

API 코드가 생기면 도메인 전용 요청은 각 `features`에, HTTP client와 공통 오류 처리처럼 도메인을 모르는 기반 코드는 `shared/lib/api`에 둡니다.

## CI

GitHub Actions는 `dev`, `main` 대상 PR과 두 브랜치의 push에서 실행됩니다. 동일한 브랜치와 ref의 이전 실행이 남아 있으면 취소하고 최신 실행을 유지합니다.

현재 CI는 Node.js 22와 pnpm을 사용해 다음을 검사합니다.

1. `pnpm install --frozen-lockfile`로 lockfile 일관성 확인 및 dependency 설치
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build`

Prettier는 현재 CI의 별도 단계가 아닙니다. 로컬 commit 전에 Husky `pre-commit` hook과 lint-staged가 staged 파일을 포맷합니다.

## 상세 문서

- [Git 협업 운영 가이드](./docs/conventions/git-workflow.md)
- [프론트엔드 폴더 구조 가이드](./docs/architecture/folder-structure.md)
- [디자인 시스템](./docs/design/design-system.md)
- [Features 안내](./src/features/README.md)
- [Shared 안내](./src/shared/README.md)
