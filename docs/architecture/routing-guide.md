# Plan-B 라우팅 가이드

## 기본 원칙

- Next.js App Router와 파일 시스템 기반 routing을 사용한다.
- `src/app`은 route entry와 Next.js 전용 파일을 담당한다.
- 실제 UI, 상태와 비즈니스 로직은 `src/features`에서 관리한다.
- `src/shared`는 공통 route 계약과 도메인에 의존하지 않는 공통 기능을 담당한다.
- Pages Router와 React Router를 추가하지 않는다.
- route group이나 별도 navigation wrapper는 실제 필요가 생기기 전까지 만들지 않는다.

## 현재 route

| URL                          | 역할                     | route entry                                  |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| `/`                          | 메인                     | `src/app/page.tsx`                           |
| `/recovery/simple`           | 간편 복구 시작(redirect) | `src/app/recovery/simple/page.tsx`           |
| `/recovery/simple/setup`     | 간편 복구 상황 설정      | `src/app/recovery/simple/setup/page.tsx`     |
| `/recovery/simple/info`      | 간편 복구 정보 입력      | `src/app/recovery/simple/info/page.tsx`      |
| `/recovery/simple/recommend` | 간편 복구 AI 추천        | `src/app/recovery/simple/recommend/page.tsx` |
| `/recovery/detail`           | 상세 복구                | `src/app/recovery/detail/page.tsx`           |

목록에 없는 URL은 전역 `src/app/not-found.tsx`에서 처리한다.

## URL 이름 규칙

- 기능 도메인이 드러나는 URL을 우선한다.
- `/detail`, `/result`처럼 의미가 모호한 top-level URL은 피한다.
- 복구 관련 화면은 `/recovery/*` 아래에서 확장한다.
- segment는 kebab-case를 사용한다.
- 실제 요구가 없는 미래 route를 미리 만들지 않는다.

## `app`과 `features`의 책임

`page.tsx`는 route 진입점과 Next.js에 의존하는 처리를 담당한다. `params`, `searchParams`, metadata, redirect, `notFound()` 처리와 feature 화면 조립이 여기에 해당한다.

실제 화면에 상태나 복구 규칙이 생기면 `features/recovery`로 분리한다.

```tsx
// src/app/recovery/simple/page.tsx
import { SimpleRecoveryPage } from "@/features/recovery/...";

export default function Page() {
  return <SimpleRecoveryPage />;
}
```

단순 placeholder나 조립할 로직이 없는 짧은 화면까지 무조건 feature page component로 분리하지 않는다. 빈 `pages`, `hooks`, `types` 등의 폴더도 미리 만들지 않는다.

## navigation 기준

- 일반적인 클릭 이동은 Next.js `<Link>`를 사용한다.
- 사용자 action 완료 후 이동은 `router.push`를 사용한다.
- 현재 history를 남기지 않아야 하는 이동은 `router.replace`를 사용한다.
- Server Component 또는 서버 로직의 조건부 이동은 `redirect`를 사용한다.
- 브라우저 이력 기반 이동은 `router.back`을 사용한다.
- 내부 공개 URL은 `ROUTES`를 사용한다.
- `RouteManager`, `navigate()`, `useAppRouter()` 같은 wrapper는 만들지 않는다.

## route 상수

공통 route 계약은 `src/shared/config/routes.ts`에서 관리한다.

```ts
export const ROUTES = {
  HOME: "/",
  RECOVERY_SIMPLE: "/recovery/simple",
  RECOVERY_SIMPLE_SETUP: "/recovery/simple/setup",
  RECOVERY_SIMPLE_INFO: "/recovery/simple/info",
  RECOVERY_SIMPLE_RECOMMEND: "/recovery/simple/recommend",
  RECOVERY_DETAIL: "/recovery/detail",
} as const;
```

다음 값은 `ROUTES`에 넣지 않는다.

- 외부 URL
- asset 경로
- API endpoint
- 아직 존재하지 않는 미래 route

dynamic route builder는 실제 `[id]` route가 생겼을 때 추가한다.

## 새 route 추가 순서

1. URL과 화면 역할을 결정한다.
2. `src/app`에 route segment와 `page.tsx`를 추가한다.
3. 화면 로직이 있다면 적절한 feature 화면을 연결한다.
4. 공개 내부 route를 `ROUTES`에 추가한다.
5. navigation에서 하드코딩 문자열 대신 `ROUTES`를 사용한다.
6. 직접 URL 접근과 새로고침을 확인한다.
7. 존재하지 않는 하위 경로가 404로 처리되는지 확인한다.
8. lint와 typecheck를 실행한다.

## 필요할 때 추가하는 App Router 기능

- `[id]`: 공유하거나 다시 접근할 수 있는 리소스 식별자가 생길 때
- `searchParams`: 필터, 정렬 등 URL에 유지해야 하는 선택 상태가 생길 때
- nested layout: 여러 하위 route가 동일한 route 전용 UI를 공유할 때
- route group: URL을 바꾸지 않고 서로 다른 layout 경계를 구성해야 할 때
- `loading.tsx`: 실제 비동기 route에서 체감 대기 시간이 생길 때
- `error.tsx`: route 단위로 복구 가능한 runtime 오류 경계가 필요할 때

parallel route와 intercepting route는 현재 프로젝트 규모에서 사용하지 않는다.
