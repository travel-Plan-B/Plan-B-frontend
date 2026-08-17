import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { clearActiveIssue, readActiveIssue } from "./lib/active-issue.mjs";
import {
  assertAllowedArgs,
  assertGhReady,
  assertRepository,
  confirmDefaultYes,
  currentBranch,
  fail,
  inspectPrsForBranch,
  getIssueInfo,
  issueReferencesFromPr,
  outputOf,
  parseArgs,
  parseBranch,
  prompt,
  QUICK_ISSUE_MARKER,
  run,
} from "./lib/git-github.mjs";
import { buildPrAgentPrompt } from "./lib/pr-agent-prompt.mjs";
import {
  CompletionMarkerError,
  finalizeCompletedRun,
} from "./lib/completion-marker.mjs";
import { determineRequiredChecks } from "./lib/validation-policy.mjs";

const workflowStartedAt = performance.now();

const AGENTS = ["codex", "claude", "copilot"];
const args = parseArgs(process.argv.slice(2));
assertAllowedArgs(args, ["agent", "issue", "help"]);

if (args.help) {
  console.log("pnpm pr [--agent codex|claude|copilot] [--issue 42]");
  process.exit(0);
}

assertRepository();
assertGhReady();

async function selectAgent() {
  const configured = args.agent || process.env.PLANB_PR_AGENT;
  if (configured) return configured.trim().toLowerCase();
  console.log("? 사용할 PR 에이전트:");
  console.log("  1) codex");
  console.log("  2) claude");
  console.log("  3) copilot");
  const selection = await prompt("선택 [1/2/3]");
  return AGENTS[Number(selection) - 1];
}

const agent = await selectAgent();
if (!AGENTS.includes(agent)) {
  fail(
    `지원하지 않는 agent입니다: ${agent || "입력 없음"}\n사용 가능: ${AGENTS.join(", ")}`,
  );
}

if (
  args.issue &&
  (!Number.isInteger(Number(args.issue)) || Number(args.issue) <= 0)
) {
  fail("--issue에는 올바른 Issue 번호를 입력해 주세요.");
}

async function promptForIssueNumber() {
  const issueNumber = Number(await prompt("연결할 Issue 번호를 입력해 주세요"));
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    fail("Issue 번호를 확인할 수 없습니다. 올바른 번호를 입력해 주세요.");
  }
  return issueNumber;
}

function validateOpenIssue(issueNumber) {
  const issue = getIssueInfo(issueNumber);
  if (!issue)
    fail(`Issue #${issueNumber}를 현재 repository에서 찾을 수 없습니다.`);
  if (issue.state !== "OPEN")
    fail(`Issue #${issueNumber}가 open 상태가 아닙니다.`);
  return issue;
}

let confirmedIssue = args.issue ? Number(args.issue) : undefined;
const branch = currentBranch();
const branchIssue = parseBranch(branch)?.issue;
let mode = "create";
let existingPr = null;
if (branch !== "dev") {
  const prState = inspectPrsForBranch(branch);
  existingPr = prState.openPr;
  if (existingPr) {
    if (existingPr.baseRefName !== "dev") {
      fail(
        `기존 PR #${existingPr.number}의 base가 dev가 아닙니다: ${existingPr.baseRefName}`,
      );
    }
    if (existingPr.headRefName !== branch) {
      fail(
        `기존 PR #${existingPr.number}의 head ${existingPr.headRefName}가 현재 브랜치 ${branch}와 다릅니다.`,
      );
    }
    mode = "update";
    console.log(`✓ 기존 PR #${existingPr.number} 확인: ${existingPr.url}`);
  } else {
    const priorPullRequests = [prState.priorPr].filter(Boolean);
    if (priorPullRequests.length > 0) {
      fail(
        `현재 브랜치에는 open PR이 없지만 기존 ${priorPullRequests[0].state} PR #${priorPullRequests[0].number}이 있습니다. 새 브랜치를 사용해 주세요.`,
      );
    }
  }
}
if (mode === "create") console.log("✓ 최초 PR 생성 mode로 진행합니다.");

const prIssueReferences = existingPr
  ? issueReferencesFromPr(existingPr.body)
  : [];
if (prIssueReferences.length > 1) {
  fail(
    `기존 PR #${existingPr.number}에 서로 다른 Issue가 연결되어 있습니다: ${prIssueReferences.map((issue) => `#${issue}`).join(", ")}`,
  );
}
const prIssue = prIssueReferences[0];
const knownIssues = [
  args.issue ? Number(args.issue) : undefined,
  branchIssue,
  prIssue,
].filter(Boolean);
if (new Set(knownIssues).size > 1) {
  fail(
    `Issue 번호가 일치하지 않습니다. 명시값/브랜치/PR: ${knownIssues.map((issue) => `#${issue}`).join(", ")}`,
  );
}
confirmedIssue ||= branchIssue || prIssue;
if (confirmedIssue) {
  validateOpenIssue(confirmedIssue);
  const source = args.issue
    ? "명시된"
    : branchIssue
      ? "현재 브랜치의"
      : "기존 PR의";
  console.log(`✓ ${source} Issue #${confirmedIssue}을 사용합니다.`);
  const activeIssue = readActiveIssue();
  if (activeIssue && activeIssue.issue !== confirmedIssue) {
    console.log(`ℹ active Issue #${activeIssue.issue}은 사용하지 않습니다.`);
  }
} else {
  const activeIssue = readActiveIssue();
  if (activeIssue) {
    const issue = getIssueInfo(activeIssue.issue);
    const isValidQuickIssue =
      issue?.state === "OPEN" && issue.body.includes(QUICK_ISSUE_MARKER);
    if (!isValidQuickIssue) {
      clearActiveIssue(activeIssue.issue);
      console.log(
        `ℹ stale active Issue #${activeIssue.issue} 정보를 정리했습니다.`,
      );
    } else {
      console.log(
        `✓ 최근 quick Issue를 찾았습니다.\n\n#${issue.number} ${issue.title}`,
      );
      if (await confirmDefaultYes(`#${issue.number}을 사용하시겠습니까?`)) {
        confirmedIssue = issue.number;
        console.log(`✓ Issue #${confirmedIssue} 확정`);
      }
    }
  }
  if (!confirmedIssue) {
    confirmedIssue = await promptForIssueNumber();
    const issue = validateOpenIssue(confirmedIssue);
    if (
      !(await confirmDefaultYes(
        `#${issue.number} ${issue.title}을 사용하시겠습니까?`,
      ))
    ) {
      fail("Issue 연결을 취소했습니다.");
    }
    console.log(`✓ Issue #${confirmedIssue} 확정`);
  }
}

const cwd = process.cwd();
const tempDir = ".tmp/planb-pr";
const absoluteTempDir = resolve(cwd, tempDir);
const finishedFile = resolve(absoluteTempDir, "finished.json");
const gitCheckpointFile = resolve(absoluteTempDir, "git-checkpoint.json");
mkdirSync(absoluteTempDir, { recursive: true });
if (existsSync(finishedFile)) rmSync(finishedFile);
process.env.PLANB_PR_FINISHED_FILE = finishedFile;
process.env.PLANB_PR_GIT_CHECKPOINT_FILE = gitCheckpointFile;

const stagedFiles = outputOf("git", ["diff", "--cached", "--name-only"])
  .split(/\r?\n/u)
  .filter(Boolean);
const unstagedFiles = outputOf("git", ["diff", "--name-only"])
  .split(/\r?\n/u)
  .filter(Boolean);
const untrackedFiles = outputOf("git", [
  "ls-files",
  "--others",
  "--exclude-standard",
])
  .split(/\r?\n/u)
  .filter(Boolean);
const changedFiles = [
  ...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles]),
];
const validationPolicy = determineRequiredChecks(changedFiles, { mode });
const cachedDevRelation =
  branch === "dev"
    ? "현재 dev 브랜치"
    : run("git", ["merge-base", "--is-ancestor", "origin/dev", "HEAD"], {
          allowFailure: true,
        }).status === 0
      ? "cached origin/dev 포함"
      : "cached origin/dev 미포함 또는 ref 없음";

const { runAgent } = await import(`./lib/agents/${agent}.mjs`);
const agentPrompt = buildPrAgentPrompt({
  issue: confirmedIssue,
  tempDir,
  mode,
  existingPr,
  context: {
    branch,
    base: "dev",
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    cachedDevRelation,
    validationPolicy,
  },
});

console.log(`✓ ${agent} agent를 실행합니다.`);
console.log(
  `ℹ 사전 확인: ${((performance.now() - workflowStartedAt) / 1000).toFixed(1)}s`,
);
const agentStartedAt = performance.now();
runAgent({ prompt: agentPrompt, cwd });
console.log(
  `ℹ Agent 실행: ${((performance.now() - agentStartedAt) / 1000).toFixed(1)}s`,
);

if (!existsSync(finishedFile)) {
  fail(
    `Agent가 PR 마무리를 완료하지 않았습니다. 진단 및 재시도를 위해 ${tempDir} 파일을 보존합니다.`,
  );
}

let finalization;
try {
  finalization = finalizeCompletedRun({
    markerContent: readFileSync(finishedFile, "utf8"),
    expectedIssue: confirmedIssue,
    clearActiveIssue,
    cleanup: () => rmSync(absoluteTempDir, { recursive: true, force: true }),
  });
} catch (error) {
  if (error instanceof CompletionMarkerError) {
    fail(`${error.message}\n재시도를 위해 ${tempDir} 파일을 보존합니다.`);
  }
  throw error;
}

if (finalization.activeIssueCleared) {
  console.log(
    `✓ active Issue #${finalization.marker.issue} 정보를 정리했습니다.`,
  );
}
console.log("✓ 임시 PR 작성 파일을 정리했습니다.");
console.log(
  `ℹ pnpm pr 총 소요 시간: ${((performance.now() - workflowStartedAt) / 1000).toFixed(1)}s`,
);
