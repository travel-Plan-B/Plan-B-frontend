export function buildPrAgentPrompt({
  issue,
  tempDir,
  mode,
  existingPr,
  context,
}) {
  const issueInstruction = issue
    ? `사용자가 관련 Issue를 #${issue}로 명시했다. 반드시 이 번호를 검증하고 사용한다.`
    : "Issue 번호가 확정되지 않았다. Issue를 추측하거나 파일을 stage하지 말고 실행을 중단한다.";

  const modeInstruction =
    mode === "update"
      ? `mode: update
existing PR: #${existingPr.number} ${existingPr.url}
- 새로운 PR이나 브랜치를 만들지 않는다.
- 현재 PR에 추가할 변경사항만 분석하고 새 commit을 추가한다.
- Issue 작업 결과는 실제로 갱신할 필요가 있을 때만 issue-result.md를 작성한다.
- 기존 PR 본문은 범위나 검증 결과가 달라져 갱신이 필요할 때만 pr-body.md를 작성한다.
- 기존 PR/Issue의 의미 있는 내용을 보존한다.`
      : `mode: create
- 최초 PR 생성에 필요한 Issue/PR Markdown을 작성한다.`;

  const suppliedContext = `오케스트레이터가 이미 확인한 컨텍스트:
- mode: ${mode}
- branch/head: ${context.branch}
- base: ${context.base}
- Issue: #${issue}
- PR: ${existingPr ? `#${existingPr.number} (${existingPr.url})` : "없음"}
- staged: ${context.stagedFiles.join(", ") || "없음"}
- unstaged: ${context.unstagedFiles.join(", ") || "없음"}
- untracked: ${context.untrackedFiles.join(", ") || "없음"}
- origin/dev 상태: ${context.cachedDevRelation}; 최신 원격 재검증은 pr:finish가 쓰기 직전에 수행
- pr:finish 최소 검증: ${context.validationPolicy.checks.join(" → ")}

위 사실은 불일치 정황이 없는 한 git/gh로 다시 조회하지 않는다. 실제 diff 내용과 작업 의미 분석에 집중한다.
최소 검증은 pr:finish가 staged 파일 기준으로 강제하므로 같은 lint/typecheck/build를 미리 중복 실행하지 않는다. 필요한 추가 검증만 실행할 수 있다.`;

  return `현재 완료된 작업을 GitHub PR로 안전하게 마무리한다.

${suppliedContext}

${issueInstruction}
${modeInstruction}

판단과 준비:
1. 제공된 파일 목록을 기준으로 실제 git diff 내용과 작업 범위를 분석한다. status/Issue/PR 메타데이터를 습관적으로 재조회하지 않는다.
2. 제공된 Issue와 작업 범위가 모순될 때만 필요한 최소 조회를 추가한다.
3. 작업 type, 영문 kebab-case branch slug, 한국어 commit/PR subject를 결정한다.
4. pr:finish가 정책상 최소 검증을 실행한다. 변경 특성상 필요한 추가 test만 선택해 실행한다.
5. git status와 diff로 모든 working tree 변경이 이번 Issue 범위인지 확인한다. 이미 필요한 변경이 staged되어 있으면 재-stage하지 않는다.
6. staged 변경이 없고 모든 working tree 변경이 이번 Issue 범위임이 확인된 경우에만 별도 shell command로 git add -A를 실행한다. unrelated 변경이 섞여 있으면 관련 파일만 git add -- path/to/file 형식으로 stage하며 Git 경로는 Windows에서도 역슬래시가 아닌 /로 정규화한다.
7. stage 직후 별도 shell command로 git status --short와 git diff --cached --name-status -M을 확인한다. 예상 범위와 다르면 pr:finish를 실행하지 않고 중단한다.
8. create mode에서는 ${tempDir}/issue-result.md와 ${tempDir}/pr-body.md를 작성한다. update mode에서는 갱신이 필요할 때만 해당 파일을 작성한다.
9. 빠른 Issue(본문에 <!-- planb:quick-issue --> marker가 있음)라면 ${tempDir}/issue-body.md도 작성한다. 정식 Issue라면 기존 요구사항을 보존하며 issue-body.md를 만들지 않는다.
10. PR 본문은 .github/pull_request_template.md를 따르고 실행한 검증 결과와 Closes #번호를 포함한다.
11. stage와 cached diff 확인이 끝난 뒤, 이들과 결합하지 않은 별도 shell command로 pnpm pr:finish를 필요한 인자와 파일 경로로 정확히 한 번 실행한다.
12. ${tempDir}/git-checkpoint.json이 있으면 기록된 phase와 현재 staged/working tree 상태를 먼저 확인한다. 상태가 유효하면 새 변경사항을 stage하거나 이미 성공한 검증을 반복하지 말고 기존 Markdown과 동일한 인자로 pr:finish를 실행해 재개한다. 상태가 다르면 checkpoint를 삭제하거나 자동 복구하지 말고 중단한다.

필수 제약:
- 직접 git commit, git push, git switch, git checkout, git rebase, git reset, gh issue edit, gh pr create를 실행하지 않는다.
- force push, dev/main 직접 push, 기존 commit history 수정, 작업 범위 밖 파일 수정은 금지한다.
- pr:finish의 검증을 우회하지 않는다.
- rebase가 필요하거나 충돌 가능성이 있으면 자동 해결하지 말고 중단해 사용자에게 상태를 설명한다.
- API key나 token을 파일 또는 출력에 기록하지 않는다.

create mode pr:finish 예시:
pnpm pr:finish --mode create --issue 42 --type feat --subject "작업 요약" --slug english-slug --issue-result-file ${tempDir}/issue-result.md --pr-body-file ${tempDir}/pr-body.md

update mode pr:finish 예시:
pnpm pr:finish --mode update --pr ${existingPr?.number || "PR번호"} --issue 42 --type fix --subject "리뷰 피드백 반영"

빠른 Issue에는 위 명령에 --issue-body-file ${tempDir}/issue-body.md를 추가한다.`;
}
