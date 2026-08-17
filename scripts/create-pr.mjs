import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  assertBranchContainsLatestDev,
  assertDevIsCurrent,
  assertGhReady,
  assertAllowedArgs,
  assertNoExistingPr,
  assertRepository,
  branchExists,
  chooseType,
  confirm,
  currentBranch,
  fail,
  hasWorkingTreeChanges,
  issueInfo,
  outputOf,
  parseArgs,
  parseBranch,
  prompt,
  QUICK_ISSUE_MARKER,
  remoteBranchExists,
  run,
  validateSlug,
} from "./lib/git-github.mjs";

const args = parseArgs(process.argv.slice(2));
assertAllowedArgs(args, [
  "help",
  "issue",
  "type",
  "subject",
  "slug",
  "issue-result",
  "issue-result-file",
  "issue-body-file",
  "pr-body-file",
]);
if (args["issue-result"] && args["issue-result-file"]) {
  fail("--issue-result와 --issue-result-file은 함께 사용할 수 없습니다.");
}

if (args.help) {
  console.log(
    'pnpm pr:finish [--issue 42] [--type feat] [--subject "작업 요약"] [--slug english-summary] [--issue-result "작업 결과"] [--issue-result-file path] [--issue-body-file path] [--pr-body-file path]',
  );
  process.exit(0);
}

assertRepository();
assertGhReady();

let branch = currentBranch();
let branchData = parseBranch(branch);
const issueWasInferred = !args.issue && !branchData?.issue;
let issueNumber = args.issue ? Number(args.issue) : branchData?.issue;
if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
  issueNumber = Number(await prompt("연결할 Issue 번호"));
}
if (!Number.isInteger(issueNumber) || issueNumber <= 0)
  fail("올바른 Issue 번호를 입력해 주세요.");
if (branchData && args.issue && branchData.issue !== issueNumber) {
  fail(
    `브랜치의 Issue #${branchData.issue}와 입력한 Issue #${issueNumber}가 다릅니다.`,
  );
}

const issue = issueInfo(issueNumber);
const isQuickIssue = issue.body.includes(QUICK_ISSUE_MARKER);
console.log(`✓ Issue #${issue.number} 확인: ${issue.title}`);
if (isQuickIssue) console.log("✓ 빠른 생성 Issue로 확인");
if (!isQuickIssue && args["issue-body-file"]) {
  fail("--issue-body-file은 빠른 생성 Issue에만 사용할 수 있습니다.");
}
if (issueWasInferred && !(await confirm("이 Issue가 맞습니까?"))) {
  fail("Issue 연결을 취소했습니다.");
}

let type = branchData?.type;
if (type && args.type && type !== args.type) {
  fail(`브랜치 type ${type}과 입력한 type ${args.type}이 다릅니다.`);
}
if (branch === "dev") {
  if (!hasWorkingTreeChanges()) fail("commit할 변경사항이 없습니다.");
  assertDevIsCurrent();
  type = await chooseType(args.type);
  const slug = validateSlug(
    args.slug || (await prompt("브랜치 영문 요약 (예: calendar-component)")),
  );
  branch = `${type}/${issueNumber}-${slug}`;
  if (branchExists(branch))
    fail(`동일한 로컬 브랜치가 이미 존재합니다: ${branch}`);
  if (remoteBranchExists(branch))
    fail(`동일한 원격 브랜치가 이미 존재합니다: origin/${branch}`);
  run("git", ["switch", "-c", branch], { inherit: true });
  console.log(`✓ ${branch} 브랜치 생성 및 기존 변경사항 유지`);
} else if (!branchData) {
  fail(
    "현재 브랜치명이 <type>/<issue-number>-<kebab-summary> 규칙과 일치하지 않습니다.",
  );
} else {
  assertBranchContainsLatestDev();
}

assertNoExistingPr(branch);

const staged = outputOf("git", ["diff", "--cached", "--name-only"]);
if (!staged) {
  fail(
    "staged 변경사항이 없습니다. AI 에이전트가 작업 범위를 검토해 관련 파일만 git add한 뒤 다시 실행해 주세요.",
  );
}

const subject = (args.subject || (await prompt("commit/PR 작업 요약"))).trim();
if (!subject || subject.endsWith("."))
  fail("작업 요약은 비워둘 수 없고 마침표로 끝날 수 없습니다.");

const issueResult = args["issue-result-file"]
  ? readFileSync(args["issue-result-file"], "utf8").trim()
  : (args["issue-result"] || (await prompt("Issue에 추가할 작업 결과"))).trim();
if (!issueResult) fail("Issue 작업 결과는 비워둘 수 없습니다.");
const marker = "## 작업 결과";
let issueBody;
if (isQuickIssue) {
  issueBody = args["issue-body-file"]
    ? readFileSync(args["issue-body-file"], "utf8").trim()
    : `## 작업 내용\n\n- ${subject}\n\n## 완료 조건\n\n- [x] ${subject}\n\n## 작업 결과\n\n${issueResult}`;
  if (!issueBody) fail("Issue 본문 파일이 비어 있습니다.");
  if (!issueBody.includes(marker)) {
    issueBody = `${issueBody}\n\n${marker}\n\n${issueResult}`;
  }
} else {
  issueBody = issue.body.includes(marker)
    ? issue.body.replace(
        new RegExp(`${marker}[\\s\\S]*$`, "u"),
        `${marker}\n\n${issueResult}`,
      )
    : `${issue.body.trim()}\n\n${marker}\n\n${issueResult}`;
}
const issueEditArgs = ["issue", "edit", String(issueNumber)];
if (isQuickIssue) {
  const typeLabel = type[0].toUpperCase() + type.slice(1);
  issueEditArgs.push("--title", `[${typeLabel}] ${subject}`);
}
issueEditArgs.push("--body", issueBody);
run("gh", issueEditArgs, {
  inherit: true,
});
console.log(
  isQuickIssue
    ? `✓ Issue #${issueNumber} 제목과 본문 정식화`
    : `✓ Issue #${issueNumber} 작업 결과 갱신`,
);
const commitMessage = `${type}: ${subject} (#${issueNumber})`;
run("git", ["commit", "-m", commitMessage], { inherit: true });
run("git", ["push", "-u", "origin", branch], { inherit: true });

let prBody;
if (args["pr-body-file"]) {
  prBody = readFileSync(args["pr-body-file"], "utf8").trim();
  if (!prBody) fail("PR 본문 파일이 비어 있습니다.");
} else {
  prBody = `## 작업 내용\n\n- ${subject}\n\n## 주요 변경 사항\n\n- ${subject}\n\n## 검증\n\n- [ ] self review를 완료했다.\n- [ ] 필요한 lint/build/test를 실행했다.\n- 검증 결과:\n\n## 관련 Issue\n\nCloses #${issueNumber}\n\n## 리뷰 참고\n\n- 없음`;
}
if (
  !new RegExp(`(?:Closes|Fixes|Refs)\\s+#${issueNumber}\\b`, "iu").test(prBody)
) {
  prBody = `${prBody}\n\nCloses #${issueNumber}`;
}

const prUrl = outputOf("gh", [
  "pr",
  "create",
  "--base",
  "dev",
  "--head",
  branch,
  "--title",
  commitMessage,
  "--body",
  prBody,
]);
console.log(`\n✓ PR 생성 완료`);
console.log(`✓ ${prUrl}`);

if (process.env.PLANB_PR_FINISHED_FILE) {
  const finishedFile = resolve(process.env.PLANB_PR_FINISHED_FILE);
  const allowedDirectory = resolve(process.cwd(), ".tmp", "planb-pr");
  const relativePath = relative(allowedDirectory, finishedFile);
  if (relativePath.startsWith("..") || relativePath === "") {
    fail("PR 완료 marker 경로가 허용된 임시 디렉터리 밖에 있습니다.");
  }
  writeFileSync(
    finishedFile,
    `${JSON.stringify({ issue: issueNumber, prUrl })}\n`,
    "utf8",
  );
}
