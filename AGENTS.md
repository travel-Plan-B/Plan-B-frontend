<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## GitHub PR 작성 규칙

- PR 제목과 본문은 한국어로 작성한다.
- 코드, 명령어, 파일명, 라이브러리명처럼 영어 표기가 더 명확한 기술 용어는 그대로 사용한다.
- PR 본문에는 변경 내용, 변경 이유, 영향 범위, 검증 결과를 간결하게 작성한다.

## PlanB UI 작업 규칙

UI를 구현하거나 수정하기 전에는 반드시 `docs/design/design-system.md`를 확인하고, 그 문서의 기준(색상, radius, typography, spacing, 공통 컴포넌트 등)을 따른다.

`design-system.md`가 유일한 기준 문서다. 그 내용을 여기 요약해서 옮겨두지 않는다 — 요약본은 원본이 바뀌어도 자동으로 갱신되지 않아 곧바로 어긋나기 때문이다.
