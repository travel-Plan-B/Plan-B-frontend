import {
  existsSync,
  readFileSync,
  rmSync,
} from "node:fs";
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
  rawOutputOf,
  parseArgs,
  parseBranch,
  prompt,
  QUICK_ISSUE_MARKER,
  run,
  TYPES,
  validateSlug,
} from "./lib/git-github.mjs";
import {
  fingerprintRepositoryWorkingTree,
  getStagingSnapshotError,
} from "./lib/checkpoint-fingerprint.mjs";
import {
  buildAgentResultRepairPrompt,
  buildPrAgentPrompt,
} from "./lib/pr-agent-prompt.mjs";
import {
  CompletionMarkerError,
  finalizeCompletedRun,
} from "./lib/completion-marker.mjs";
import {
  determineRequiredChecks,
  normalizeGitPath,
  parseStagedNameStatus,
} from "./lib/validation-policy.mjs";
import { buildSafeAgentDiff } from "./lib/safe-agent-diff.mjs";
import {
  clearAgentArtifacts,
  getAgentMutationError,
  normalizeSubjectIssueSuffix,
  parseAgentResult,
  parsePrPlan,
  resolvePrMetadata,
  writeAgentArtifacts,
} from "./lib/pr-analysis.mjs";

const workflowStartedAt = performance.now();
const cwd = process.cwd();

const AGENTS = ["codex", "claude", "copilot"];
const args = parseArgs(process.argv.slice(2));
assertAllowedArgs(args, ["agent", "issue", "help", "reset-checkpoint"]);

if (args.help) {
  console.log(
    "pnpm pr [--agent codex|claude|copilot] [--issue 42] [--reset-checkpoint]",
  );
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
    let recoveringCompletedCreate = false;
    const checkpointHintFile = resolve(
      cwd,
      ".tmp",
      "planb-pr",
      "git-checkpoint.json",
    );
    if (existsSync(checkpointHintFile)) {
      try {
        const checkpointHint = JSON.parse(
          readFileSync(checkpointHintFile, "utf8"),
        );
        recoveringCompletedCreate =
          checkpointHint.phase === "prCompleted" &&
          checkpointHint.mode === "create" &&
          checkpointHint.branch === branch &&
          checkpointHint.prNumber === existingPr.number;
      } catch {
        // 정식 checkpoint 검증 단계에서 손상 오류를 보고한다.
      }
    }
    mode = recoveringCompletedCreate ? "create" : "update";
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

validateOpenIssue(confirmedIssue);

const tempDir = ".tmp/planb-pr";
const absoluteTempDir = resolve(cwd, tempDir);
const finishedFile = resolve(absoluteTempDir, "finished.json");
const gitCheckpointFile = resolve(absoluteTempDir, "git-checkpoint.json");
const prPlanFile = resolve(absoluteTempDir, "pr-plan.md");
const prBodyFile = resolve(absoluteTempDir, "pr-body.md");

function readJsonFile(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    fail(`${label} checkpoint가 손상되었습니다.`);
  }
}

function changesFingerprint() {
  return fingerprintRepositoryWorkingTree({
    cwd,
    gitOutput: (gitArgs) => rawOutputOf("git", gitArgs),
  });
}

if (args["reset-checkpoint"] && existsSync(gitCheckpointFile)) {
  const checkpoint = readJsonFile(gitCheckpointFile, "Git");
  const head = outputOf("git", ["rev-parse", "HEAD"]);
  if (checkpoint.phase !== "started" || checkpoint.commit !== head) {
    fail(
      "commit 전 started checkpoint이며 HEAD가 일치할 때만 자동화된 초기화가 가능합니다.",
    );
  }
  rmSync(gitCheckpointFile);
  console.log("✓ commit 전 Git checkpoint를 안전하게 초기화했습니다.");
} else if (args["reset-checkpoint"]) {
  console.log("ℹ 초기화할 Git checkpoint가 없습니다.");
}
process.env.PLANB_PR_FINISHED_FILE = finishedFile;
process.env.PLANB_PR_GIT_CHECKPOINT_FILE = gitCheckpointFile;

clearAgentArtifacts(absoluteTempDir);

const stagedChanges = parseStagedNameStatus(
  outputOf("git", ["diff", "--cached", "--name-status"]),
);
const stagedFiles = stagedChanges.map(({ path }) => normalizeGitPath(path));
const unstagedChanges = parseStagedNameStatus(
  outputOf("git", ["diff", "--name-status"]),
);
const unstagedFiles = unstagedChanges.map(({ path }) => normalizeGitPath(path));
const untrackedFiles = outputOf("git", [
  "ls-files",
  "--others",
  "--exclude-standard",
])
  .split(/\r?\n/u)
  .filter(Boolean)
  .map(normalizeGitPath);
const changedFiles = [
  ...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles]),
];
const validationPolicy = determineRequiredChecks(changedFiles, { mode });
const safeDiff = buildSafeAgentDiff({
  cwd,
  stagedChanges,
  unstagedChanges,
  untrackedFiles,
  gitOutput: (gitArgs) => rawOutputOf("git", gitArgs),
});
const cachedDevRelation =
  branch === "dev"
    ? "현재 dev 브랜치"
    : run("git", ["merge-base", "--is-ancestor", "origin/dev", "HEAD"], {
          allowFailure: true,
        }).status === 0
      ? "cached origin/dev 포함"
      : "cached origin/dev 미포함 또는 ref 없음";

const agentPrompt = buildPrAgentPrompt({
  issue: confirmedIssue,
  context: {
    branch,
    base: "dev",
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    safeDiff,
    cachedDevRelation,
    validationPolicy,
  },
});

function loadAndValidatePlan() {
  if (!existsSync(prPlanFile)) {
    fail(`Agent 분석 결과가 없습니다: ${prPlanFile}`);
  }

  let plan;
  const content = readFileSync(prPlanFile, "utf8");
  try {
    plan = parsePrPlan(content);
    plan.subject = normalizeSubjectIssueSuffix(plan.subject, confirmedIssue);
  } catch (error) {
    fail(`Agent PR plan을 사용할 수 없습니다.\n${error.message}`);
  }

  if (plan.issue !== confirmedIssue || plan.mode !== mode) {
    fail(
      "Agent PR plan의 Issue 또는 mode가 orchestrator 확인 결과와 다릅니다.",
    );
  }
  if (!TYPES.includes(plan.type)) {
    fail(`Agent PR plan의 type이 올바르지 않습니다: ${plan.type}`);
  }
  plan.slug = validateSlug(plan.slug);
  if (branch !== "dev") {
    const parsedBranch = parseBranch(branch);
    if (
      !parsedBranch ||
      parsedBranch.type !== plan.type ||
      parsedBranch.issue !== confirmedIssue ||
      parsedBranch.slug !== plan.slug
    ) {
      fail("Agent PR plan의 type/slug가 현재 작업 브랜치와 다릅니다.");
    }
  }
  if (mode === "create" && !existsSync(prBodyFile)) {
    fail("create mode Agent 결과에는 pr-body.md가 필요합니다.");
  }

  return { plan, content };
}

const hasGitCheckpoint = existsSync(gitCheckpointFile);
let planData;
const fingerprintBeforeAgent = changesFingerprint();

{
  const { runAgent } = await import(`./lib/agents/${agent}.mjs`);
  console.log(`✓ ${agent} agent를 실행합니다.`);
  console.log(
    `ℹ 사전 확인: ${((performance.now() - workflowStartedAt) / 1000).toFixed(1)}s`,
  );
  const agentStartedAt = performance.now();
  let agentExecution;
  let agentResult;
  try {
    agentExecution = runAgent({ prompt: agentPrompt, cwd });
    const mutationError = getAgentMutationError(
      fingerprintBeforeAgent,
      changesFingerprint(),
    );
    if (mutationError) fail(mutationError);
    console.log(
      `ℹ Agent 실행: ${((performance.now() - agentStartedAt) / 1000).toFixed(1)}s`,
    );
    try {
      agentResult = parseAgentResult(agentExecution.output);
    } catch (validationError) {
      console.log(
        "ℹ Agent JSON은 추출되었지만 schema가 맞지 않아 한 번만 교정 요청합니다.",
      );
      const repairFingerprint = changesFingerprint();
      agentExecution = runAgent({
        prompt: buildAgentResultRepairPrompt({
          output: agentExecution.output,
          validationError: validationError.message,
        }),
        cwd,
      });
      const repairMutationError = getAgentMutationError(
        repairFingerprint,
        changesFingerprint(),
      );
      if (repairMutationError) fail(repairMutationError);
      agentResult = parseAgentResult(agentExecution.output);
    }
    agentResult = resolvePrMetadata(agentResult, parseBranch(branch));
    agentResult.subject = normalizeSubjectIssueSuffix(
      agentResult.subject,
      confirmedIssue,
    );
  } catch (error) {
    const rawOutputLength =
      agentExecution?.rawOutputLength ?? error.rawOutputLength ?? 0;
    const extractedResponseLength =
      agentExecution?.extractedResponseLength ??
      error.extractedResponseLength ??
      0;
    const contract = error.contractDiagnostics;
    const contractDetail = contract
      ? `\n- startsWithBrace: ${contract.startsWithBrace}` +
        `\n- endsWithBrace: ${contract.endsWithBrace}` +
        `\n- markdownFence: ${contract.hasMarkdownFence}` +
        `\n- topLevelObjects: ${contract.topLevelObjects}`
      : "";
    fail(
      `Agent 응답 JSON 파싱에 실패했습니다.\n` +
        `- agent: ${agent}\n` +
        `- raw stdout length: ${rawOutputLength}\n` +
        `- extracted response length: ${extractedResponseLength}\n` +
        contractDetail +
        (contractDetail ? "\n" : "") +
        `- filesystem/Git 변경 없음\n` +
        `원인: ${error.message}`,
    );
  }
  if (!TYPES.includes(agentResult.type)) {
    fail(`Agent 결과의 type이 올바르지 않습니다: ${agentResult.type}`);
  }
  agentResult.slug = validateSlug(agentResult.slug);

  try {
    writeAgentArtifacts(agentResult, absoluteTempDir, {
      issue: confirmedIssue,
      mode,
    });
  } catch (error) {
    fail(
      `Agent 분석은 완료했지만 Node가 결과 파일을 저장하지 못했습니다. staging은 실행하지 않았고 작업 트리는 유지됩니다.\n${error.message}`,
    );
  }
  planData = loadAndValidatePlan();
  console.log("✓ 현재 실행의 Agent 분석 결과를 저장했습니다.");
}

if (!hasGitCheckpoint) {
  const analysisBaselineFingerprint = fingerprintBeforeAgent;
  const unstaged = outputOf("git", ["diff", "--name-only"]);
  const untracked = outputOf("git", [
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  let staged = outputOf("git", ["diff", "--cached", "--name-only"]);

  if (unstaged || untracked) {
    const preStageError = getStagingSnapshotError({
      baseline: analysisBaselineFingerprint,
      current: changesFingerprint(),
      unstaged: "",
      untracked: "",
    });
    if (preStageError) fail(preStageError);
    const stageResult = run("git", ["add", "-A"], { allowFailure: true });
    if (stageResult.status !== 0) {
      const detail = stageResult.stderr?.trim() || stageResult.stdout?.trim();
      fail(
        "PR 분석은 완료했지만 변경사항 staging에 실패했습니다.\n" +
          "현재 작업 트리와 분석 결과는 유지됩니다. pnpm pr을 다시 실행하면 staging부터 재개합니다." +
          (detail ? `\n${detail}` : ""),
      );
    }
    console.log("✓ orchestrator가 전체 변경사항을 staging했습니다.");
    staged = outputOf("git", ["diff", "--cached", "--name-only"]);
  } else if (staged) {
    console.log(
      "✓ 필요한 변경사항이 이미 staged되어 있어 staging을 건너뜁니다.",
    );
  }

  if (!staged) fail("staging 후 commit할 변경사항이 없습니다.");
  const stagedSnapshotError = getStagingSnapshotError({
    baseline: analysisBaselineFingerprint,
    current: changesFingerprint(),
    unstaged: outputOf("git", ["diff", "--name-only"]),
    untracked: outputOf("git", ["ls-files", "--others", "--exclude-standard"]),
  });
  if (stagedSnapshotError) fail(stagedSnapshotError);

  run("git", ["status", "--short"], { inherit: true });
  run("git", ["diff", "--cached", "--name-status", "-M"], {
    inherit: true,
  });
}

if (existsSync(finishedFile)) rmSync(finishedFile);
const finishArgs = [
  resolve(cwd, "scripts", "create-pr.mjs"),
  "--mode",
  mode,
  "--issue",
  String(confirmedIssue),
  "--type",
  planData.plan.type,
  "--subject",
  planData.plan.subject,
  "--slug",
  planData.plan.slug,
];
if (existingPr) finishArgs.push("--pr", String(existingPr.number));
if (existsSync(prBodyFile)) finishArgs.push("--pr-body-file", prBodyFile);

console.log("✓ orchestrator가 pr:finish 단계로 진행합니다.");
run(process.execPath, finishArgs, { inherit: true });

if (!existsSync(finishedFile)) {
  fail(
    `PR 마무리가 완료되지 않았습니다. 진단 및 재시도를 위해 ${tempDir} 파일을 보존합니다.`,
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
