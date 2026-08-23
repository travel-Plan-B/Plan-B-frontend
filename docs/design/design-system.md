# PlanB Design System

이 문서는 PlanB 프로젝트의 UI 퍼블리싱 기준 문서다. Figma 접근 권한이나 MCP 연결이 없어도 이 문서만 보고 동일한 기준으로 화면을 구현할 수 있도록 작성한다.

이 문서의 목적은 실제 페이지 UI를 대량 구현하는 것이 아니라, 페이지 개발 전에 전역 스타일, 디자인 토큰, 공통 UI 스타일 기준을 안정화하는 것이다.

## 0. Token Principles

디자인 토큰을 사용하는 이유는 페이지마다 직접 색상, radius, typography 값을 입력해 UI가 조금씩 달라지는 문제를 막기 위해서다.

- 컴포넌트에서는 HEX 값 대신 `primary-500`, `neutral-900`, `rose-600`처럼 역할이 드러나는 토큰 이름을 사용한다.
- Tailwind arbitrary value 예: `bg-[#00C0AB]`, `rounded-[13px]`는 사용하지 않는다.
- Tailwind 기본 scale과 프로젝트 토큰을 우선 사용한다. 예: `max-w-7xl`, `px-6`, `rounded-2xl`
- `max-w-[1280px]`, `h-[47px]`, `px-[23px]`처럼 임의 값을 직접 박는 방식은 사용하지 않는다.
- 새 토큰이 필요하면 기존 토큰으로 표현 가능한지 먼저 확인한다.
- 문서에 없는 색상, radius, typography 값은 임의로 만들지 않고 TODO 또는 확인 필요 항목으로 남긴다.

## 0.1 Spacing

색상·radius·타이포처럼 별도 커스텀 토큰을 만들지 않고 Tailwind 기본 spacing scale(4px 단위)을 그대로 사용한다. 대신 상황별로 어떤 단계를 쓸지는 아래 기준을 따른다 (Figma 실측 기준 가장 많이 쓰인 값).

| 상황                                |     값 | Tailwind         |
| ----------------------------------- | -----: | ---------------- |
| 아이콘-텍스트 등 아주 좁은 간격     |  `8px` | `gap-2`          |
| 카드/패널 내부 요소 간격            | `12px` | `gap-3`          |
| 카드/패널 내부 padding              | `16px` | `p-4`            |
| 페이지 좌우 여백, 폼 필드 사이 간격 | `24px` | `gap-6` / `px-6` |
| 컴포넌트 그룹 사이 간격             | `32px` | `gap-8`          |
| 섹션 사이 간격                      | `48px` | `gap-12`         |
| 큰 섹션(히어로 등) 사이 간격        | `64px` | `gap-16`         |

- 위 표에 없는 애매한 간격이 필요하면 가장 가까운 단계로 반올림해서 사용한다. `gap-5`, `gap-7`처럼 표에 없는 단계를 임의로 쓰지 않는다.

## 1. Layout

### Page Container

| 항목              |       값 |
| ----------------- | -------: |
| Content max width | `1200px` |
| Side padding      |   `24px` |
| Alignment         |   center |

- 콘텐츠는 화면 중앙에 배치한다.
- 좌우 기본 여백은 `24px`이다.
- 페이지 wrapper를 새로 만들기 전에 기존 Page/Layout 컴포넌트를 먼저 확인한다.
- 레이아웃은 반드시 Flex 또는 Grid로 구현한다. absolute positioning은 사용하지 않는다.
- Figma의 절대 좌표를 그대로 옮기지 않는다.

### Responsive

- 간편모드는 모바일까지 반응형을 지원한다.
- 디테일모드는 태블릿까지만 반응형을 지원한다. 모바일 전용 레이아웃은 만들지 않는다.
- 브레이크포인트는 Tailwind 기본 스케일을 그대로 사용한다: `md`(768px), `lg`(1024px). 커스텀 브레이크포인트를 임의로 추가하지 않는다.

| Breakpoint                     | Width              | 좌우 여백 |
| ------------------------------ | ------------------ | --------: |
| Desktop (`lg` 이상)            | `1024px` ~         |    `24px` |
| Tablet (`md` ~ `lg`)           | `768px` ~ `1023px` |    `12px` |
| Mobile (`md` 미만, 간편모드만) | `~767px`           |     `8px` |

- 폰트 크기는 clamp()가 아니라 브레이크포인트 기반으로 조정한다 (`text-2xl md:text-3xl`처럼). Type Scale에 없는 중간값을 clamp로 만들지 않는다.
- 모바일/태블릿에서는 Heading 계열만 한 단계 낮은 Type Scale로 축소한다 (예: Display → Heading 1, Heading 1 → Heading 2). Body 이하 크기는 고정한다.

## 2. Typography

PlanB는 기본 폰트로 `Pretendard`만 사용한다. Noto Sans KR 등 다른 폰트가 섞여 있는 화면은 실수이며 Pretendard로 통일한다.

폰트 크기는 홀수 없이 짝수 단위로만 사용하고, 최소 크기는 `8px`이다.

| Name           |   Size | Line Height | Usage                            |
| -------------- | -----: | ----------: | -------------------------------- |
| Display (Hero) | `38px` |      `50px` | 랜딩 히어로 타이틀 (마케팅 전용) |
| Heading 1      | `28px` |      `40px` | 섹션 대제목                      |
| Heading 2      | `24px` |      `32px` | 페이지 타이틀, 모드/카드 제목    |
| Heading 3      | `20px` |      `32px` | 폼 필드 라벨, 콘텐츠 제목        |
| Heading 4      | `18px` |      `28px` | 카드 제목                        |
| Body           | `16px` |      `24px` | 기본 본문, 버튼 라벨             |
| Body Small     | `14px` |      `20px` | 설명문, 서브타이틀, 보조 텍스트  |
| Caption        | `12px` |      `16px` | 뱃지, 예시 라벨, 작은 안내문     |
| Tiny           | `10px` |      `14px` | 작은 메타 정보                   |
| Micro          |  `8px` |      `12px` | 최소 단위 라벨 (타임스탬프 등)   |

- 화면마다 임의의 font-size를 새로 만들지 않는다. 홀수 크기(예: `15px`, `27px`)는 사용하지 않고 위 스케일 중 가장 가까운 값으로 맞춘다.
- 제목, 본문, 보조 텍스트는 위 Type Scale 안에서 선택한다.
- Display는 랜딩/마케팅 히어로 전용이며, 일반 앱 화면의 페이지 타이틀은 Heading 2를 사용한다.

### Text Color

- 기본 텍스트(제목, 본문)는 Neutral 900을 사용한다.
- 설명문·서브타이틀처럼 실제로 읽는 보조 텍스트는 Neutral 700을 사용한다. Neutral 600은 대비(3.5:1)가 낮아 일반 본문 크기에서는 WCAG AA 기준(4.5:1)을 통과하지 못한다.
- Neutral 600은 18px 이상 또는 bold처럼 WCAG 큰 텍스트 기준(3:1)이 적용되는 라벨·캡션에만 제한적으로 사용한다.
- Neutral 500은 placeholder, disabled 텍스트 전용이며 일반 텍스트에는 사용하지 않는다.
- `#6B7280`, `#64748B`, `#4B5563`, `#1E293B` 같은 Tailwind 기본 gray/slate 값을 임의로 쓰지 않고, 아래 매핑에 따라 Neutral 토큰으로 치환한다.

| 임의로 쓰인 색 | Tailwind 기본값             | 치환할 토큰             |
| -------------- | --------------------------- | ----------------------- |
| `#1E293B`      | slate-800                   | Neutral 900 (`#111318`) |
| `#181B24`      | 커스텀 near-black           | Neutral 900 (`#111318`) |
| `#64748B`      | slate-500                   | Neutral 700 (`#495057`) |
| `#6B7280`      | gray-500                    | Neutral 700 (`#495057`) |
| `#4B5563`      | gray-600                    | Neutral 700 (`#495057`) |
| `#E7EAF0`      | 커스텀 (Neutral 200과 유사) | Neutral 200 (`#E5E9F0`) |

## 2.1 Icon

- 아이콘은 [Lucide Icons](https://lucide.dev)를 기본으로 사용한다. 새 아이콘이 필요하면 Lucide에서 먼저 찾고, 없을 때만 커스텀 SVG를 추가한다.
- 아이콘 크기는 Typography와 맞춰 `16px` / `20px` / `24px` 중에서 선택한다. 임의 크기(`18px`, `22px` 등)를 쓰지 않는다.
- 아이콘 색상은 Color 팔레트 토큰을 따른다. 아이콘만을 위한 임의 HEX를 만들지 않는다.
- 예외: 날씨 아이콘은 [Meteocons](https://meteocons.com)(`@meteocons/svg`, `fill` 스타일)를 사용한다. Lucide로 대체하지 않는다.

## 3. Color

아래 컬러값은 PlanB의 확정 팔레트다. 임의로 변경하지 않는다.

Tailwind CSS v4에서는 `@theme`에 `--color-{name}-{scale}` 형식으로 등록해 사용한다.

### Primary

| Token       | HEX       | Usage             |
| ----------- | --------- | ----------------- |
| Primary 50  | `#E6FAF7` | 연한 primary 배경 |
| Primary 100 | `#DEF6F2` | 보조 primary 배경 |
| Primary 300 | `#80DFD3` | 약한 강조         |
| Primary 400 | `#00D6B9` | 강조 요소         |
| Primary 500 | `#00C0AB` | 브랜드 컬러, CTA  |
| Primary 600 | `#00B59B` | CTA hover         |
| Primary 700 | `#00907A` | active, 진한 강조 |

### Neutral

| Token       | HEX       | Usage                                                            |
| ----------- | --------- | ---------------------------------------------------------------- |
| Neutral 50  | `#F8F9FA` | 페이지 배경                                                      |
| Neutral 100 | `#F1F3F5` | 연한 구분 배경                                                   |
| Neutral 200 | `#E5E9F0` | border, divider                                                  |
| Neutral 400 | `#CED4DA` | input border                                                     |
| Neutral 500 | `#BDBDBD` | placeholder, disabled text 전용                                  |
| Neutral 600 | `#868E96` | 18px+ 또는 bold 라벨·캡션의 보조색 (본문 크기에는 사용하지 않음) |
| Neutral 700 | `#495057` | 설명문, 서브타이틀 등 실제로 읽는 보조 텍스트                    |
| Neutral 800 | `#343A40` | strong text                                                      |
| Neutral 900 | `#111318` | main text                                                        |

### Semantic

| Token      | HEX       |
| ---------- | --------- |
| Yellow 25  | `#FFFBF5` |
| Yellow 50  | `#FFF4E6` |
| Yellow 100 | `#FEEFD9` |
| Yellow 400 | `#FDBF02` |
| Yellow 500 | `#FFB020` |
| Yellow 600 | `#FDB118` |
| Yellow 700 | `#FD7E14` |
| Rose 25    | `#FFF8FA` |
| Rose 50    | `#FFEEF2` |
| Rose 100   | `#FEE9EE` |
| Rose 500   | `#FC608F` |
| Rose 600   | `#FF4D8D` |
| Rose 700   | `#FF4687` |
| Purple 25  | `#FAF9FF` |
| Purple 50  | `#F3F0FF` |
| Purple 100 | `#ECEEFD` |
| Purple 300 | `#A49AED` |
| Purple 400 | `#7C83FF` |
| Purple 500 | `#887EDB` |
| Purple 600 | `#8B5CF6` |
| Purple 700 | `#5825F1` |

### Danger

Rose는 브랜드 포인트 컬러/상태 표시(Chip, Badge)용이다. 삭제, 초기화, 일정 비우기처럼 **되돌릴 수 없는 파괴적 액션**에는 Rose 대신 아래 Danger 토큰을 사용한다.

| Token      | HEX       | Usage                           |
| ---------- | --------- | ------------------------------- |
| Danger 500 | `#E53E3E` | 삭제/초기화 등 파괴적 액션 기본 |
| Danger 600 | `#DC2626` | 파괴적 액션 hover               |

- Form Field의 유효성 검증 에러(4.1 참고)는 계속 Rose 계열을 사용한다. Danger는 사용자의 확정 액션(삭제, 초기화)에만 사용한다.

## 3.1 Hover

컴포넌트별로 hover 색상이 따로 명시되지 않은 경우, 아래 공통 규칙을 따른다.

- 배경/텍스트/보더에 팔레트 토큰(Primary, Neutral, Yellow, Rose, Purple, Danger)을 사용했다면, hover 시 같은 팔레트에서 **한 단계 진한 값**으로 전환한다. 예: `Primary 400` 사용 → hover `Primary 500`. `Neutral 200` border 사용 → hover `Neutral 400`.
- 각 팔레트의 단계 순서는 위 Color 표에 나열된 순서를 그대로 따른다 (중간에 없는 단계는 건너뛴다). 예: Primary는 `50 → 100 → 300 → 400 → 500 → 600 → 700` 순서다.
- 이미 팔레트의 가장 진한 단계(`700` 등)를 사용 중이면 hover에서 opacity를 살짝 낮추는 방식으로 대체한다.
- `transparent`/`White` 배경처럼 팔레트 단계가 없는 배경은 hover 시 `Neutral 50` 또는 `Neutral 100` 배경을 추가한다.

## 4. Radius

| Name             |    Value | Usage               |
| ---------------- | -------: | ------------------- |
| Input / Textarea |    `8px` | input, textarea     |
| Default          |   `12px` | 일반 UI 요소        |
| Button / Card    |   `16px` | button, card        |
| Full             | `9999px` | pill, badge, circle |

## 4.1 Border / Focus

| Name           | Value       | Usage                   |
| -------------- | ----------- | ----------------------- |
| Default border | Neutral 200 | 카드, 입력 필드, 구분선 |
| Strong border  | Neutral 400 | 강조가 필요한 입력 경계 |
| Focus border   | Primary 500 | focus 상태              |
| Error border   | Rose 500    | error 상태              |

- 기본 border width는 `1px`을 사용한다.
- interactive element는 focus 상태를 시각적으로 구분해야 한다.
- focus는 border 색상 변경을 우선 사용하고, 필요한 경우에만 focus ring을 추가한다.

## 4.2 Shadow

Shadow는 과하게 사용하지 않는다. 기본 UI는 border로 구분하고, 떠 있는 레이어나 강조 카드에만 제한적으로 사용한다.

- 일반 카드 목록에는 shadow를 최소화한다.
- Modal, dropdown, floating panel에는 약한 shadow를 사용할 수 있다.
- 새 shadow 값이 필요하면 임의로 만들지 않고 문서에 확인 필요 항목으로 남긴다.

## 5. Common Components

아래 UI는 새로 만들기 전에 반드시 기존 공통 컴포넌트를 먼저 확인한다.

- 공통 UI 컴포넌트는 `src/shared/components/ui`를 먼저 확인한다.

- Page Layout
- Step Flow
- Progress Stepper
- Button
- Tab Button
- Chip / Tag
- Card
- Form Field
- Input / Textarea
- Select / Dropdown
- Bottom Action Bar
- Modal
- Toast
- Map

### Step Flow

여러 단계로 사용자의 입력, 선택, 추천, 결과 확정을 진행하는 화면 패턴이다.

| Area              | Description                                     |
| ----------------- | ----------------------------------------------- |
| Header            | 로고 또는 뒤로가기, 화면 제목                   |
| Progress Stepper  | 현재 단계와 전체 진행 상태 표시                 |
| Step Title        | 현재 단계에서 사용자가 해야 할 일               |
| Step Content      | 카드, 폼, 지도, 추천 결과 등 단계별 콘텐츠      |
| Bottom Action Bar | 이전/다음/추천받기/확정하기 같은 단계 이동 액션 |

- 간편모드와 디테일모드는 모두 Step Flow 구조를 사용한다.
- 단계별 콘텐츠만 달라지고 전체 레이아웃은 새로 만들지 않는다.

### Progress Stepper

단계 진행 상태를 보여주는 공통 컴포넌트다.

- 구성: 원형 단계 표시, 숫자 또는 체크 아이콘, 단계 이름, 단계 사이 연결선
- 상태: 완료, 현재, 예정
- 단계 개수와 라벨은 모드에 따라 달라질 수 있다.

### Button

사용자의 주요 액션을 실행하는 공통 컴포넌트다. 버튼은 새로 스타일링하지 않고 공통 Button 컴포넌트를 우선 사용한다.

| Variant        | Background                     | Text                           | Border      | Usage                                                 |
| -------------- | ------------------------------ | ------------------------------ | ----------- | ----------------------------------------------------- |
| `default`      | Neutral 900                    | White                          | none        | 기본 주요 액션                                        |
| `secondary`    | Primary 500                    | White                          | none        | 브랜드 강조 액션                                      |
| `outline`      | White                          | Neutral 900                    | Neutral 200 | 보조 액션                                             |
| `ghost`        | transparent                    | Neutral 900                    | none        | 낮은 강조 액션                                        |
| `ghost-danger` | transparent                    | Danger 500 (hover: Danger 600) | none        | 초기화, 일정 비우기 등 낮은 강조의 파괴적 액션 트리거 |
| `destructive`  | Danger 500 (hover: Danger 600) | White                          | none        | 삭제 확정 등 파괴적 액션                              |
| `disabled`     | Neutral 100                    | Neutral 500                    | none        | 비활성 상태                                           |

- `ghost-danger`와 `destructive`는 같은 Danger 색상을 강조 정도만 다르게 사용한다. 트리거(예: "초기화", "일정 비우기" 버튼)는 `ghost-danger`, 확인 모달의 최종 확정 버튼은 `destructive`를 사용한다.
- 크기는 고정 width/height가 아니라 padding으로 구분한다.

| Size | Padding     | Usage       |
| ---- | ----------- | ----------- |
| `sm` | `8px 12px`  | 작은 버튼   |
| `md` | `14px 24px` | 기본 버튼   |
| `lg` | `16px 40px` | 큰 CTA 버튼 |

- State: `Default`, `Hover`, `Disabled`
- Icon: `None`, `Left`, `Right`, `Icon Only`
- Radius는 `16px`로 고정한다.
- 버튼 너비는 콘텐츠와 배치 맥락에 따라 정하고, Figma의 절대 width를 무조건 고정하지 않는다.

### Tab Button

보기 방식, 카테고리, 정렬 기준, 날짜 등을 전환할 때 사용하는 공통 컴포넌트다.

| Type        | Usage                           |
| ----------- | ------------------------------- |
| `date`      | 날짜 또는 Day 전환              |
| `category`  | 장소/조건 카테고리 필터         |
| `underline` | 주요 섹션 전환                  |
| `segmented` | 보기 방식, 정렬, 액션 그룹 전환 |
| `icon`      | 아이콘과 텍스트가 함께 있는 탭  |

| Type / State         | Background                  | Text        | Border / Indicator      |
| -------------------- | --------------------------- | ----------- | ----------------------- |
| `date.active`        | Primary 50                  | Primary 500 | Primary 500             |
| `date.inactive`      | transparent                 | Neutral 900 | none                    |
| `category.active`    | Primary 500 또는 Purple 500 | White       | none                    |
| `category.inactive`  | White                       | Neutral 600 | Neutral 200             |
| `underline.active`   | transparent                 | Primary 500 | Primary 500 bottom line |
| `underline.inactive` | transparent                 | Neutral 500 | none                    |
| `segmented.active`   | Primary 500                 | White       | none                    |
| `segmented.inactive` | White                       | Neutral 900 | Neutral 200             |
| `icon.active`        | Primary 500                 | White       | none                    |
| `icon.inactive`      | White                       | Neutral 900 | Neutral 200             |

- State: `active`, `inactive`, `disabled`
- active 상태는 하나만 명확히 표시한다.
- 날짜, 카테고리, 정렬, 보기 방식 전환 UI를 각각 새로 만들지 않는다.
- hover 색상은 위 표에 명시되지 않았으면 [Hover 공통 규칙](#hover)을 따른다 (예: `underline.active` hover → 텍스트/보더 `Primary 600`).

### Chip / Tag

상태, 조건, 카테고리, 필터 정보를 짧게 표시하는 공통 컴포넌트다.

| Type       | Usage                                |
| ---------- | ------------------------------------ |
| `default`  | 일반 카테고리 또는 정보 표시         |
| `selected` | 선택된 카테고리 또는 활성 필터       |
| `closable` | 사용자가 제거할 수 있는 선택 조건    |
| `status`   | 일정 상태, 추천 상태, 조건 상태 표시 |

| Type / State     | Background  | Text        | Border      |
| ---------------- | ----------- | ----------- | ----------- |
| `default`        | Neutral 100 | Neutral 700 | none        |
| `selected`       | Primary 50  | Primary 500 | Primary 500 |
| `closable`       | Neutral 100 | Neutral 600 | none        |
| `status.primary` | Primary 50  | Primary 500 | Primary 500 |
| `status.purple`  | Purple 50   | Purple 600  | Purple 600  |
| `status.rose`    | Rose 50     | Rose 600    | Rose 600    |
| `status.yellow`  | Yellow 50   | Yellow 700  | Yellow 700  |

- 긴 문장이나 설명 텍스트는 Chip / Tag로 만들지 않는다.
- 선택 가능한 필터는 `selected` 상태를 제공한다.
- 제거 가능한 조건은 `closable` 타입을 사용한다.
- 색상은 Color 팔레트 안에서만 사용한다.
- `selected`, `closable`처럼 클릭 가능한 Chip의 hover 색상은 [Hover 공통 규칙](#hover)을 따른다. `status` Chip은 클릭 대상이 아니므로 hover를 정의하지 않는다.

### Card

정보를 묶거나 선택 가능한 콘텐츠를 보여주는 공통 컴포넌트다.

| Type             | Usage                         |
| ---------------- | ----------------------------- |
| `base`           | 일반 정보 묶음                |
| `selectable`     | 사용자가 선택하는 옵션 카드   |
| `place`          | 추천 장소 카드                |
| `recommendation` | 추천 장소 상세 카드           |
| `summary`        | 결과 요약 또는 조건 요약 카드 |

| Area              | Background | Border      | Text        |
| ----------------- | ---------- | ----------- | ----------- |
| 기본 카드         | White      | Neutral 200 | Neutral 900 |
| 선택 카드         | Primary 50 | Primary 500 | Neutral 900 |
| 추천 강조 영역    | Primary 50 | none        | Neutral 900 |
| 위험/변경 전 카드 | Rose 50    | Rose 500    | Neutral 900 |
| 추천/변경 후 카드 | Purple 50  | Purple 500  | Neutral 900 |

- Card radius는 `16px`을 사용한다.
- 카드 안에 또 다른 카드 형태를 중첩하지 않는다.
- 장소 정보는 `place`, 추천 상세 정보는 `recommendation` 타입을 우선 사용한다.
- 카드 색상은 Color 팔레트 안에서만 사용한다.
- 클릭/선택 가능한 카드(`selectable`, `place` 등)의 hover는 [Hover 공통 규칙](#hover)을 따른다 (예: 기본 카드 border `Neutral 200` → hover `Neutral 400`).

### Form Field / Input

입력 항목은 Label, Input, Helper Text, Error Message를 포함하는 Form Field 단위로 관리한다.

| State      | Background | Text        | Border      | Message  |
| ---------- | ---------- | ----------- | ----------- | -------- |
| `default`  | White      | Neutral 900 | Neutral 200 | none     |
| `focused`  | White      | Neutral 900 | Primary 500 | none     |
| `disabled` | Neutral 50 | Neutral 500 | Neutral 100 | none     |
| `error`    | White      | Neutral 900 | Rose 500    | Rose 600 |
| `withIcon` | White      | Neutral 900 | Neutral 200 | none     |

- Input과 Textarea는 공통 컴포넌트를 사용한다.
- Input / Textarea radius는 `8px`을 사용한다.
- focus 상태는 Primary 500 border로 표시한다.
- error 상태는 Rose 500 border와 Rose 600 message를 사용한다.
- disabled 상태와 placeholder는 Neutral 계열을 사용한다.
- 아이콘이 필요한 입력창은 `withIcon` 타입을 사용한다.
- `default` 상태의 hover 색상(border `Neutral 200` → hover `Neutral 400`)은 [Hover 공통 규칙](#hover)을 따른다. `focused` 상태로 넘어가면 hover 스타일 대신 focus 스타일(Primary 500 border)을 우선한다.

### Select / Dropdown

옵션 목록 중 하나를 선택할 때 사용하는 공통 컴포넌트다. Select와 Dropdown은 새로 스타일링하지 않고 공통 컴포넌트를 우선 사용한다.

| State      | Background | Text        | Border      | Usage                 |
| ---------- | ---------- | ----------- | ----------- | --------------------- |
| `default`  | White      | Neutral 900 | Neutral 200 | 기본 상태             |
| `focused`  | White      | Neutral 900 | Primary 500 | 포커스 상태           |
| `disabled` | Neutral 50 | Neutral 500 | Neutral 100 | 비활성 상태           |
| `open`     | White      | Neutral 900 | Neutral 200 | 옵션 목록이 열린 상태 |

- Trigger는 선택값 또는 placeholder와 화살표 아이콘으로 구성한다.
- 옵션 목록은 Trigger 아래에 표시한다.
- 선택 또는 hover된 옵션은 Primary 50 계열 배경으로 구분한다.
- Select / Dropdown radius는 Input 기준인 `8px`을 사용한다.
- 문서에 없는 드롭다운 스타일을 임의로 만들지 않는다.
- 옵션 목록(팝오버)은 Modal과 마찬가지로 Portal로 렌더링해 부모 요소의 overflow에 잘리지 않게 한다.
- Trigger의 hover 색상(border `Neutral 200` → hover `Neutral 400`)은 [Hover 공통 규칙](#hover)을 따른다.

### Bottom Action Bar

단계형 화면 하단에서 이전/다음/추천받기/확정하기 같은 주요 액션을 제공하는 공통 영역이다.

- Step Flow 화면에서는 Bottom Action Bar를 우선 사용한다.
- 왼쪽에는 이전/취소 계열 액션, 오른쪽에는 다음/확정 계열 액션을 배치한다.
- 주요 액션은 오른쪽에 배치한다.
- 버튼은 공통 Button 컴포넌트를 사용한다.
- 화면마다 하단 액션 영역을 새로 만들지 않는다.

### Modal

화면 흐름을 막고 사용자의 확인이나 선택이 필요할 때 사용하는 공통 컴포넌트다.

| Area      | Value                                | Usage                                     |
| --------- | ------------------------------------ | ----------------------------------------- |
| Overlay   | Black 55% opacity                    | 화면 전체를 덮는 딤 처리                  |
| Container | White 배경, radius 16px, drop shadow | 중앙 정렬된 모달 카드                     |
| Close     | 우측 상단 X 아이콘                   | 취소 없이 닫기                            |
| Actions   | 왼쪽 취소(`outline`), 오른쪽 확정    | 확정 액션이 파괴적이면 `destructive` 사용 |

- 파괴적 확인 모달(예: 삭제, 일정 비우기)은 상단에 경고 아이콘(Danger 톤)을 두고, "되돌릴 수 없습니다"처럼 되돌릴 수 없다는 문구를 Danger 500 텍스트로 강조한다.
- 확정 버튼은 액션 성격에 따라 `default`/`secondary`(일반 확인) 또는 `destructive`(삭제 등 파괴적 확인)를 선택한다.
- 모달 내부에 카드를 중첩하지 않는다.
- Modal은 Portal로 렌더링해 부모 요소의 stacking context, overflow 영향을 받지 않게 한다.

### Toast

화면 흐름을 막지 않고 짧은 결과(저장 완료, 에러 등)를 알리는 공통 컴포넌트다. 특정 UI 라이브러리에 고정하지 않고, 아래 스타일을 그대로 커스터마이징할 수 있는 방식(예: Sonner, react-hot-toast처럼 커스텀 렌더를 지원하는 라이브러리, 또는 직접 구현)을 사용한다. 특정 라이브러리의 기본 스킨을 그대로 쓰지 않는다.

| Type      | Background | Border      | Icon                                   | Usage                   |
| --------- | ---------- | ----------- | -------------------------------------- | ----------------------- |
| `success` | Primary 50 | Primary 500 | 원형 배경 + 체크 아이콘 (Primary 500)  | 저장, 완료 등 성공 알림 |
| `info`    | Purple 50  | Purple 600  | 원형 배경 + 느낌표 아이콘 (Purple 600) | 일반 안내               |
| `warning` | Yellow 50  | Yellow 600  | 원형 배경 + 느낌표 아이콘 (Yellow 600) | 주의가 필요한 안내      |
| `error`   | Rose 50    | Rose 500    | 원형 배경 + 느낌표 아이콘 (Rose 500)   | 처리 실패 등 에러 알림  |

- Radius `12px`, border `1px`을 모든 타입에 동일하게 적용한다 (타입마다 border 두께나 padding을 다르게 만들지 않는다).
- 좌측에 상태 아이콘, 우측에 메시지 텍스트를 가로로 배치하고 아이콘-텍스트 간격은 `10px`을 사용한다.
- 메시지 텍스트는 Body(`16px` Bold), 색상은 Neutral 900을 사용한다.
- 화면 상단 또는 하단 중앙에 고정 위치로 노출하고, 일정 시간 후 자동으로 사라진다. 노출 위치와 지속 시간은 페이지마다 다르게 만들지 않고 전역 설정으로 통일한다.
- Toast는 Modal이 열려 있는 상태에서도 항상 Modal 위에 보이도록 렌더링한다.

### Map

지도가 필요한 화면(장소 검색, 경로 확인 등)에서 사용하는 공통 컴포넌트다.

- 지도는 카카오맵(Kakao Maps API)을 사용한다.
- 마커/핀은 카카오맵 기본 마커를 쓰지 않고 커스텀 마커로 구현한다. 마커 색상은 Color 팔레트 안에서 선택한다 (예: 선택된 장소는 Primary 500, 일반 장소는 Neutral 700).
- 지도 위 오버레이 카드(장소 정보 팝업 등)는 Card 컴포넌트 기준(radius `16px`, White 배경)을 따른다.

### Feedback State

로딩, 빈 결과, 오류처럼 화면 상태를 안내하는 공통 패턴이다.

| Type      | Usage                               |
| --------- | ----------------------------------- |
| `loading` | AI 추천 처리 중, 데이터 불러오는 중 |
| `empty`   | 추천 결과 없음, 검색 결과 없음      |
| `error`   | 처리 실패, 다시 시도 필요           |

- 상태 안내는 제목, 설명, 필요한 액션 버튼으로 구성한다.
- `loading`은 기본적으로 skeleton을 사용한다. 컨텐츠 레이아웃을 그대로 따라가는 형태(카드 모양, 리스트 줄 모양)로 만들고, skeleton을 적용하기 애매한 전체 화면/버튼 단위 로딩에는 spinner를 사용한다.
- `empty`와 `error`에는 복구 액션을 제공한다.
- 오류 색상은 Rose 계열을 사용한다.

#### Illustration (마스코트)

- 페이지 전체를 채우는 큰 empty state(예: 일정이 아예 없음, 즐겨찾기 없음)와 404 같은 전체 화면 에러에는 PlanB 마스코트 캐릭터 일러스트를 사용한다.
- 패널/섹션 단위의 작은 empty state(예: 검색 결과 없음)에는 마스코트 대신 라인 아트 아이콘 일러스트를 사용한다. 마스코트를 모든 empty state에 남용하지 않는다.
- 마스코트 표정/포즈는 상황에 맞게 선택하되(예: 안내 시 손가락으로 가리키는 포즈, 완료 시 웃는 포즈), 새 포즈가 필요하면 임의로 만들지 않고 별도 확인 후 추가한다.

## 6. Global Style Rules

전역 스타일은 최소 범위로 유지한다.

- 전역 CSS에는 Tailwind import, theme token, body 기본 폰트, 배경, 텍스트 색상, 기본 reset만 둔다.
- 페이지별 레이아웃, 카드, 버튼, 폼 스타일을 global selector로 작성하지 않는다.
- 특정 컴포넌트 스타일은 컴포넌트 내부 className 또는 공통 UI 컴포넌트로 분리한다.
- `html`, `body`의 기본 배경은 Neutral 50, 기본 텍스트는 Neutral 900을 따른다.
- 새 global selector를 추가해야 한다면 모든 페이지에 영향을 주는지 먼저 확인한다.

## 7. Implementation Checklist

색상, radius, spacing, 컴포넌트 스펙 같은 구체적인 값은 위 각 섹션(Token Principles, Layout, Color, Radius, Common Components)을 따른다. 여기서는 그 규칙들을 다시 나열하지 않고, 위 섹션들만으로는 놓치기 쉬운 최종 확인 항목만 정리한다.

1. 구현할 화면에서 사용되는 공통 컴포넌트를 먼저 식별하고, 새로 만들기 전에 `src/shared/components/ui`에 이미 있는지 확인한다.
2. hover, active, disabled, focus 상태를 빠짐없이 확인한다.
3. interactive element에는 접근 가능한 이름과 focus-visible 상태를 제공한다.
4. 텍스트가 버튼, 칩, 카드 내부에서 잘리거나 겹치지 않도록 padding과 min-width를 함께 확인한다.
5. 이 문서에 없는 색상, radius, typography, spacing, 컴포넌트 variant가 필요하면 임의로 만들지 말고 확인 후 추가한다.
