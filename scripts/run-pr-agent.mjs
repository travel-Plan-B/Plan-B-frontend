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
  getIssueInfo,
  parseArgs,
  parseBranch,
  prompt,
  QUICK_ISSUE_MARKER,
} from "./lib/git-github.mjs";
import { buildPrAgentPrompt } from "./lib/pr-agent-prompt.mjs";

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
const branchIssue = parseBranch(currentBranch())?.issue;
if (confirmedIssue) {
  validateOpenIssue(confirmedIssue);
  console.log(`✓ 명시된 Issue #${confirmedIssue}을 사용합니다.`);
} else if (branchIssue) {
  confirmedIssue = branchIssue;
  validateOpenIssue(confirmedIssue);
  console.log(`✓ 현재 브랜치에서 Issue #${confirmedIssue} 확인`);
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
mkdirSync(absoluteTempDir, { recursive: true });
if (existsSync(finishedFile)) rmSync(finishedFile);
process.env.PLANB_PR_FINISHED_FILE = finishedFile;

const { runAgent } = await import(`./lib/agents/${agent}.mjs`);
const agentPrompt = buildPrAgentPrompt({ issue: confirmedIssue, tempDir });

console.log(`✓ ${agent} agent를 실행합니다.`);
runAgent({ prompt: agentPrompt, cwd });

if (!existsSync(finishedFile)) {
  fail(
    `Agent가 PR 마무리를 완료하지 않았습니다. 진단 및 재시도를 위해 ${tempDir} 파일을 보존합니다.`,
  );
}

const finished = JSON.parse(readFileSync(finishedFile, "utf8"));
if (clearActiveIssue(finished.issue)) {
  console.log(`✓ active Issue #${finished.issue} 정보를 정리했습니다.`);
}

rmSync(absoluteTempDir, { recursive: true, force: true });
console.log("✓ 임시 PR 작성 파일을 정리했습니다.");
