import {
  clearActiveIssue,
  readActiveIssue,
  writeActiveIssue,
} from "./lib/active-issue.mjs";
import {
  assertDevIsCurrent,
  assertGhReady,
  assertAllowedArgs,
  assertRepository,
  branchExists,
  chooseIssueMode,
  chooseType,
  currentBranch,
  fail,
  hasWorkingTreeChanges,
  getIssueInfo,
  outputOf,
  parseArgs,
  prompt,
  QUICK_ISSUE_MARKER,
  remoteBranchExists,
  run,
  validateSlug,
} from "./lib/git-github.mjs";

const args = parseArgs(process.argv.slice(2));
assertAllowedArgs(args, ["branch", "help", "mode", "type", "title", "slug"]);

if (args.help) {
  console.log(
    'pnpm issue [--mode quick|direct] [--branch] [--type feat] [--title "작업 제목"] [--slug english-summary]',
  );
  process.exit(0);
}

assertRepository();
assertGhReady();

const mode = await chooseIssueMode(args.mode);
if (mode === "quick" && args.branch) {
  fail(
    "빠른 생성은 --branch와 함께 사용할 수 없습니다. Issue만 만든 뒤 dev에서 작업하고, pnpm pr에서 정식 작업 브랜치를 생성해 주세요.",
  );
}
if (mode === "quick" && (args.type || args.title || args.slug)) {
  fail("빠른 생성에서는 --type, --title, --slug 옵션을 사용하지 않습니다.");
}

if (mode === "quick") {
  const activeIssue = readActiveIssue();
  if (activeIssue) {
    const existingIssue = getIssueInfo(activeIssue.issue);
    const isValidQuickIssue =
      existingIssue?.state === "OPEN" &&
      existingIssue.body.includes(QUICK_ISSUE_MARKER);
    if (!isValidQuickIssue) {
      clearActiveIssue(activeIssue.issue);
      console.log(
        `ℹ stale active Issue #${activeIssue.issue} 정보를 정리했습니다.`,
      );
    } else {
      console.log(`⚠ 아직 active Issue #${activeIssue.issue}이 남아 있습니다.`);
      console.log("  1) 기존 Issue 유지");
      console.log("  2) 새 quick Issue 생성 후 교체");
      console.log("  3) 취소");
      const selection = await prompt("선택 [1/2/3]");
      if (selection === "1") {
        console.log(`✓ active Issue #${activeIssue.issue}을 유지합니다.`);
        console.log(`✓ ${existingIssue.url}`);
        process.exit(0);
      }
      if (selection !== "2") {
        fail(
          selection === "3"
            ? "Issue 생성을 취소했습니다."
            : "1, 2, 3 중 하나를 선택해 주세요.",
        );
      }
    }
  }
}

let type;
let title;
if (mode === "direct") {
  type = await chooseType(args.type);
  title = (args.title || (await prompt("작업 제목"))).trim();
  if (!title) fail("작업 제목은 비워둘 수 없습니다.");
}

let slug;
if (args.branch) {
  if (currentBranch() !== "dev")
    fail("--branch는 dev 브랜치에서만 사용할 수 있습니다.");
  if (hasWorkingTreeChanges())
    fail("working tree에 변경사항이 있습니다. 정리한 뒤 다시 시도해 주세요.");
  assertDevIsCurrent();
  slug = validateSlug(
    args.slug || (await prompt("브랜치 영문 요약 (예: calendar-component)")),
  );
}

const typeLabel = type ? type[0].toUpperCase() + type.slice(1) : null;
const issueTitle =
  mode === "quick" ? "[WIP] 작업 예정" : `[${typeLabel}] ${title}`;
const issueBody =
  mode === "quick"
    ? `${QUICK_ISSUE_MARKER}\n\n작업 완료 후 실제 작업 내용을 기준으로 업데이트합니다.`
    : `## 작업 내용\n\n- [ ] ${title}\n\n## 완료 조건\n\n- [ ] 작업 결과를 확인한다.\n\n## 참고\n\n<!-- 디자인, API 명세, 관련 논의가 있으면 작성 -->`;
const issueUrl = outputOf("gh", [
  "issue",
  "create",
  "--title",
  issueTitle,
  "--body",
  issueBody,
]);
const issueMatch = /\/issues\/(\d+)\/?$/u.exec(issueUrl);
if (!issueMatch) fail(`생성된 Issue 번호를 확인할 수 없습니다: ${issueUrl}`);

const issueNumber = Number(issueMatch[1]);
console.log(`\n✓ Issue #${issueNumber} 생성`);
console.log(`✓ ${issueUrl}`);

if (mode === "quick") {
  try {
    writeActiveIssue(issueNumber);
  } catch (error) {
    fail(
      `Issue #${issueNumber}는 생성되었지만 active Issue 저장에 실패했습니다.\n${error.message}`,
    );
  }
  console.log(`✓ 현재 작업 Issue로 #${issueNumber} 저장`);
}

if (args.branch) {
  const branch = `${type}/${issueNumber}-${slug}`;
  if (branchExists(branch))
    fail(`동일한 로컬 브랜치가 이미 존재합니다: ${branch}`);
  if (remoteBranchExists(branch))
    fail(`동일한 원격 브랜치가 이미 존재합니다: origin/${branch}`);
  run("git", ["switch", "-c", branch], { inherit: true });
  console.log(`✓ ${branch} 브랜치 생성 및 이동 완료`);
}
