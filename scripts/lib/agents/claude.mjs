import {
  assertAuth,
  assertCommand,
  createAgentResult,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

const ALLOWED_TOOLS = [
  "Read",
  "Glob",
  "Grep",
  "Bash(git status:*)",
  "Bash(git diff:*)",
  "Bash(git ls-files:*)",
  "Bash(git log:*)",
  "Bash(gh issue list:*)",
  "Bash(gh issue view:*)",
  "Bash(gh pr view:*)",
  "Bash(gh pr diff:*)",
].join(",");

export const DENIED_TOOLS = [
  "Write",
  "Edit",
  "MultiEdit",
  "NotebookEdit",
  "Bash(git add:*)",
  "Bash(git branch:*)",
  "Bash(git commit:*)",
  "Bash(git push:*)",
  "Bash(git rebase:*)",
  "Bash(git reset:*)",
  "Bash(git checkout:*)",
  "Bash(git switch:*)",
  "Bash(gh pr create:*)",
  "Bash(gh pr edit:*)",
  "Bash(gh issue edit:*)",
  "Bash(pnpm pr:*)",
].join(",");

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("claude");
  assertCommand(command, "Claude Code");
  assertAuth(command, ["auth", "status"], "Claude Code");
  const rawOutput = runCli(
    command,
    [
      "-p",
      "--output-format",
      "text",
      "--allowedTools",
      ALLOWED_TOOLS,
      "--disallowedTools",
      DENIED_TOOLS,
    ],
    { cwd, displayName: "Claude Code", input: prompt, captureOutput: true },
  );
  return createAgentResult(rawOutput);
}
