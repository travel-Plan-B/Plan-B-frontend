# 프론트엔드 폴더 구조 가이드

## 1. 목적과 결론

이 프로젝트는 Next.js App Router의 라우팅 규칙을 유지하면서, 여행 일정 복구라는 도메인을 기능 단위로 나누는 **실용적인 Feature-based Architecture**를 사용한다. FSD(Feature-Sliced Design)의 단방향 의존성과 기능 응집도는 가져오되, `entities`, `widgets`, `processes` 같은 레이어를 처음부터 도입하지 않는다.

핵심 원칙은 다음 세 문장으로 요약할 수 있다.

- `app`은 URL, 레이아웃, 로딩/오류 경계와 같은 **Next.js 전용 진입점**이다.
- `features`는 사용자가 수행하는 여행 관련 기능의 **UI와 비즈니스 로직**을 함께 둔다.
- `shared`는 여행, 복구, 추천 중 어느 도메인도 모르는 **공통 기반 코드**다.

구조의 목적은 폴더 수를 늘리는 것이 아니라, FE 2명이 `recovery`, `recommendation`처럼 기능 단위로 나누어 작업하고 변경 영향 범위를 쉽게 파악하는 데 있다.

## 2. 현재 저장소 분석

작성 시점의 저장소는 `create-next-app`으로 만든 초기 스캐폴드에 가깝다.

- Next.js `16.3.0`, React/React DOM `19.2.8`, TypeScript 5를 사용한다.
- Tailwind CSS v4와 `@tailwindcss/postcss`를 사용하며 `app/globals.css`에서 `@import "tailwindcss"`로 불러온다.
- 패키지 매니저는 pnpm 10이다.
- `clsx`, `tailwind-merge`는 설치되어 있어 추후 공통 class 조합 유틸리티를 만들 수 있다.
- Zustand, TanStack Query, React Hook Form, Zod는 아직 설치되어 있지 않다.
- 소스는 현재 루트 `app/`에 있고 `src/`는 없다. `app/page.tsx`와 `app/layout.tsx`도 기본 예제 수준이므로 기존 도메인 구조와 충돌할 코드가 없다.
- TypeScript는 `strict: true`, `moduleResolution: "bundler"`다.
- 현재 `@/*` alias는 프로젝트 루트(`./*`)를 가리킨다. `src/`로 이동할 때 `@/*: ["./src/*"]`로 함께 변경해야 문서의 import 예시와 일치한다.
- ESLint는 Next.js Core Web Vitals와 TypeScript 구성을 사용하고, Prettier 및 Tailwind class 정렬 플러그인이 준비되어 있다.

따라서 기능 개발을 시작하기 전이나 첫 기능을 추가할 때 `app/`을 `src/app/`으로 옮기고 `src/features`, `src/shared`를 도입하기 좋은 상태다. 다만 이 문서는 구조 가이드만 제시하며 실제 소스 이동이나 설정 변경은 수행하지 않는다.

## 3. 최종 추천 구조

아래는 프로젝트가 주요 기능을 갖췄을 때의 **목표 예시**다. 지금 이 트리를 전부 만들라는 뜻이 아니다. 파일이 처음 필요해지는 순간 해당 폴더를 만든다.

```text
planb/
├─ public/
│  └─ images/                       # 빌드 과정 없이 제공할 정적 파일
├─ src/
│  ├─ app/                          # URL과 Next.js 렌더링 경계
│  │  ├─ (public)/                  # URL에 포함되지 않는 route group
│  │  │  ├─ page.tsx                # 홈
│  │  │  └─ login/
│  │  │     └─ page.tsx
│  │  ├─ (service)/
│  │  │  ├─ layout.tsx              # 서비스 공통 헤더/내비게이션 조합
│  │  │  ├─ trips/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [tripId]/
│  │  │  │     ├─ page.tsx
│  │  │  │     ├─ loading.tsx
│  │  │  │     └─ error.tsx
│  │  │  ├─ recovery/
│  │  │  │  └─ page.tsx
│  │  │  └─ recommendations/
│  │  │     └─ page.tsx
│  │  ├─ api/                       # BFF/웹훅이 실제 필요할 때만 route.ts 추가
│  │  ├─ layout.tsx
│  │  ├─ providers.tsx              # 전역 Client Provider가 생길 때만 생성
│  │  ├─ globals.css
│  │  ├─ error.tsx
│  │  ├─ not-found.tsx
│  │  └─ favicon.ico
│  ├─ features/
│  │  ├─ trip/
│  │  │  ├─ components/
│  │  │  │  ├─ TripCard.tsx
│  │  │  │  ├─ TripList.tsx
│  │  │  │  └─ TripForm.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useTripForm.ts
│  │  │  ├─ api/
│  │  │  │  ├─ getTrips.ts
│  │  │  │  └─ createTrip.ts
│  │  │  ├─ schemas/
│  │  │  │  └─ tripSchema.ts
│  │  │  ├─ types/
│  │  │  │  └─ trip.ts
│  │  │  └─ index.ts
│  │  ├─ recovery/
│  │  │  ├─ components/
│  │  │  │  ├─ RecoveryForm.tsx
│  │  │  │  └─ RecoveryResult.tsx
│  │  │  ├─ hooks/
│  │  │  ├─ api/
│  │  │  ├─ schemas/
│  │  │  ├─ types/
│  │  │  └─ index.ts
│  │  └─ recommendation/
│  │     ├─ components/
│  │     ├─ hooks/
│  │     ├─ api/
│  │     ├─ types/
│  │     └─ index.ts
│  └─ shared/
│     ├─ components/
│     │  ├─ ui/                     # Button, Input, Modal 등 원자적 공통 UI
│     │  └─ layout/                 # Header 등 도메인 비의존 레이아웃 UI
│     ├─ hooks/                     # useMediaQuery 등 도메인 비의존 hook
│     ├─ lib/
│     │  ├─ api/                    # HTTP client, 공통 오류 처리
│     │  ├─ query/                  # QueryClient factory/options
│     │  └─ cn.ts                   # clsx + tailwind-merge
│     ├─ constants/                 # 공통 상수
│     ├─ types/                     # ApiResponse 등 정말 공통인 타입
│     └─ styles/                    # globals 외 공유 스타일이 필요할 때
├─ docs/
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

`auth`가 단순 로그인 화면을 넘어 인증 요청, 세션 UI, 폼 검증을 가지면 `features/auth`로 둔다. 반면 `(public)`, `(service)`는 비즈니스 기능이 아니라 URL을 바꾸지 않고 레이아웃을 묶는 route group이다. 즉 `app/recovery`와 `features/recovery`의 이름이 같아도 중복이 아니다. 전자는 `/recovery`의 진입점이고 후자는 복구 기능의 구현이다.

## 4. 최상위 폴더의 책임

### `src/app`

`app`은 Next.js App Router가 해석하는 파일과 라우트 조립만 담당한다.

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`
- 동적 세그먼트(`[tripId]`), route group(`(service)`), metadata
- route parameter와 query string을 읽어 feature에 전달
- 페이지 수준 권한 확인, redirect, 서버 데이터 prefetch처럼 라우트 진입에 종속된 작업
- 여러 feature와 shared layout을 조합한 화면 구성

`app` 폴더가 기능 구현의 두 번째 보관소가 되어서는 안 된다. 특정 route에서만 사용하는 아주 작은 조립 컴포넌트는 가까이 둘 수 있지만, 복구 규칙이나 여행 폼 로직처럼 독립적으로 설명할 수 있는 기능은 `features`로 보낸다.

App Router에서는 폴더가 route segment를 표현하지만 `page.tsx` 또는 `route.ts`가 있어야 공개 route가 된다. 그래도 이 프로젝트에서는 찾기 쉬운 일관성을 위해 feature 구현을 route 아래에 대량으로 colocate하지 않는다.

### `src/features`

`features`는 특정 사용자 목적 또는 도메인 변경 이유를 중심으로 묶는다.

- 여행 생성·조회·수정: `trip`
- 일정 장애 상황 입력과 복구안 생성: `recovery`
- 대체 장소나 일정 추천: `recommendation`
- 해당 기능에만 쓰이는 component, hook, API 함수, schema, type, store

하위 폴더는 고정 체크리스트가 아니다. `TripCard.tsx` 하나만 있다면 `features/trip/components/TripCard.tsx`만 만들면 된다. API나 store가 없는데 빈 `api/`, `store/`를 미리 만들지 않는다.

기능 이름은 화면 이름보다 비즈니스 개념을 우선한다. `main`, `detail`, `step1`보다는 `trip`, `recovery`, `recommendation`이 변경 이유와 담당 범위를 더 잘 드러낸다.

### `src/shared`

`shared`는 특정 여행 도메인 없이도 이름과 동작을 설명할 수 있는 코드다.

- 디자인 시스템 성격의 Button, Input, Modal, Spinner
- HTTP client, 날짜 표시 도구, class name 결합 함수
- 브라우저/React 동작에 관한 범용 hook
- 공통 API 응답, pagination처럼 여러 feature가 실제로 공유하는 타입

`shared`는 편의상 아무 코드나 모으는 장소가 아니다. `shared/utils`, `shared/types`가 거대한 잡동사니 파일이 되지 않도록 파일 이름이 책임을 드러내게 한다. 예를 들어 `utils.ts` 대신 `formatDate.ts`, `types.ts` 대신 `apiResponse.ts`를 쓴다.

## 5. 배치 판단 기준

새 코드를 추가할 때 다음 순서로 판단한다.

1. Next.js가 정한 route/렌더링 파일이거나 URL 진입점에만 의미가 있는가? 그러면 `app`이다.
2. 여행, 복구, 추천 같은 특정 도메인 용어가 이름·props·동작에 들어가는가? 그러면 해당 `features/<feature>`다.
3. 두 개 이상의 feature에서 **현재 실제로** 사용하며, 도메인 지식 없이 독립적으로 설명할 수 있는가? 그러면 `shared` 후보이다.
4. 아직 한 feature에서만 사용한다면 재사용 가능성이 보여도 먼저 feature 안에 둔다. 두 번째 실제 사용처가 생기고 인터페이스가 안정됐을 때 shared로 이동한다.

빠른 판단 예시는 다음과 같다.

| 코드                         | 위치                                           | 이유                                         |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `/trips/[tripId]`의 metadata | `app/(service)/trips/[tripId]`                 | route 전용 Next.js 관심사                    |
| `RecoveryForm`               | `features/recovery/components`                 | 복구 입력이라는 도메인 기능                  |
| `useRecoveryMutation`        | `features/recovery/hooks`                      | 복구 API와 query key에 종속                  |
| `TripStatusBadge`            | `features/trip/components`                     | 여행 상태 모델을 알아야 함                   |
| `Button`                     | `shared/components/ui`                         | 도메인을 모르는 UI primitive                 |
| `formatDate`                 | 우선 사용하는 feature, 실제 공통화 후 `shared` | 형식과 timezone 요구가 기능마다 다를 수 있음 |
| `fetchClient`                | `shared/lib/api`                               | 모든 feature가 쓰는 전송 기반                |

## 6. 공통 컴포넌트와 feature 전용 컴포넌트

공통 컴포넌트는 다음 조건을 대체로 만족해야 한다.

- 이름에 `Trip`, `Recovery`, `Recommendation` 같은 도메인 단어가 없다.
- 도메인 모델을 import하지 않는다.
- 데이터 요청이나 업무 규칙을 직접 알지 않는다.
- props가 표현과 일반 상호작용 중심이다.
- 최소 두 곳에서 실제로 쓰이거나, Button처럼 디자인 시스템의 명백한 기본 요소다.

예를 들어 `Modal`은 열림 상태, 제목, children, 닫기 이벤트만 알면 shared다. `RecoveryConfirmModal`은 복구안, 선택된 일정, 복구 API 요청을 안다면 `features/recovery`에 둔다. 내부에서 shared의 `Modal`을 조합할 수 있다.

`TripCard`의 모양이 다른 카드와 비슷하다는 이유만으로 shared로 옮기지 않는다. UI 유사성보다 **도메인 의존성**과 **변경 이유**가 구분 기준이다. 실제 중복이 생기면 `Card`의 시각적 껍데기만 shared로 추출하고 `TripCard`는 feature에 남긴다.

## 7. `page.tsx` 작성 범위

`page.tsx`는 기본적으로 Server Component로 유지하고 얇은 조립 계층으로 사용한다. 권장 책임은 다음과 같다.

- `params`, `searchParams` 해석
- route에 필요한 인증/redirect/notFound 처리
- 서버에서 할 초기 데이터 조회 또는 prefetch
- feature 컴포넌트에 직렬화 가능한 props 전달
- metadata와 페이지 단위 레이아웃 조합

JSX 줄 수를 기계적으로 제한하지는 않는다. 다만 다음 중 하나가 보이면 feature로 추출할 시점이다.

- 여러 개의 `useState`, `useEffect`, event handler 때문에 페이지 전체가 Client Component가 된다.
- 폼 검증, API 상태 변환, 일정 복구 계산 같은 비즈니스 로직이 있다.
- 하나의 화면 영역이 독립적인 이름과 책임을 가진다.
- 테스트하고 싶은 로직이 route 파일 안에 묻혀 있다.

권장 예시는 다음과 같다.

```tsx
// src/app/(service)/recovery/page.tsx
import { RecoveryPage } from "@/features/recovery";

export const metadata = { title: "일정 복구" };

export default function Page() {
  return <RecoveryPage />;
}
```

동적 route에서는 Next.js 16의 `params`와 `searchParams`가 Promise라는 점을 반영한다.

```tsx
// src/app/(service)/trips/[tripId]/page.tsx
import { TripDetail } from "@/features/trip";

export default async function Page(props: PageProps<"/trips/[tripId]">) {
  const { tripId } = await props.params;
  return <TripDetail tripId={tripId} />;
}
```

페이지 자체에 `'use client'`를 붙이기보다는 상호작용이 필요한 feature 컴포넌트에서 Client 경계를 시작한다. 이렇게 해야 정적/서버 렌더링 범위를 넓게 유지하고 클라이언트 번들을 줄일 수 있다. Provider도 `app/providers.tsx` 같은 작은 Client Component로 만들고 root layout에서는 필요한 subtree만 감싼다.

## 8. hooks, types, schema, API의 위치

### Hooks

- `useTripForm`, `useRecoveryMutation`: `features/<feature>/hooks`
- `useMediaQuery`, `useOutsideClick`: 여러 기능에서 실제 공유할 때 `shared/hooks`
- 특정 컴포넌트 내부에서만 쓰는 짧은 hook: 컴포넌트 파일 가까이에 두거나 같은 feature의 `hooks`에 둔다.

React hook이 아닌 순수 계산은 `use` 접두사를 쓰지 않는다. 복구 가능 여부 계산은 `getRecoveryOptions.ts`처럼 feature 내부의 `lib/` 또는 해당 로직 파일로 둔다.

### Types

- 특정 API/화면/도메인의 타입: `features/<feature>/types`
- 한 파일에서만 쓰는 props와 내부 타입: 사용하는 파일에 colocate
- `ApiResponse<T>`, `Pagination`처럼 검증된 공통 타입: `shared/types`
- DB/백엔드 응답 타입과 UI 모델이 다르면 이름으로 구분한다. 예: `TripResponse`, `Trip`, `TripFormValues`

모든 타입을 하나의 `types/index.ts`에 모으지 않는다. schema에서 타입을 도출할 수 있으면 중복 선언 대신 `z.infer`를 사용한다.

### Schemas

- 여행 생성 폼/API 검증: `features/trip/schemas/tripSchema.ts`
- 일정 복구 입력 검증: `features/recovery/schemas/recoverySchema.ts`
- 여러 feature가 쓰는 범용 환경 변수나 pagination schema가 실제로 생길 때만 `shared`에 둔다.

폼 schema와 API schema의 규칙이 다르면 억지로 하나로 합치지 않고 `tripFormSchema.ts`, `tripResponseSchema.ts`처럼 목적을 구분한다.

### API

- base URL, 공통 header, 오류 변환, 공통 fetch wrapper: `shared/lib/api`
- endpoint, request/response mapping, query option: `features/<feature>/api`
- 외부 백엔드 호출을 위한 클라이언트 함수와 Next.js `route.ts`를 혼동하지 않는다. `app/api/**/route.ts`는 브라우저에 공개되는 HTTP endpoint/BFF가 실제 필요한 경우에만 사용한다.
- 서버 비밀값을 읽는 모듈은 Client Component로 import하지 않는다. 필요하면 `server-only` 표시를 사용해 경계를 강제한다.

`api/index.ts` 하나에 모든 요청을 넣기보다 `getTrips.ts`, `createRecovery.ts`처럼 요청 단위 파일을 우선한다. 파일이 매우 작고 함께 변하는 요청이 2~3개뿐이면 `tripApi.ts` 한 파일로 시작해도 된다.

## 9. 라이브러리 도입 시 권장 위치

현재 이 라이브러리들은 설치되어 있지 않으므로 아래 폴더도 미리 만들지 않는다.

### Zustand

- 특정 기능의 클라이언트 상태: `features/<feature>/store/useRecoveryStore.ts`
- 앱 전체 UI 상태가 정말 필요한 경우: `shared/store`를 고려하되 theme, modal 같은 범용 상태에 한정
- 서버에서 받은 데이터는 기본적으로 Zustand에 복제하지 않고 TanStack Query 또는 Server Component의 책임으로 둔다.

여러 단계 복구 폼 상태가 URL이나 React Hook Form만으로 충분하면 store를 추가하지 않는다.

### TanStack Query

- QueryClient 생성과 provider: `shared/lib/query/queryClient.ts`, `src/app/providers.tsx`
- feature query key/options/hook: `features/trip/api/tripQueries.ts` 또는 `features/trip/hooks/useTripsQuery.ts`
- 전역 provider는 `app/layout.tsx`에서 조합하되 provider 구현 자체는 작은 Client Component로 격리한다.

팀 내에서는 query key를 feature가 소유하도록 정한다. 예: `tripKeys.detail(tripId)`. 모든 feature의 key를 전역 파일 하나에 모으지 않는다.

### React Hook Form

- form component와 해당 form hook: `features/<feature>/components`, `features/<feature>/hooks`
- 입력 UI 자체는 `shared/components/ui/Input.tsx`
- 여러 form에서 반복되는 RHF adapter가 실제 생길 때만 `shared/components/form`을 만든다.

### Zod

- 도메인/form/API schema: `features/<feature>/schemas`
- schema에서 `z.infer`로 관련 타입 도출
- 공통 schema 조각은 두 feature 이상에서 동일한 의미와 규칙으로 쓰일 때만 `shared`

## 10. Barrel export (`index.ts`) 기준

barrel export는 **feature의 공개 API를 표현하는 경계**에서만 제한적으로 사용한다.

```ts
// src/features/recovery/index.ts
export { RecoveryPage } from "./components/RecoveryPage";
export type { RecoveryRequest } from "./types/recovery";
```

외부에서는 공개 진입점을 사용한다.

```ts
import { RecoveryPage } from "@/features/recovery";
```

권장 규칙은 다음과 같다.

- `features/<feature>/index.ts`에는 외부에서 사용하도록 의도한 최소 항목만 export한다.
- feature 내부 코드는 자기 `index.ts`를 거치지 않고 상대 경로로 직접 import해 순환 의존성을 피한다.
- 모든 하위 폴더마다 기계적으로 `index.ts`를 만들지 않는다.
- `shared` 전체를 하나의 거대한 barrel로 만들지 않는다. `@/shared/components/ui/Button`, `@/shared/lib/cn`처럼 구체 경로를 허용한다.
- side effect가 있는 모듈, server/client 전용 모듈을 같은 barrel에 섞지 않는다. Client 경계가 예상보다 넓어지거나 서버 코드가 노출될 수 있다.

작은 feature가 파일 하나뿐이면 barrel 없이 직접 import해도 된다. 공개 API가 안정되거나 내부 파일을 숨길 가치가 생겼을 때 추가한다.

## 11. Naming convention

| 대상            | 규칙                               | 예시                                 |
| --------------- | ---------------------------------- | ------------------------------------ |
| route 폴더      | `kebab-case`, URL은 복수 명사 선호 | `trips/[tripId]`, `recommendations`  |
| route group     | 소문자 `kebab-case`                | `(public)`, `(service)`              |
| feature 폴더    | 단수형 `kebab-case` 도메인명       | `trip`, `recovery`, `recommendation` |
| React component | 파일/식별자 `PascalCase`           | `TripCard.tsx`                       |
| hook            | `use` + `PascalCase`               | `useTripForm.ts`                     |
| 일반 함수/모듈  | `camelCase`                        | `formatDate.ts`, `getTrips.ts`       |
| schema          | 대상 + `Schema`                    | `recoveryFormSchema.ts`              |
| type/interface  | `PascalCase`                       | `RecoveryRequest`                    |
| 상수            | 값은 `UPPER_SNAKE_CASE`            | `MAX_TRIP_DAYS`                      |
| 테스트          | 대상 파일 옆 `*.test.ts(x)`        | `TripCard.test.tsx`                  |

컴포넌트 폴더를 매번 `TripCard/TripCard.tsx`로 중첩하지 않는다. 스타일, 테스트, 하위 컴포넌트 등 관련 파일이 여러 개 생겼을 때만 컴포넌트 전용 폴더로 승격한다.

`ITrip`, `TTrip` 같은 타입 접두사는 사용하지 않는다. `common.ts`, `helper.ts`, `utils.ts`, `data.ts`처럼 책임이 드러나지 않는 이름도 피한다.

## 12. Import dependency 규칙

의존성은 아래 방향으로만 흐른다.

```text
app  ───────▶ features ───────▶ shared
 │                                ▲
 └────────────────────────────────┘
```

- `app`은 `features`, `shared`를 import할 수 있다.
- `features`는 `shared`를 import할 수 있다.
- `shared`는 `features`나 `app`을 import하지 않는다.
- `features`끼리 직접 import하는 것은 원칙적으로 피한다.
- `features`와 `shared`는 route 파일인 `app`을 import하지 않는다.

feature 간 협력이 필요할 때는 먼저 페이지에서 조합하고 props로 연결한다. 예를 들어 추천 결과로 여행을 수정한다면 `app`의 페이지 조립 컴포넌트가 두 feature의 공개 API를 연결할 수 있다. 두 feature가 같은 도메인 타입을 반복해서 필요로 한다고 바로 shared로 내리지 말고, 실제로 하나의 기능 경계가 맞는지 먼저 검토한다.

`recommendation`이 `trip` 모델을 필수로 사용하고 함께 변경되는 일이 계속된다면 선택지는 다음 순서로 검토한다.

1. 페이지에서 필요한 데이터만 props로 전달한다.
2. 양쪽이 공유하는 최소의 도메인 중립 계약만 shared로 추출한다.
3. 두 기능의 경계가 인위적이라면 하나의 상위 feature로 합친다.
4. 프로젝트가 충분히 커진 뒤에만 별도의 domain/entity 레이어 도입을 고려한다.

같은 feature 내부는 가까운 파일에 상대 경로를 사용해도 된다. feature 밖에서는 `@/features/...`, `@/shared/...` alias를 사용하면 이동과 검색이 쉽다. `src` 도입 시 `tsconfig.json`의 alias를 다음처럼 조정해야 한다.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

의존성 규칙이 팀에서 자주 깨지기 시작하면 그때 ESLint의 restricted import 규칙을 추가한다. 초기부터 복잡한 경계 도구를 도입할 필요는 없다.

## 13. 잘못된 구조와 올바른 구조

### 예시 A: 기술 종류만으로 전역 분리

잘못된 예:

```text
src/
├─ components/
│  ├─ TripCard.tsx
│  ├─ RecoveryForm.tsx
│  └─ RecommendationList.tsx
├─ hooks/
│  ├─ useTrip.ts
│  └─ useRecovery.ts
├─ api/
└─ types/
```

한 기능을 수정하려면 여러 최상위 폴더를 오가고 담당자 작업 범위가 겹친다.

올바른 예:

```text
src/features/
├─ trip/
│  ├─ components/TripCard.tsx
│  ├─ hooks/useTrips.ts
│  └─ api/getTrips.ts
└─ recovery/
   ├─ components/RecoveryForm.tsx
   └─ hooks/useRecovery.ts
```

### 예시 B: `page.tsx`에 기능 전체 구현

잘못된 예:

```tsx
// app/recovery/page.tsx
"use client";

export default function Page() {
  // 다수의 state, form validation, API 요청, 결과 변환
  // 수백 줄의 form JSX와 modal JSX
}
```

올바른 예:

```tsx
// app/recovery/page.tsx
import { RecoveryPage } from "@/features/recovery";

export default function Page() {
  return <RecoveryPage />;
}
```

Client state와 form 로직은 `features/recovery` 내부의 필요한 컴포넌트 경계에서만 시작한다.

### 예시 C: 성급한 shared 이동

잘못된 예:

```text
shared/
├─ components/TripCard.tsx
├─ hooks/useRecoveryForm.ts
└─ types/Trip.ts
```

이름부터 특정 도메인에 종속되며, shared가 사실상 여행 기능 저장소가 된다.

올바른 예:

```text
features/trip/components/TripCard.tsx
features/recovery/hooks/useRecoveryForm.ts
features/trip/types/trip.ts
shared/components/ui/Card.tsx       # 실제 공통 껍데기가 필요할 때만
```

### 예시 D: route와 feature를 같은 것으로 취급

잘못된 예:

```text
features/trips/[tripId]/page.tsx
features/recovery/loading.tsx
```

Next.js 특수 파일이 feature에 섞여 라우팅 책임이 불명확하다.

올바른 예:

```text
app/(service)/trips/[tripId]/page.tsx
app/(service)/recovery/loading.tsx
features/trip/components/TripDetail.tsx
features/recovery/components/RecoveryPage.tsx
```

## 14. 팀 작업 방식

FE 2명은 route 폴더보다 feature를 작업 단위로 삼는 것이 좋다. 예를 들어 한 명이 `trip`, 다른 한 명이 `recovery`를 맡고 `shared` 변경은 작은 단위로 합의한다. 공통 컴포넌트를 먼저 대량 설계하기보다 각 feature 구현 중 반복이 확인된 요소부터 추출한다.

PR에서는 다음을 확인한다.

- 새 파일의 변경 이유가 해당 feature와 일치하는가?
- shared가 도메인 타입이나 feature를 import하지 않는가?
- `page.tsx`가 기능 구현 대신 route 조립에 집중하는가?
- `'use client'` 경계가 필요한 컴포넌트까지로 제한됐는가?
- 빈 폴더, 의미 없는 wrapper, 한 번만 쓰는 과도한 abstraction이 추가되지 않았는가?
- 공개할 필요가 없는 feature 내부 구현이 barrel에서 export되지 않았는가?

이 구조를 면접에서 설명할 때는 “FSD를 완전 도입하기에는 팀과 규모가 작아 세 레이어만 선택했고, App Router의 URL 책임과 비즈니스 기능 책임을 분리해 병렬 개발과 변경 범위 파악을 쉽게 했다”고 요약할 수 있다.

## 15. 규모가 커질 때의 확장 방법

현재 구조를 유지한 채 다음 순서로 점진 확장한다.

### 1단계: feature 내부 세분화

파일이 늘어난 feature만 하위 기능으로 묶는다.

```text
features/trip/
├─ list/
├─ detail/
├─ editor/
└─ index.ts
```

모든 feature에 같은 하위 구조를 강제하지 않는다.

### 2단계: 큰 화면 조합 단위 도입

여러 feature를 조합한 UI가 여러 route에서 재사용되고 `app`이 복잡해지면 `widgets` 또는 `composites` 같은 레이어를 **하나만** 추가할 수 있다. 예를 들어 `TripRecoveryWorkspace`가 trip, recovery, recommendation을 조합하고 여러 페이지에서 재사용되는 경우다. 명확한 사용 사례 없이 FSD 명칭만 맞추기 위해 추가하지 않는다.

### 3단계: 안정된 핵심 도메인 분리

`Trip` 같은 핵심 모델과 표시 UI를 여러 feature가 광범위하게 공유하고 feature 간 import 우회가 반복될 때 `entities/trip` 도입을 검토한다. 이는 팀이 의존성 문제를 실제로 겪은 뒤의 선택이며 현재 단계의 기본안은 아니다.

### 4단계: 경계 자동화

인원이 늘거나 규칙 위반이 잦아지면 ESLint로 layer 간 import를 제한하고, feature별 public API 사용을 검사한다. 테스트도 feature 옆 colocated unit/component test를 기본으로 두고, route 흐름은 별도 E2E 테스트로 보완한다.

폴더 확장의 신호는 단순 파일 개수가 아니라 다음과 같은 반복되는 불편이다.

- 한 폴더에서 서로 무관한 변경 충돌이 잦다.
- feature 간 내부 파일 import가 반복된다.
- 하나의 feature 이름으로 책임을 설명하기 어렵다.
- 동일한 조합 UI 또는 도메인 모델이 여러 route/feature에서 안정적으로 반복된다.

## 16. 도입 순서

실제 개발에서는 다음 정도로 가볍게 시작한다.

1. 기존 `app`을 `src/app`으로 이동하고 alias를 `./src/*`로 조정한다.
2. 첫 기능에 필요한 `features/<feature>/components`만 만든다.
3. Button 등 즉시 필요한 공통 UI만 `shared/components/ui`에 만든다.
4. API, hook, schema가 생길 때 해당 feature 안에 폴더를 추가한다.
5. 두 번째 실제 사용처가 확인된 코드만 shared 후보로 리팩터링한다.
6. 전역 라이브러리는 문제와 사용 범위가 분명해질 때 도입한다.

이 방식이면 초기 속도를 해치지 않으면서도, 기능이 늘어날수록 자연스럽게 책임이 분리된다. 구조는 미래를 추측해 빈 칸을 만드는 설계도가 아니라 현재 코드의 변경 이유를 드러내는 지도여야 한다.
