import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  assertBranchContainsLatestDev,
  assertDevIsCurrent,
  assertGhReady,
  assertAllowedArgs,
  assertNoPriorPrForBranch,
  assertRepository,
  branchExists,
  chooseType,
  confirm,
  currentBranch,
  fail,
  findOpenPrForBranch,
  hasWorkingTreeChanges,
  issueInfo,
  issueReferencesFromPr,
  outputOf,
  parseArgs,
  parseBranch,
  prompt,
  QUICK_ISSUE_MARKER,
  remoteBranchExists,
  run,
  validateSlug,
} from "./lib/git-github.mjs";
import { executePrTransaction } from "./lib/pr-transaction.mjs";
import {
  parseStagedNameStatus,
  runRequiredChecks,
} from "./lib/validation-policy.mjs";

const workflowStartedAt = performance.now();

const args = parseArgs(process.argv.slice(2));
assertAllowedArgs(args, [
  "help",
  "mode",
  "pr",
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
    'pnpm pr:finish [--mode create|update] [--pr 52] [--issue 42] [--type feat] [--subject "작업 요약"] [--slug english-summary] [--issue-result "작업 결과"] [--issue-result-file path] [--issue-body-file path] [--pr-body-file path]',
  );
  process.exit(0);
}

assertRepository();
assertGhReady();

function resolveCheckpointFile(value, expectedName) {
  if (!value) return null;
  const file = resolve(value);
  const allowedDirectory = resolve(process.cwd(), ".tmp", "planb-pr");
  const relativePath = relative(allowedDirectory, file);
  if (
    relativePath.startsWith("..") ||
    relativePath === "" ||
    relativePath !== expectedName
  ) {
    fail(`PR ${expectedName} 경로가 허용된 임시 디렉터리 밖에 있습니다.`);
  }
  return file;
}

const gitCheckpointFile = resolveCheckpointFile(
  process.env.PLANB_PR_GIT_CHECKPOINT_FILE,
  "git-checkpoint.json",
);
let gitCheckpoint = null;
if (gitCheckpointFile && existsSync(gitCheckpointFile)) {
  try {
    gitCheckpoint = JSON.parse(readFileSync(gitCheckpointFile, "utf8"));
  } catch {
    fail("Git checkpoint가 손상되었습니다. 파일을 확인해 주세요.");
  }
}

function logCheckpointRecovery() {
  if (!gitCheckpointFile) return;
  console.error(
    `ℹ 실패 복구 checkpoint: ${gitCheckpointFile}\n` +
      "  복구: 같은 pnpm pr:finish 명령을 다시 실행하세요.\n" +
      "  초기화: commit 전 started 단계라면 pnpm pr --reset-checkpoint를 실행하세요.",
  );
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stagedFingerprint() {
  return fingerprint(
    outputOf("git", ["diff", "--cached", "--binary", "--no-ext-diff"]),
  );
}

function workingTreeFingerprint() {
  return fingerprint(
    outputOf("git", ["status", "--porcelain=v1", "--untracked-files=all"]),
  );
}
if (gitCheckpoint) logCheckpointRecovery();

let branch = currentBranch();
let branchData = parseBranch(branch);
const openPr = branch === "dev" ? null : findOpenPrForBranch(branch);
const isPrCompletedRecovery = gitCheckpoint?.phase === "prCompleted";
const mode = args.mode || (openPr ? "update" : "create");
if (!["create", "update"].includes(mode)) {
  fail("--mode는 create 또는 update여야 합니다.");
}
if (mode === "create" && args.pr && !isPrCompletedRecovery) {
  fail("create mode에서는 --pr 옵션을 사용할 수 없습니다.");
}
if (isPrCompletedRecovery) {
  if (!openPr) {
    fail(
      "prCompleted checkpoint의 open PR을 현재 브랜치에서 찾을 수 없습니다.",
    );
  }
  if (openPr.baseRefName !== "dev" || openPr.headRefName !== branch) {
    fail(
      `PR #${openPr.number}의 base/head가 예상한 dev ← ${branch}와 다릅니다.`,
    );
  }
  if (
    openPr.number !== gitCheckpoint.prNumber ||
    openPr.url !== gitCheckpoint.prUrl ||
    (args.pr && Number(args.pr) !== gitCheckpoint.prNumber)
  ) {
    fail(
      `prCompleted checkpoint의 PR #${gitCheckpoint.prNumber}과 현재 PR #${openPr.number} 정보가 다릅니다.`,
    );
  }
  console.log(`✓ prCompleted 복구: 기존 PR #${openPr.number} 확인`);
} else if (mode === "update") {
  if (!openPr)
    fail("update mode이지만 현재 브랜치의 open PR을 찾을 수 없습니다.");
  if (openPr.baseRefName !== "dev" || openPr.headRefName !== branch) {
    fail(
      `PR #${openPr.number}의 base/head가 예상한 dev ← ${branch}와 다릅니다.`,
    );
  }
  if (args.pr && Number(args.pr) !== openPr.number) {
    fail(
      `입력한 PR #${args.pr}과 현재 브랜치의 PR #${openPr.number}이 다릅니다.`,
    );
  }
  console.log(`✓ update mode: 기존 PR #${openPr.number} 확인`);
} else {
  if (openPr) {
    fail(
      `create mode이지만 현재 브랜치에 open PR #${openPr.number}이 있습니다.`,
    );
  }
  console.log("✓ create mode: 최초 PR을 생성합니다.");
}

const prIssueReferences = openPr ? issueReferencesFromPr(openPr.body) : [];
if (prIssueReferences.length > 1) {
  fail(`PR #${openPr.number}에 서로 다른 Issue 번호가 연결되어 있습니다.`);
}
const knownIssues = [
  args.issue ? Number(args.issue) : undefined,
  branchData?.issue,
  prIssueReferences[0],
].filter(Boolean);
if (new Set(knownIssues).size > 1) {
  fail(
    `Issue 번호가 일치하지 않습니다: ${knownIssues.map((issue) => `#${issue}`).join(", ")}`,
  );
}
const issueWasInferred = knownIssues.length === 0;
let issueNumber = knownIssues[0];
if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
  issueNumber = Number(await prompt("연결할 Issue 번호"));
}
if (!Number.isInteger(issueNumber) || issueNumber <= 0)
  fail("올바른 Issue 번호를 입력해 주세요.");

const issue = issueInfo(issueNumber);
const isQuickIssue = issue.body.includes(QUICK_ISSUE_MARKER);
console.log(`✓ Issue #${issue.number} 확인: ${issue.title}`);
if (isQuickIssue) console.log("✓ 빠른 생성 Issue로 확인");
if (issueWasInferred && !(await confirm("이 Issue가 맞습니까?"))) {
  fail("Issue 연결을 취소했습니다.");
}

let type = branchData?.type;
if (type && args.type && type !== args.type) {
  fail(`브랜치 type ${type}과 입력한 type ${args.type}이 다릅니다.`);
}
if (mode === "update") {
  if (branch === "dev" || !branchData) {
    fail(
      "update mode은 규칙에 맞는 기존 작업 브랜치에서만 실행할 수 있습니다.",
    );
  }
  assertBranchContainsLatestDev();
} else if (branch === "dev") {
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

if (mode === "create" && !isPrCompletedRecovery) {
  assertNoPriorPrForBranch(branch);
}

if (gitCheckpoint) {
  const expectedPrNumber = openPr?.number;
  const recoveredCreateAsUpdate =
    isPrCompletedRecovery &&
    gitCheckpoint.mode === "create" &&
    mode === "update";
  if (
    (gitCheckpoint.mode !== mode && !recoveredCreateAsUpdate) ||
    gitCheckpoint.branch !== branch ||
    gitCheckpoint.issue !== issueNumber ||
    gitCheckpoint.prNumber !== expectedPrNumber ||
    !["started", "committed", "pushed", "prCompleted"].includes(
      gitCheckpoint.phase,
    )
  ) {
    fail(
      "Git checkpoint가 현재 mode/브랜치/Issue/PR과 일치하지 않습니다. 자동 재개하지 않습니다.",
    );
  }
  const head = outputOf("git", ["rev-parse", "HEAD"]);
  if (gitCheckpoint.commit !== head) {
    fail(
      "Git checkpoint의 commit이 현재 HEAD와 일치하지 않습니다. 자동 재개하지 않습니다.",
    );
  }
  if (["pushed", "prCompleted"].includes(gitCheckpoint.phase)) {
    const remoteHead = outputOf("git", ["rev-parse", `origin/${branch}`], {
      allowFailure: true,
    });
    if (remoteHead !== head) {
      fail("push checkpoint의 commit이 원격 브랜치와 일치하지 않습니다.");
    }
  }
  if (
    gitCheckpoint.workingTreeFingerprint &&
    gitCheckpoint.workingTreeFingerprint !== workingTreeFingerprint()
  ) {
    fail(
      "Git checkpoint 이후 working tree 상태가 변경되었습니다. 자동 재개하지 않습니다.",
    );
  }
  console.log(`✓ Git ${gitCheckpoint.phase} checkpoint 확인: ${head}`);
}

const treatAsQuickIssue = isQuickIssue || gitCheckpoint?.wasQuickIssue;
if (!treatAsQuickIssue && args["issue-body-file"]) {
  fail("--issue-body-file은 빠른 생성 Issue에만 사용할 수 있습니다.");
}

if (mode === "update") {
  const upstreamResult = run(
    "git",
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
    { allowFailure: true },
  );
  const upstream = upstreamResult.stdout.trim();
  if (upstreamResult.status !== 0 || upstream !== `origin/${branch}`) {
    fail(
      `현재 브랜치의 upstream이 origin/${branch}가 아닙니다: ${upstream || "없음"}`,
    );
  }
}

const stagedStatus = outputOf("git", [
  "diff",
  "--cached",
  "--name-status",
  "-M",
]);
const stagedChanges = parseStagedNameStatus(stagedStatus);
const canResumeBeforeCommit = gitCheckpoint?.phase === "started";
if (gitCheckpoint && !canResumeBeforeCommit && stagedStatus) {
  fail("재개 중에는 새 staged 변경사항이 없어야 합니다.");
}
if ((!gitCheckpoint || canResumeBeforeCommit) && !stagedStatus) {
  fail(
    "staged 변경사항이 없습니다. AI 에이전트가 작업 범위를 검토해 관련 파일만 git add한 뒤 다시 실행해 주세요.",
  );
}

const currentStagedFingerprint = stagedStatus ? stagedFingerprint() : null;
if (
  canResumeBeforeCommit &&
  gitCheckpoint.stagedFingerprint &&
  gitCheckpoint.stagedFingerprint !== currentStagedFingerprint
) {
  fail(
    "Git checkpoint의 staged 상태와 현재 staged diff가 다릅니다. 자동 재개하지 않습니다.",
  );
}
const canReuseCompletedChecks = Boolean(
  canResumeBeforeCommit &&
    gitCheckpoint.checksCompleted &&
    gitCheckpoint.stagedFingerprint === currentStagedFingerprint,
);

if (!gitCheckpoint || (canResumeBeforeCommit && !canReuseCompletedChecks)) {
  runRequiredChecks(stagedChanges, { mode });
} else if (canReuseCompletedChecks) {
  console.log("✓ staged 상태가 checkpoint와 일치해 완료된 검증을 재사용합니다.");
}

const validatedStagedFingerprint = currentStagedFingerprint;

const subject = (args.subject || (await prompt("commit/PR 작업 요약"))).trim();
if (!subject || subject.endsWith("."))
  fail("작업 요약은 비워둘 수 없고 마침표로 끝날 수 없습니다.");
const commitMessage = `${type}: ${subject} (#${issueNumber})`;
if (gitCheckpoint && gitCheckpoint.commitMessage !== commitMessage) {
  fail(
    "재개 시 commit/PR subject와 type은 기존 push checkpoint와 같아야 합니다.",
  );
}

let prBody;
if (args["pr-body-file"]) {
  prBody = readFileSync(args["pr-body-file"], "utf8").trim();
  if (!prBody) fail("PR 본문 파일이 비어 있습니다.");
} else if (mode === "create") {
  prBody = `## 작업 내용\n\n- ${subject}\n\n## 주요 변경 사항\n\n- ${subject}\n\n## 검증\n\n- [ ] self review를 완료했다.\n- [ ] 필요한 lint/build/test를 실행했다.\n- 검증 결과:\n\n## 관련 Issue\n\nCloses #${issueNumber}\n\n## 리뷰 참고\n\n- 없음`;
}
if (prBody) {
  const bodyIssueReferences = issueReferencesFromPr(prBody);
  if (bodyIssueReferences.some((reference) => reference !== issueNumber)) {
    fail(
      `PR 본문의 Issue 번호가 확정된 Issue #${issueNumber}와 일치하지 않습니다: ${bodyIssueReferences.map((reference) => `#${reference}`).join(", ")}`,
    );
  }
  if (bodyIssueReferences.length === 0) {
    prBody = `${prBody}\n\nCloses #${issueNumber}`;
  }
}

let issueResult;
if (args["issue-result-file"]) {
  issueResult = readFileSync(args["issue-result-file"], "utf8").trim();
} else if (args["issue-result"]) {
  issueResult = args["issue-result"].trim();
} else if (mode === "create" || treatAsQuickIssue) {
  issueResult = (await prompt("Issue에 추가할 작업 결과")).trim();
}
if ((mode === "create" || treatAsQuickIssue) && !issueResult) {
  fail("Issue 작업 결과는 비워둘 수 없습니다.");
}

let issueEditArgs = null;
let issueUpdateMessage;
if (issueResult) {
  const marker = "## 작업 결과";
  let issueBody;
  if (treatAsQuickIssue) {
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
  issueEditArgs = ["issue", "edit", String(issueNumber)];
  if (treatAsQuickIssue) {
    const typeLabel = type[0].toUpperCase() + type.slice(1);
    issueEditArgs.push("--title", `[${typeLabel}] ${subject}`);
  }
  issueEditArgs.push("--body", issueBody);
  issueUpdateMessage = treatAsQuickIssue
    ? `✓ Issue #${issueNumber} 제목과 본문 정식화`
    : `✓ Issue #${issueNumber} 작업 결과 갱신`;
} else {
  issueUpdateMessage = `ℹ Issue #${issueNumber} 본문은 변경하지 않습니다.`;
}
if (gitCheckpoint?.phase === "pushed") {
  console.log(
    "✓ 기존 commit/push 완료 상태에서 원격 메타데이터 작업을 재개합니다.",
  );
}

const transaction = executePrTransaction({
  checkpoint: gitCheckpoint,
  checkpointData: () => ({
    mode,
    branch,
    issue: issueNumber,
    prNumber: openPr?.number,
    commit: outputOf("git", ["rev-parse", "HEAD"]),
    commitMessage,
    wasQuickIssue: isQuickIssue,
    checksCompleted: true,
    stagedFingerprint: validatedStagedFingerprint,
    workingTreeFingerprint: workingTreeFingerprint(),
  }),
  persistCheckpoint: (checkpoint) => {
    if (gitCheckpointFile) {
      writeFileSync(
        gitCheckpointFile,
        `${JSON.stringify(checkpoint)}\n`,
        "utf8",
      );
      if (checkpoint.phase === "started") logCheckpointRecovery();
    }
  },
  clearCheckpoint: () => {
    if (gitCheckpointFile) rmSync(gitCheckpointFile, { force: true });
  },
  onFailure: () => logCheckpointRecovery(),
  commit: () => {
    run("git", ["commit", "-m", commitMessage], { inherit: true });
    console.log("✓ commit 완료");
  },
  push: () => {
    if (mode === "update") {
      run("git", ["push"], { inherit: true });
    } else {
      run("git", ["push", "-u", "origin", branch], { inherit: true });
    }
    console.log("✓ push 완료");
  },
  updateIssue: () => {
    if (issueEditArgs) run("gh", issueEditArgs, { inherit: true });
    console.log(issueUpdateMessage);
  },
  updatePr: () => {
    if (mode === "update") {
      const prUrl = openPr.url;
      const prNumber = openPr.number;
      if (prBody) {
        run("gh", ["pr", "edit", String(prNumber), "--body", prBody], {
          inherit: true,
        });
        console.log(`✓ PR #${prNumber} 본문 갱신`);
      } else {
        console.log(`ℹ PR #${prNumber} 본문은 변경하지 않습니다.`);
      }
      console.log(`\n✓ PR #${prNumber} 업데이트 완료`);
      return { prUrl, prNumber };
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
    const prMatch = /\/pull\/(\d+)\/?$/u.exec(prUrl);
    const prNumber = prMatch ? Number(prMatch[1]) : undefined;
    console.log(`\n✓ PR${prNumber ? ` #${prNumber}` : ""} 생성 완료`);
    return { prUrl, prNumber };
  },
});
const { prUrl, prNumber } = transaction.pr;
const completedMode = transaction.checkpoint.mode || mode;
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
    `${JSON.stringify({ issue: issueNumber, mode: completedMode, prNumber, prUrl })}\n`,
    "utf8",
  );
}
console.log(
  `ℹ pr:finish 총 소요 시간: ${((performance.now() - workflowStartedAt) / 1000).toFixed(1)}s`,
);
