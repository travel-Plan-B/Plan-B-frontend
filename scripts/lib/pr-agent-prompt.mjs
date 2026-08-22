export function buildPrAgentPrompt({ issue, context }) {
  return `현재 working tree 전체를 하나의 GitHub PR로 정리하기 위한 read-only 분석을 수행하세요.

확정된 컨텍스트:
- issue: #${issue}
- branch/head: ${context.branch}
- base: ${context.base}
- staged: ${context.stagedFiles.join(", ") || "없음"}
- unstaged: ${context.unstagedFiles.join(", ") || "없음"}
- untracked: ${context.untrackedFiles.join(", ") || "없음"}
- pr:finish 필수 검증: ${context.validationPolicy.checks.join(", ")}

Orchestrator가 제공한 safe textual diff:
${context.safeDiff || "변경 diff 없음"}

Issue는 존재가 확인된 연결 번호일 뿐 작업 명세가 아닙니다. Issue 제목과 본문을 분석하거나 diff와 비교하지 마세요.
현재 working tree의 모든 변경사항은 이번 PR에 포함하도록 확정되어 있습니다. 파일 포함 여부를 판단하지 마세요.

허용되는 작업:
- 파일 읽기
- git status, git log, git ls-files 등 Git read-only 조회

Diff 조회 규칙:
- raw \`git diff\`를 직접 실행하거나 binary patch 본문을 읽고 출력하지 마세요.
- \`git diff --binary\` 또는 binary patch를 생성하는 옵션을 사용하지 마세요.
- PNG, JPG, JPEG, WEBP, GIF, ICO 등 binary 파일은 위 safe diff에 제공된 경로, 상태, 크기 metadata만 분석하세요.
- TS, TSX, JS, MJS, CSS, MD, JSON, YAML 등 text source/config/docs 파일은 위 safe textual diff의 실제 patch를 분석하세요.

금지되는 작업:
- mkdir, New-Item, Write, Edit 및 모든 파일/디렉터리 생성·수정·삭제
- git add/branch/commit/push/switch/checkout/rebase/reset 등 Git write
- gh issue edit, gh pr create/edit 등 GitHub write
- pnpm pr, pnpm pr:finish 및 repository 상태를 바꿀 수 있는 명령

Agent 역할:
1. 위에서 orchestrator가 제공한 변경 파일 목록과 safe textual diff를 분석해 type을 결정합니다. raw git diff를 직접 실행하지 않습니다.
2. commit용 한국어 subject를 작성합니다. type prefix와 (#${issue}) suffix는 넣지 않습니다.
3. 새 branch에 사용할 kebab-case slug를 작성합니다.
4. 작업 내용, 주요 변경 사항, 검증, 관련 Issue(Closes #${issue})를 담은 리뷰용 prBody를 작성합니다.

출력 계약:
- 반드시 아래 최소 스키마를 만족하는 JSON 객체 하나만 출력합니다.
- 응답의 첫 문자는 반드시 \`{\`, 마지막 문자는 반드시 \`}\`여야 합니다.
- Markdown code fence와 json 코드블록을 사용하지 않습니다.
- prBody에는 Markdown을 사용할 수 있지만 triple backtick fenced code block은 포함하지 않습니다. 코드나 명령은 inline code 또는 들여쓴 예시로 작성합니다.
- JSON 앞뒤 설명문, 주석, 로그 및 JSON 외 텍스트를 절대 출력하지 않습니다.
- JSON 문자열 내부 줄바꿈은 올바르게 escape합니다.
- type, subject, slug는 개행이 없는 단일 행 문자열이고 prBody는 비어 있지 않아야 합니다.

{
  "type": "feat|fix|refactor|chore|docs|style|test 중 하나",
  "subject": "type과 Issue suffix가 없는 한국어 제목",
  "slug": "english-kebab-case",
  "prBody": "리뷰용 Markdown 문자열"
}`;
}

export function buildAgentResultRepairPrompt({ output, validationError }) {
  return `이전 응답은 JSON 객체로 추출되었지만 PR Agent schema 검증에 실패했습니다.

검증 오류: ${validationError}

이전 응답의 변경 분석 의미를 바꾸지 말고 type, subject, slug, prBody 네 필드의 schema만 수정하세요.

응답은 첫 문자가 {이고 마지막 문자가 }인 단일 JSON 객체여야 합니다.
Markdown code fence, 설명문, 주석, JSON 외 텍스트를 출력하지 마세요.
prBody에는 triple backtick fenced code block을 넣지 말고 inline code 또는 들여쓴 예시를 사용하세요.

이전 응답:
${JSON.stringify(output)}`;
}
