import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export const TYPES = [
  "feat",
  "fix",
  "refactor",
  "chore",
  "docs",
  "style",
  "test",
];
const BRANCH_TYPE_PATTERN = TYPES.join("|");
const BRANCH_PATTERN = new RegExp(
  `^(${BRANCH_TYPE_PATTERN})/(\\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)$`,
  "u",
);

export const QUICK_ISSUE_MARKER = "<!-- planb:quick-issue -->";

export function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: options.inherit ? "inherit" : "pipe",
  });

  if (result.error?.code === "ENOENT") {
    fail(`${command} 명령을 찾을 수 없습니다. 설치 후 다시 시도해 주세요.`);
  }

  if (result.status !== 0 && !options.allowFailure) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    fail(
      `${command} ${args.join(" ")} 실행에 실패했습니다.${detail ? `\n${detail}` : ""}`,
    );
  }

  return result;
}

export function outputOf(command, args, options = {}) {
  return run(command, args, options).stdout.trim();
}

export function rawOutputOf(command, args, options = {}) {
  return run(command, args, options).stdout;
}

export function assertRepository() {
  if (
    outputOf("git", ["rev-parse", "--is-inside-work-tree"], {
      allowFailure: true,
    }) !== "true"
  ) {
    fail("현재 위치가 Git repository가 아닙니다.");
  }
}

export function assertGhReady() {
  run("gh", ["--version"]);
  run("gh", ["auth", "status"]);
}

export function currentBranch() {
  const branch = outputOf("git", ["branch", "--show-current"]);
  if (!branch) fail("detached HEAD 상태에서는 실행할 수 없습니다.");
  return branch;
}

export function assertDevIsCurrent() {
  run("git", ["fetch", "origin", "dev"]);
  const local = outputOf("git", ["rev-parse", "dev"]);
  const remote = outputOf("git", ["rev-parse", "origin/dev"]);
  if (local !== remote) {
    fail(
      "로컬 dev가 origin/dev와 일치하지 않습니다. 변경사항을 안전하게 정리한 뒤 dev를 최신화해 주세요.",
    );
  }
}

export function assertBranchContainsLatestDev() {
  run("git", ["fetch", "origin", "dev"]);
  const result = run(
    "git",
    ["merge-base", "--is-ancestor", "origin/dev", "HEAD"],
    { allowFailure: true },
  );
  if (result.status !== 0) {
    fail(
      "현재 작업 브랜치에 최신 origin/dev가 반영되어 있지 않습니다. 충돌 가능성을 확인한 뒤 직접 rebase하고 다시 실행해 주세요.",
    );
  }
}

export function hasWorkingTreeChanges() {
  return outputOf("git", ["status", "--porcelain"]).length > 0;
}

export function branchExists(branch) {
  return (
    run("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], {
      allowFailure: true,
    }).status === 0
  );
}

export function remoteBranchExists(branch) {
  return outputOf("git", ["ls-remote", "--heads", "origin", branch]).length > 0;
}

export function validateSlug(value) {
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
    fail(
      "브랜치 요약은 영문 소문자, 숫자와 하이픈만 사용한 kebab-case여야 합니다.",
    );
  }
  return slug;
}

export function parseBranch(branch) {
  const match = BRANCH_PATTERN.exec(branch);
  return match
    ? { type: match[1], issue: Number(match[2]), slug: match[3] }
    : null;
}

export function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) fail(`알 수 없는 인자입니다: ${token}`);
    const key = token.slice(2);
    if (key === "branch" || key === "help" || key === "reset-checkpoint") {
      values[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`--${key} 값을 입력해 주세요.`);
    values[key] = value;
    index += 1;
  }
  return values;
}

export function assertAllowedArgs(args, allowed) {
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length > 0)
    fail(`지원하지 않는 옵션입니다: --${unknown.join(", --")}`);
}

export async function prompt(label, defaultValue = "") {
  const rl = createInterface({ input, output });
  try {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    return (await rl.question(`? ${label}${suffix}: `)).trim() || defaultValue;
  } finally {
    rl.close();
  }
}

export async function confirm(label) {
  const answer = (await prompt(`${label} [y/N]`)).toLowerCase();
  return answer === "y" || answer === "yes";
}

export async function confirmDefaultYes(label) {
  const answer = (await prompt(`${label} [Y/n]`)).toLowerCase();
  return answer === "" || answer === "y" || answer === "yes";
}

export async function chooseType(given) {
  const value = given || (await prompt(`작업 유형 [${TYPES.join("/")}]`));
  if (!TYPES.includes(value))
    fail(`작업 유형은 ${TYPES.join(", ")} 중 하나여야 합니다.`);
  return value;
}

export async function chooseIssueMode(given) {
  if (given && !["quick", "direct"].includes(given)) {
    fail("생성 방식은 quick 또는 direct여야 합니다.");
  }
  if (given) return given;

  console.log("? 이슈 생성 방식을 선택하세요:");
  console.log("  1) 빠른 생성");
  console.log("  2) 직접 작성");
  const selection = await prompt("선택 [1/2]");
  if (selection === "1") return "quick";
  if (selection === "2") return "direct";
  fail("1(빠른 생성) 또는 2(직접 작성)를 선택해 주세요.");
}

export function getIssueInfo(number) {
  const result = run(
    "gh",
    ["issue", "view", String(number), "--json", "number,state,title,body,url"],
    { allowFailure: true },
  );
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    return null;
  }
}

export function issueInfo(number) {
  const issue = getIssueInfo(number);
  if (!issue) fail(`Issue #${number}를 찾을 수 없습니다.`);
  if (issue.state !== "OPEN") fail(`Issue #${number}가 open 상태가 아닙니다.`);
  return issue;
}

export function findPrsForBranch(branch, state = "open") {
  const raw = outputOf("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    state,
    "--json",
    "number,state,url,title,body,baseRefName,headRefName",
  ]);
  return JSON.parse(raw);
}

export function findOpenPrForBranch(branch) {
  const pullRequests = findPrsForBranch(branch, "open");
  if (pullRequests.length > 1) {
    fail(
      `브랜치 ${branch}에 open PR이 여러 개 있어 대상을 확정할 수 없습니다: ${pullRequests
        .map((pullRequest) => `#${pullRequest.number}`)
        .join(", ")}`,
    );
  }
  return pullRequests[0] || null;
}

export function inspectPrsForBranch(branch) {
  const pullRequests = findPrsForBranch(branch, "all");
  const openPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state === "OPEN",
  );
  if (openPullRequests.length > 1) {
    fail(
      `브랜치 ${branch}에 open PR이 여러 개 있어 대상을 확정할 수 없습니다: ${openPullRequests
        .map((pullRequest) => `#${pullRequest.number}`)
        .join(", ")}`,
    );
  }
  return {
    openPr: openPullRequests[0] || null,
    priorPr: pullRequests[0] || null,
  };
}

export function assertNoPriorPrForBranch(branch) {
  const pullRequests = findPrsForBranch(branch, "all");
  if (pullRequests.length > 0) {
    fail(
      `브랜치 ${branch}에는 이미 ${pullRequests[0].state} PR이 있습니다. 기존 브랜치를 재사용해 새 PR을 만들 수 없습니다: ${pullRequests[0].url}`,
    );
  }
}

export function issueReferencesFromPr(body = "") {
  const references = new Set();
  const pattern =
    /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s+#(\d+)\b/giu;
  for (const match of body.matchAll(pattern)) references.add(Number(match[1]));
  return [...references];
}
