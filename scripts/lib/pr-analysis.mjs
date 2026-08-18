import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PLAN_FIELDS = [
  "issue",
  "mode",
  "type",
  "subject",
  "slug",
  "scope",
  "validation",
];

export function fingerprintText(value) {
  return createHash("sha256").update(value).digest("hex");
}

const RESULT_TEXT_FIELDS = ["issueResult", "prBody", "issueBody"];
const PROTECTED_TOOLING_PATHS = [
  /^scripts\//u,
  /^\.github\//u,
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc)$/u,
];
const TOOLING_ISSUE_PATTERN =
  /(?:자동화|개발\s*환경|툴링|도구|automation|tooling|workflow|\bci\b)/iu;

export function parseAgentResult(output) {
  let result;
  try {
    result = JSON.parse(output);
  } catch {
    throw new TypeError(
      "Agent 출력이 단일 JSON 객체가 아닙니다. staging 전에 중단합니다.",
    );
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("Agent 결과는 JSON 객체여야 합니다.");
  }

  const { plan } = result;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new TypeError("Agent 결과에 plan 객체가 없습니다.");
  }
  const requiredStrings = ["mode", "type", "subject", "slug", "scope", "validation"];
  const missing = requiredStrings.filter(
    (field) => typeof plan[field] !== "string" || !plan[field].trim(),
  );
  if (missing.length > 0) {
    throw new TypeError(`Agent plan 필드가 없거나 비어 있습니다: ${missing.join(", ")}`);
  }
  if (!Number.isInteger(plan.issue) || plan.issue <= 0) {
    throw new TypeError("Agent plan issue는 양의 정수여야 합니다.");
  }
  if (!new Set(["create", "update"]).has(plan.mode)) {
    throw new TypeError("Agent plan mode는 create 또는 update여야 합니다.");
  }
  if (!new Set(["all", "blocked"]).has(plan.scope)) {
    throw new TypeError("Agent plan scope는 all 또는 blocked여야 합니다.");
  }
  if (
    !Array.isArray(plan.unrelatedFiles) ||
    plan.unrelatedFiles.some((file) => typeof file !== "string" || !file)
  ) {
    throw new TypeError("Agent plan unrelatedFiles는 경로 문자열 배열이어야 합니다.");
  }
  for (const field of RESULT_TEXT_FIELDS) {
    if (result[field] !== null && typeof result[field] !== "string") {
      throw new TypeError(`Agent 결과 ${field}는 문자열 또는 null이어야 합니다.`);
    }
  }

  return {
    plan: {
      ...plan,
      subject: plan.subject.trim(),
      unrelatedFiles: [...new Set(plan.unrelatedFiles)].sort(),
    },
    issueResult: result.issueResult,
    prBody: result.prBody,
    issueBody: result.issueBody,
  };
}

export function renderPrPlan(plan) {
  return `# PR plan\n\n- issue: ${plan.issue}\n- mode: ${plan.mode}\n- type: ${plan.type}\n- subject: ${plan.subject}\n- slug: ${plan.slug}\n- scope: ${plan.scope}\n- validation: ${plan.validation}\n`;
}

export function writeAgentArtifacts(
  result,
  directory,
  { mkdir = mkdirSync, writeFile = writeFileSync, removeFile = rmSync } = {},
) {
  mkdir(directory, { recursive: true });
  const artifacts = [
    ["pr-plan.md", renderPrPlan(result.plan)],
    ["issue-result.md", result.issueResult],
    ["pr-body.md", result.prBody],
    ["issue-body.md", result.issueBody],
  ];
  for (const [name, content] of artifacts) {
    const path = resolve(directory, name);
    if (content === null) removeFile(path, { force: true });
    else writeFile(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  }
}

export function findUnrelatedToolingChanges(changedFiles, issue) {
  const issueText = `${issue?.title || ""}\n${issue?.body || ""}`;
  if (TOOLING_ISSUE_PATTERN.test(issueText)) return [];
  return [...new Set(changedFiles.map((file) => file.replaceAll("\\", "/")))]
    .filter((file) => PROTECTED_TOOLING_PATHS.some((pattern) => pattern.test(file)))
    .sort();
}

export function getScopeBlockReason(result, unrelatedToolingFiles = []) {
  const files = [
    ...new Set([
      ...result.plan.unrelatedFiles,
      ...unrelatedToolingFiles,
    ]),
  ].sort();
  if (result.plan.scope === "all" && files.length === 0) return null;
  return `현재 작업 트리에 Issue #${result.plan.issue}과 무관할 가능성이 높은 변경이 있습니다.\n\n${files.map((file) => `- ${file}`).join("\n") || "- Agent가 unrelated 변경을 감지했습니다."}\n\nPR 범위를 분리한 뒤 다시 실행해주세요.`;
}

export function parsePrPlan(content) {
  const values = {};
  for (const line of content.split(/\r?\n/u)) {
    const match = /^-\s+([a-z-]+):\s*(.+)$/u.exec(line.trim());
    if (match) values[match[1]] = match[2].trim();
  }

  const missing = PLAN_FIELDS.filter((field) => !values[field]);
  if (missing.length > 0) {
    throw new TypeError(`PR plan 필드가 없습니다: ${missing.join(", ")}`);
  }

  const issue = Number(values.issue);
  if (!Number.isInteger(issue) || issue <= 0) {
    throw new TypeError("PR plan issue는 양의 정수여야 합니다.");
  }
  if (!new Set(["create", "update"]).has(values.mode)) {
    throw new TypeError("PR plan mode는 create 또는 update여야 합니다.");
  }
  if (values.scope !== "all") {
    throw new TypeError(
      "PR plan scope가 all이 아닙니다. unrelated 변경사항을 정리한 뒤 다시 실행하세요.",
    );
  }

  return {
    issue,
    mode: values.mode,
    type: values.type,
    subject: values.subject,
    slug: values.slug,
    scope: values.scope,
    validation: values.validation,
  };
}

export function normalizeSubjectIssueSuffix(subject, issue) {
  const suffixPattern = /\s*\(#(\d+)\)\s*$/u;
  let normalized = subject.trim();
  let match = suffixPattern.exec(normalized);

  while (match) {
    if (Number(match[1]) !== issue) {
      throw new TypeError(
        `subject의 Issue #${match[1]}이 확정된 Issue #${issue}과 다릅니다.`,
      );
    }
    normalized = normalized.slice(0, match.index).trimEnd();
    match = suffixPattern.exec(normalized);
  }

  if (!normalized) throw new TypeError("subject는 비워둘 수 없습니다.");
  return normalized;
}

export function getAnalysisCheckpointIntegrityError(
  checkpoint,
  { issue, mode, branch, changesFingerprint, planFingerprint },
) {
  if (!checkpoint) return null;
  if (!new Set(["agentAnalysisComplete", "staged"]).has(checkpoint.phase)) {
    return "PR 분석 checkpoint phase를 확인할 수 없습니다.";
  }
  if (checkpoint.issue !== issue || checkpoint.mode !== mode) {
    return "PR 분석 checkpoint의 Issue 또는 mode가 현재 실행과 다릅니다.";
  }
  if (
    branch !== checkpoint.sourceBranch &&
    branch !== checkpoint.targetBranch
  ) {
    return "PR 분석 checkpoint의 branch가 현재 branch와 다릅니다.";
  }
  if (
    !checkpoint.changesFingerprint ||
    checkpoint.changesFingerprint !== changesFingerprint
  ) {
    return "Agent 분석 이후 변경사항이 달라졌습니다. 자동 재개하지 않습니다.";
  }
  if (
    !checkpoint.planFingerprint ||
    checkpoint.planFingerprint !== planFingerprint
  ) {
    return "Agent 분석 결과 파일이 checkpoint와 다릅니다. 자동 재개하지 않습니다.";
  }
  return null;
}
