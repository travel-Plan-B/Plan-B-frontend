export function buildPrAgentPrompt({ issue, tempDir }) {
  const issueInstruction = issue
    ? `사용자가 관련 Issue를 #${issue}로 명시했다. 반드시 이 번호를 검증하고 사용한다.`
    : "Issue 번호가 확정되지 않았다. Issue를 추측하거나 파일을 stage하지 말고 실행을 중단한다.";

  return `현재 완료된 작업을 GitHub PR로 안전하게 마무리한다.

${issueInstruction}

판단과 준비:
1. git status, staged/unstaged/untracked 파일과 git diff를 확인한다.
2. 이번 작업 범위와 관련 Issue를 정확히 확인한다.
3. 작업 type, 영문 kebab-case branch slug, 한국어 commit/PR subject를 결정한다.
4. 필요한 lint/typecheck/build/test를 선택해 실행하고 실패하면 PR을 만들지 않는다.
5. 작업과 관련된 파일만 경로를 명시해 git add한다. git add . 또는 git add -A를 사용하지 않는다.
6. ${tempDir}/issue-result.md와 ${tempDir}/pr-body.md를 작성한다.
7. 빠른 Issue(본문에 <!-- planb:quick-issue --> marker가 있음)라면 ${tempDir}/issue-body.md도 작성한다. 정식 Issue라면 기존 요구사항을 보존하며 issue-body.md를 만들지 않는다.
8. PR 본문은 .github/pull_request_template.md를 따르고 실행한 검증 결과와 Closes #번호를 포함한다.
9. 모든 판단과 검증, staging, Markdown 작성 후 pnpm pr:finish를 필요한 인자와 파일 경로로 정확히 한 번 실행한다.

필수 제약:
- 직접 git commit, git push, git switch, git checkout, git rebase, git reset, gh issue edit, gh pr create를 실행하지 않는다.
- force push, dev/main 직접 push, 기존 commit history 수정, 작업 범위 밖 파일 수정은 금지한다.
- pr:finish의 검증을 우회하지 않는다.
- rebase가 필요하거나 충돌 가능성이 있으면 자동 해결하지 말고 중단해 사용자에게 상태를 설명한다.
- API key나 token을 파일 또는 출력에 기록하지 않는다.

pr:finish 예시:
pnpm pr:finish --issue 42 --type feat --subject "작업 요약" --slug english-slug --issue-result-file ${tempDir}/issue-result.md --pr-body-file ${tempDir}/pr-body.md

빠른 Issue에는 위 명령에 --issue-body-file ${tempDir}/issue-body.md를 추가한다.`;
}
