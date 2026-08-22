import { readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".cjs", ".css", ".html", ".js", ".jsx", ".json", ".md", ".mjs",
  ".svg", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
const FORBIDDEN_BINARY_PATCH =
  /^GIT binary patch$|^(?:literal|delta) \d+$/mu;

export function assertSafeAgentDiff(safeDiff) {
  if (FORBIDDEN_BINARY_PATCH.test(safeDiff)) {
    throw new Error("Safe Agent diff에 binary patch 본문이 감지되었습니다.");
  }
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes >= 1024 * 1024) return `, ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `, ${(bytes / 1024).toFixed(1)} KB`;
  return `, ${bytes} B`;
}

function binarySummary(change, cwd) {
  let size = "";
  try {
    size = formatSize(statSync(resolve(cwd, change.path)).size);
  } catch {
    // Deleted files have no working-tree size.
  }
  return `${change.status[0]} ${change.path} [binary${size}]`;
}

function isTextPath(path) {
  return TEXT_EXTENSIONS.has(extname(path).toLowerCase());
}

function trackedDiff({ change, cwd, staged, gitOutput }) {
  if (!isTextPath(change.path)) return binarySummary(change, cwd);
  const prefix = staged
    ? ["--literal-pathspecs", "diff", "--cached"]
    : ["--literal-pathspecs", "diff"];
  const numstat = gitOutput([...prefix, "--numstat", "--no-ext-diff", "--", change.path]);
  if (/^-\t-\t/mu.test(numstat)) return binarySummary(change, cwd);
  return gitOutput([...prefix, "--no-ext-diff", "--no-color", "--", change.path]);
}

function untrackedDiff(path, cwd) {
  const change = { status: "A", path };
  if (!isTextPath(path)) return binarySummary(change, cwd);
  const content = readFileSync(resolve(cwd, path));
  if (content.includes(0)) return binarySummary(change, cwd);
  const text = content.toString("utf8");
  const lines = text.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();
  return [
    `diff --git a/${path} b/${path}`,
    "new file mode 100644",
    "--- /dev/null",
    `+++ b/${path}`,
    `@@ -0,0 +1,${lines.length} @@`,
    ...lines.map((line) => `+${line}`),
  ].join("\n");
}

export function buildSafeAgentDiff({
  cwd,
  stagedChanges,
  unstagedChanges,
  untrackedFiles,
  gitOutput,
}) {
  const sections = [];
  for (const [label, changes, staged] of [
    ["staged", stagedChanges, true],
    ["unstaged", unstagedChanges, false],
  ]) {
    const entries = changes.map((change) =>
      trackedDiff({ change, cwd, staged, gitOutput }),
    ).filter(Boolean);
    if (entries.length) sections.push(`## ${label}\n${entries.join("\n\n")}`);
  }
  const untracked = untrackedFiles.map((path) => untrackedDiff(path, cwd));
  if (untracked.length) sections.push(`## untracked\n${untracked.join("\n\n")}`);
  const safeDiff = sections.join("\n\n");
  assertSafeAgentDiff(safeDiff);
  return safeDiff || "변경 diff 없음";
}
