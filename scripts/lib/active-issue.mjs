import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

function activeIssueFile(cwd = process.cwd()) {
  return resolve(cwd, ".tmp", "planb", "active-issue.json");
}

export function readActiveIssue(cwd) {
  const file = activeIssueFile(cwd);
  if (!existsSync(file)) return null;
  try {
    const metadata = JSON.parse(readFileSync(file, "utf8"));
    if (
      !Number.isInteger(metadata.issue) ||
      metadata.issue <= 0 ||
      metadata.mode !== "quick"
    ) {
      rmSync(file);
      return null;
    }
    return { issue: metadata.issue, mode: "quick" };
  } catch {
    rmSync(file, { force: true });
    return null;
  }
}

export function writeActiveIssue(issue, cwd) {
  const file = activeIssueFile(cwd);
  const directory = dirname(file);
  const temporaryFile = `${file}.tmp`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    temporaryFile,
    `${JSON.stringify({ issue, mode: "quick" }, null, 2)}\n`,
    "utf8",
  );
  renameSync(temporaryFile, file);
}

export function clearActiveIssue(expectedIssue, cwd) {
  const file = activeIssueFile(cwd);
  const activeIssue = readActiveIssue(cwd);
  if (!activeIssue) {
    if (existsSync(file)) rmSync(file);
    return false;
  }
  if (expectedIssue && activeIssue.issue !== expectedIssue) return false;
  rmSync(file);
  return true;
}
