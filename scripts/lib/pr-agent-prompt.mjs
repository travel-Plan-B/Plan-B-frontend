export function buildPrAgentPrompt({ issue, mode, existingPr, context }) {
  return `현재 변경사항을 GitHub PR로 마무리하기 위한 read-only 분석을 수행하세요.

확정된 컨텍스트:
- issue: #${issue}
- mode: ${mode}
- branch/head: ${context.branch}
- base: ${context.base}
- existing PR: ${existingPr ? `#${existingPr.number} (${existingPr.url})` : "없음"}
- staged: ${context.stagedFiles.join(", ") || "없음"}
- unstaged: ${context.unstagedFiles.join(", ") || "없음"}
- untracked: ${context.untrackedFiles.join(", ") || "없음"}
- cached origin/dev 상태: ${context.cachedDevRelation}
- pr:finish 필수 검증: ${context.validationPolicy.checks.join(", ")}

허용되는 작업:
- 파일 읽기
- git status, git diff, git log, git ls-files 등 Git read-only 조회
- gh issue list/view, gh pr view/diff 등 GitHub read-only 조회

금지되는 작업:
- mkdir, New-Item, Write, Edit 및 모든 파일/디렉터리 생성·수정·삭제
- git add/branch/commit/push/switch/checkout/rebase/reset 등 Git write
- gh issue edit, gh pr create/edit 등 GitHub write
- pnpm pr, pnpm pr:finish 및 repository 상태를 바꿀 수 있는 명령

분석 기준:
1. 실제 diff와 Issue #${issue}의 목적을 비교해 type, 순수 subject, kebab-case slug를 결정합니다.
2. subject에는 type prefix와 (#${issue}) suffix를 넣지 않습니다.
3. 모든 변경이 Issue 범위에 직접 속할 때만 scope를 "all"로 반환합니다.
4. UI 기능 Issue에서는 해당 feature, 그 기능 때문에 직접 변경된 shared UI, 직접 관련 문서만 같은 범위로 봅니다.
5. scripts/, .github/, package manager 설정, CI/자동화 설정은 Issue가 자동화·tooling·개발환경 작업을 명시하지 않는 한 기본적으로 unrelated입니다.
6. unrelated 변경이 하나라도 있으면 scope를 "blocked"로, unrelatedFiles에 POSIX 경로를 결정적 순서로 반환합니다.
7. create mode에서는 issueResult와 prBody를 생성합니다. PR body는 .github/pull_request_template.md를 따르고 작업 목적, 주요 변경 사항, 검증 결과, 관련 Issue(Closes #${issue})만 포함하는 리뷰용 문서로 작성합니다.
8. update mode에서는 변경이 필요할 때만 issueResult/prBody를 문자열로, 아니면 null로 반환합니다.
9. Issue 본문에 <!-- planb:quick-issue -->가 있으면 정리된 issueBody를 반환하고, 아니면 null로 반환합니다.
10. prBody에는 branch name, commit SHA, push/upstream 상태, 로컬 working tree 상태, 인증 방식, credential/token 정보, Agent 실행 과정, checkpoint 내부 정보를 포함하지 않습니다.
11. 사용자에게 보여줄 실행 완료 보고와 GitHub 리뷰용 prBody를 섞지 않습니다. prBody에는 작업 결과를 재현·검토하는 데 필요한 정보만 작성합니다.

출력 계약:
- stdout에는 아래 스키마의 JSON 객체 하나만 출력합니다.
- Markdown code fence, 선행/후행 설명, 로그를 출력하지 않습니다.
- JSON 문자열 내부 줄바꿈은 올바르게 escape합니다.

{
  "plan": {
    "issue": ${issue},
    "mode": "${mode}",
    "type": "feat|fix|refactor|chore|docs|style|test 중 하나",
    "subject": "type과 Issue suffix가 없는 한국어 제목",
    "slug": "english-kebab-case",
    "scope": "all 또는 blocked",
    "validation": "수행한 추가 검증 또는 pr:finish 검증에 위임했다는 요약",
    "unrelatedFiles": []
  },
  "issueResult": "Markdown 문자열 또는 null",
  "prBody": "Markdown 문자열 또는 null",
  "issueBody": "Markdown 문자열 또는 null"
}`;
}
