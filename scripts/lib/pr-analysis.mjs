import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PLAN_FIELDS = [
  "issue",
  "mode",
  "type",
  "subject",
  "slug",
];

export function fingerprintText(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function getAgentMutationError(before, after) {
  return before === after
    ? null
    : "Agent 실행 중 작업 트리가 변경되었습니다. artifact 저장과 staging 전에 중단합니다.";
}

export function getBranchSwitchIntegrityError(before, after) {
  return before === after
    ? null
    : "작업 브랜치 생성 전후 working tree가 달라졌습니다. staging과 commit 전에 중단합니다.";
}

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

  const requiredStrings = ["type", "subject", "slug", "prBody"];
  const missing = requiredStrings.filter(
    (field) => typeof result[field] !== "string" || !result[field].trim(),
  );
  if (missing.length > 0) {
    throw new TypeError(`Agent plan 필드가 없거나 비어 있습니다: ${missing.join(", ")}`);
  }
  const multiline = ["type", "subject", "slug"].filter((field) =>
    /[\r\n]/u.test(result[field]),
  );
  if (multiline.length > 0) {
    throw new TypeError(`Agent plan 문자열은 한 줄이어야 합니다: ${multiline.join(", ")}`);
  }
  return {
    type: result.type.trim(),
    subject: result.subject.trim(),
    slug: result.slug.trim(),
    prBody: result.prBody.trim(),
  };
}

export function renderPrPlan(plan) {
  return `# PR plan\n\n- issue: ${plan.issue}\n- mode: ${plan.mode}\n- type: ${plan.type}\n- subject: ${plan.subject}\n- slug: ${plan.slug}\n`;
}

export function writeAgentArtifacts(
  result,
  directory,
  context,
  { mkdir = mkdirSync, writeFile = writeFileSync, removeFile = rmSync } = {},
) {
  mkdir(directory, { recursive: true });
  const artifacts = [
    ["pr-plan.md", renderPrPlan({ ...context, ...result })],
    ["issue-result.md", null],
    ["pr-body.md", result.prBody],
    ["issue-body.md", null],
  ];
  for (const [name, content] of artifacts) {
    const path = resolve(directory, name);
    if (content === null) removeFile(path, { force: true });
    else writeFile(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  }
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

  return {
    issue,
    mode: values.mode,
    type: values.type,
    subject: values.subject,
    slug: values.slug,
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

export function resolvePrMetadata(agentResult, branchData) {
  return branchData
    ? {
        ...agentResult,
        type: branchData.type,
        slug: branchData.slug,
      }
    : agentResult;
}

export function getTargetBranch({ sourceBranch, issue, type, slug }) {
  return sourceBranch === "dev" ? `${type}/${issue}-${slug}` : sourceBranch;
}

export function buildQuickIssueUpdate({
  isQuickIssue,
  type,
  subject,
  prBody,
  prNumber,
}) {
  if (!isQuickIssue) return null;
  const typeLabel = type[0].toUpperCase() + type.slice(1);
  return {
    title: `[${typeLabel}] ${subject}`,
    body: `${prBody.trim()}\n\n## 관련 PR\n\n#${prNumber}`,
  };
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
