<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PlanB UI 작업 규칙

UI를 구현하거나 수정하기 전에는 반드시 `docs/design/design-system.md`를 확인하고, 그 문서의 기준(색상, radius, typography, spacing, 공통 컴포넌트 등)을 따른다.

`design-system.md`가 유일한 기준 문서다. 그 내용을 여기 요약해서 옮겨두지 않는다 — 요약본은 원본이 바뀌어도 자동으로 갱신되지 않아 곧바로 어긋나기 때문이다.
