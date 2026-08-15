# Git 협업 운영 가이드

이 문서는 PlanB 프론트엔드 저장소에서 실제로 사용하는 Git/GitHub 협업 규칙을 정리한다.
Git 개념 자체보다 작업 중 자주 확인해야 하는 규칙과 실수 방지 절차를 다룬다.

## 1. 핵심 원칙

브랜치 흐름은 다음과 같다.

```text
최신 dev → 작업 브랜치 → Pull Request → dev → 배포 시 main
```

- `main`: 최종 배포 및 안정 버전
- `dev`: 기본 브랜치이자 개발 통합 브랜치
- 작업 브랜치: 기능, 수정, 문서 등 실제 작업을 수행하는 브랜치
- 일반 작업 PR의 base는 항상 `dev`다.
- 작업 브랜치에서 `main`으로 직접 PR을 만들지 않는다.
- `main`과 `dev`에 직접 push하지 않고 PR을 사용한다.
- 한 브랜치와 PR에는 하나의 Issue 또는 하나의 명확한 목적만 담는다.

저장소의 GitHub default branch는 `dev`다.
GitHub에서 PR을 열 때 자동 선택된 base를 믿지 말고 직접 확인한다.

```text
base: dev
compare: 작업 브랜치
```

## 2. 브랜치 규칙

### 2.1 `main`

`main`은 최종 배포 및 안정 버전을 관리한다.

- 배포 가능한 코드만 유지한다.
- 일반 기능과 버그 수정은 바로 반영하지 않는다.
- 최종 배포 시 `dev → main` PR을 사용한다.

### 2.2 `dev`

`dev`는 완료된 작업을 통합하는 기본 개발 브랜치다.

- 일반 작업 PR의 base가 된다.
- CI는 `dev` 대상 PR과 `dev` push에서 실행된다.
- 작업 브랜치는 최신 `dev`에서 생성한다.

### 2.3 작업 브랜치 생성

작업을 시작하기 전에 변경 사항이 남아 있지 않은지 확인한다.

```bash
git status
git branch --show-current
git fetch origin
```

미커밋 변경이 있다면 삭제하거나 다른 작업에 섞지 않는다.
먼저 커밋, stash 또는 별도 백업 브랜치로 안전하게 분리한다.

최신 `dev`에서 작업 브랜치를 만든다.

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feat/22-icon-common-component
```

브랜치 형식은 다음과 같다.

```text
<prefix>/<issue-number>-<kebab-case-summary>
```

| Prefix      | 용도                     |
| ----------- | ------------------------ |
| `feat/`     | 기능 추가·변경           |
| `fix/`      | 버그 수정                |
| `refactor/` | 동작 변화 없는 구조 개선 |
| `chore/`    | 설정, 의존성, 개발 환경  |
| `docs/`     | 문서 변경                |
| `test/`     | 테스트 추가·수정         |

예시는 다음과 같다.

```text
feat/22-icon-common-component
fix/24-card-layout
refactor/31-recovery-state
chore/35-ci-config
docs/26-git-workflow
test/50-recovery-form
```

브랜치명은 영문 소문자, 숫자, 하이픈을 사용한다.
Issue가 있는 작업은 번호를 포함하고, 이름만 보고 목적을 알 수 있게 작성한다.

### 2.4 작업 중 `dev` 변경 반영

다른 PR이 먼저 merge되어 작업 브랜치가 behind 상태가 되는 것은 정상이다.
같은 파일이 변경됐거나 최신 공통 코드가 필요한 경우 `dev`를 반영한다.

개인 작업 브랜치는 다음처럼 rebase할 수 있다.

```bash
git fetch origin
git rebase origin/dev
```

이미 push한 개인 브랜치를 rebase했다면 일반 force 대신 다음을 사용한다.

```bash
git push --force-with-lease
```

여러 사람이 공유하는 브랜치는 임의로 rebase하거나 강제 push하지 않는다.

## 3. Issue 규칙

Issue는 작업의 배경, 범위와 완료 조건을 팀이 공유할 가치가 있을 때 만든다.

Issue가 필요한 대표 작업은 다음과 같다.

- 새 기능이나 화면
- API 연동
- 공통 UI 컴포넌트
- 재현과 검증이 필요한 버그
- 여러 파일에 영향을 주는 개선 또는 리팩터링
- FE/BE 협의가 필요한 작업

현재 commitlint는 모든 일반 커밋에 Issue 번호를 요구한다.
오탈자, 단순 문구나 주석 수정처럼 작은 작업도 연결할 Issue가 없다면 먼저 Issue를 만든다.
번호를 임의로 작성하거나 관련 없는 Issue에 연결하지 않는다.

Issue 제목은 다음 형식을 사용한다.

```text
[Type] 작업 내용
```

```text
[Feat] 공통 IconBadge 컴포넌트 추가
[Fix] 추천 카드 정렬 오류 수정
[Refactor] 복구 상태 관리 구조 개선
[Docs] Git 협업 운영 가이드 정리
```

Issue 본문은 `.github/ISSUE_TEMPLATE`을 사용한다.
최소한 작업 내용과 확인 가능한 완료 조건을 작성한다.

- Assignee는 실제 담당자를 지정한다.
- Label은 검색이나 분류가 필요할 때 사용한다.
- Milestone은 MVP나 스프린트처럼 명확한 목표가 있을 때만 사용한다.

## 4. Commit convention

커밋 메시지는 다음 형식을 사용한다.

```text
<type>: <한국어 작업 요약> (#이슈번호)
```

```text
feat: 공통 IconBadge 컴포넌트 추가 (#22)
fix: 일정 카드 시간 표시 오류 수정 (#24)
docs: Git 협업 운영 가이드 정리 (#26)
```

허용되는 type은 실제 `commitlint.config.mjs`와 동일하다.

| Type       | 의미                            |
| ---------- | ------------------------------- |
| `feat`     | 기능 추가·변경                  |
| `fix`      | 버그 수정                       |
| `refactor` | 동작 변화 없는 구조 개선        |
| `chore`    | 설정, 의존성, 개발 환경         |
| `docs`     | 문서 변경                       |
| `style`    | 로직 변화 없는 서식·스타일 정리 |
| `test`     | 테스트 추가·수정                |

다음 규칙을 지킨다.

- type은 소문자로 작성한다.
- type 뒤에는 콜론과 공백 하나(`: `)를 사용한다.
- 작업 요약은 구체적으로 작성하고 끝에 마침표를 붙이지 않는다.
- Issue 번호는 마지막에 `(#숫자)` 형식으로 하나만 작성한다.
- 한 커밋에는 하나의 논리적 변경만 담는다.
- 무관한 포맷 변경, 별도 버그 수정, 다른 작업 파일은 분리한다.

`.husky/commit-msg`가 `pnpm exec commitlint --edit`을 실행해 형식을 검사한다.
commit 전에 staged 범위를 확인한다.

```bash
git status
git diff --cached
```

## 5. Pull Request 규칙

### 5.1 대상과 범위

일반 작업 PR은 다음 방향으로 만든다.

```text
base: dev
compare: feat/22-icon-common-component
```

다음 방향은 사용하지 않는다.

```text
base: main
compare: feat/22-icon-common-component
```

`main` 대상 PR은 배포를 위해 `dev → main`으로 올리는 경우에만 사용한다.

하나의 PR에는 하나의 Issue 또는 하나의 명확한 목적을 담는다.
기능과 무관한 리팩터링, 다른 사람의 미커밋 파일, 생성 산출물을 함께 올리지 않는다.
방향을 먼저 공유해야 하면 Draft PR을 사용한다.

### 5.2 PR 생성 전 확인

원격 상태를 갱신한다.

```bash
git fetch origin
```

현재 작업 브랜치에만 있는 커밋을 확인한다.

```bash
git log --oneline origin/dev..HEAD
```

`dev`와 비교한 실제 변경 파일과 내용을 확인한다.

```bash
git diff --name-status origin/dev...HEAD
git diff origin/dev...HEAD
```

관련 없는 커밋이나 파일이 보이면 PR을 만들기 전에 base와 브랜치 시작점을 확인한다.
필요하다면 작업물을 백업한 뒤 최신 `dev` 위로 브랜치를 재구성한다.

PR 생성 후에도 GitHub 화면에서 base, commits, Files changed를 다시 확인한다.

### 5.3 제목과 본문

PR 제목은 커밋과 같은 형식을 사용한다.

```text
feat: 공통 IconBadge 컴포넌트 추가 (#22)
docs: Git 협업 운영 가이드 정리 (#26)
```

본문은 `.github/pull_request_template.md`를 사용한다.
핵심 내용은 다음과 같다.

- 무엇을 왜 변경했는지
- 주요 변경 사항
- self review와 검증 결과
- 관련 Issue
- UI 변경 시 스크린샷
- 리뷰어가 특별히 확인할 부분

merge 시 Issue를 자동 종료하려면 다음처럼 작성한다.

```text
Closes #22
```

관련만 표시하고 자동 종료하지 않으려면 다음을 사용한다.

```text
Refs #22
```

## 6. Review 및 Merge

### 6.1 Self review

리뷰 요청 전에 작성자가 diff를 처음부터 확인한다.

- Issue 완료 조건을 충족하는가
- 불필요한 파일이나 디버그 코드가 없는가
- 타입과 접근성이 안전한가
- 구현이 필요 이상으로 복잡하지 않은가
- 기존 구조, UI와 네이밍이 일관적인가
- 필요한 검증을 실행했는가

### 6.2 자동 검증과 리뷰

CI는 `dev`와 `main` 대상 PR에서 다음을 실행한다.

```text
pnpm lint
pnpm typecheck
pnpm build
```

세부 설정은 `.github/workflows/ci.yml`을 기준으로 한다.
Storybook 작업은 로컬에서 `pnpm build-storybook`도 확인한다.

CodeRabbit은 `dev` 대상의 Draft가 아닌 PR을 자동 리뷰한다.
사람 리뷰를 대체하지 않으며 실제 버그, 타입, 접근성, 유지보수성 문제를 보조 확인한다.
세부 규칙은 `.coderabbit.yaml`을 기준으로 한다.

PR을 열면 작성자가 자동 assignee로 지정된다.
`dev` 대상 PR의 open/merge 알림은 Discord로 전송된다.
자동화의 실제 동작은 `.github/workflows`를 기준으로 한다.

### 6.3 사람 리뷰

Draft를 해제하고 필요한 검증이 완료된 후 다른 FE에게 리뷰를 요청한다.
긴급 상황이 아니라면 작성자 외 FE 1명의 확인을 받은 뒤 merge한다.
API 계약에 영향이 있으면 BE 담당자에게도 관련 부분을 요청한다.

리뷰 코멘트는 취향보다 문제의 이유, 영향과 개선 방향을 설명한다.

### 6.4 Merge 방식

현재 GitHub 저장소는 merge commit, squash, rebase 방식을 모두 허용한다.
최근 `dev` PR은 **Create a merge commit** 방식으로 merge되었으므로 이를 현재 운영 기준으로 사용한다.

merge 전 다음을 확인한다.

- CI와 필요한 리뷰가 완료됐는가
- conflict가 없는가
- PR 제목과 Issue 연결이 올바른가
- Files changed에 관련 없는 파일이 없는가

merge 후 원격 작업 브랜치는 자동 삭제되지 않으므로 직접 삭제한다.
Squash and merge로 정책을 변경한다면 저장소 설정과 이 문서를 함께 수정한다.

## 7. 전체 작업 흐름

예: `#22 [Feat] 공통 IconBadge 컴포넌트 추가`

### 1. Issue와 최신 상태 확인

```bash
git status
git fetch origin
git switch dev
git pull --ff-only origin dev
```

### 2. 작업 브랜치 생성

```bash
git switch -c feat/22-icon-common-component
```

### 3. 구현 후 변경 범위 확인

```bash
git status
git diff
```

### 4. 관련 파일만 commit

```bash
git add src/shared/assets/icons \
  src/shared/components/ui/IconBadge.tsx \
  src/shared/components/ui/IconBadge.stories.tsx

git diff --cached
git commit -m "feat: 공통 IconBadge 컴포넌트 추가 (#22)"
```

`git add .`보다 관련 경로를 명시해 다른 작업이 섞이지 않게 한다.

### 5. Push 및 PR 생성

```bash
git push -u origin feat/22-icon-common-component
```

GitHub에서 다음을 확인하고 PR을 만든다.

```text
base: dev
compare: feat/22-icon-common-component
```

### 6. 검증과 리뷰

```text
self review → CI → CodeRabbit(non-draft) → 다른 FE 리뷰
```

### 7. Merge 및 정리

```bash
git switch dev
git pull --ff-only origin dev
git branch -d feat/22-icon-common-component
```

GitHub의 원격 작업 브랜치도 삭제한다.

## 8. 빠른 체크리스트

### 작업 시작 전

- [ ] 미커밋 변경을 확인하고 다른 작업과 안전하게 분리했다.
- [ ] 최신 `dev`에서 작업 브랜치를 생성했다.
- [ ] 브랜치명에 Issue 번호와 목적이 드러난다.

### Commit 전

- [ ] 관련 파일만 stage했다.
- [ ] `git diff --cached`로 범위를 확인했다.
- [ ] 커밋 메시지가 commitlint 형식에 맞는다.

### PR 생성 전

- [ ] `git log --oneline origin/dev..HEAD`를 확인했다.
- [ ] `git diff origin/dev...HEAD`를 확인했다.
- [ ] 관련 없는 커밋이나 파일이 없다.
- [ ] PR base가 `dev`다.
- [ ] self review와 필요한 로컬 검증을 완료했다.
- [ ] PR 본문에 검증 결과와 Issue 연결을 작성했다.
- [ ] UI 변경이면 스크린샷을 첨부했다.

### Merge 전

- [ ] CI와 필요한 리뷰가 완료됐다.
- [ ] CodeRabbit의 actionable comment를 확인했다.
- [ ] conflict와 Files changed를 확인했다.

### Merge 후

- [ ] Issue가 정상적으로 종료됐는지 확인했다.
- [ ] 원격 작업 브랜치를 삭제했다.
- [ ] 로컬 `dev`를 최신화했다.
- [ ] 로컬 작업 브랜치를 삭제했다.
