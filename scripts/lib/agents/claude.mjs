import {
  assertAuth,
  assertCommand,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

const ALLOWED_TOOLS = [
  "Read",
  "Glob",
  "Grep",
  "Write",
  "Edit",
  "Bash(git status:*)",
  "Bash(git diff:*)",
  "Bash(git branch:*)",
  "Bash(git log:*)",
  "Bash(git add:*)",
  "Bash(gh issue list:*)",
  "Bash(gh issue view:*)",
  "Bash(gh pr view:*)",
  "Bash(gh pr diff:*)",
  "Bash(pnpm lint:*)",
  "Bash(pnpm typecheck:*)",
  "Bash(pnpm build:*)",
  "Bash(pnpm test:*)",
  "Bash(pnpm pr:finish:*)",
].join(",");

const DENIED_TOOLS = [
  "Bash(git commit:*)",
  "Bash(git push:*)",
  "Bash(git rebase:*)",
  "Bash(git reset:*)",
  "Bash(git checkout:*)",
  "Bash(git switch:*)",
  "Bash(gh pr create:*)",
  "Bash(gh pr edit:*)",
].join(",");

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("claude");
  assertCommand(command, "Claude Code");
  assertAuth(command, ["auth", "status"], "Claude Code");
  runCli(
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
    { cwd, displayName: "Claude Code", input: prompt },
  );
}
