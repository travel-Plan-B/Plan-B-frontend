import {
  assertAuth,
  assertCommand,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

const ALLOWED_TOOLS = [
  "read",
  "write(issue-result.md)",
  "write(issue-body.md)",
  "write(pr-body.md)",
  "shell(git status:*)",
  "shell(git diff:*)",
  "shell(git branch:*)",
  "shell(git log:*)",
  "shell(git add:*)",
  "shell(gh issue list:*)",
  "shell(gh issue view:*)",
  "shell(pnpm lint:*)",
  "shell(pnpm typecheck:*)",
  "shell(pnpm build:*)",
  "shell(pnpm test:*)",
  "shell(pnpm pr:finish:*)",
];

const DENIED_TOOLS = [
  "shell(git commit:*)",
  "shell(git push:*)",
  "shell(git rebase:*)",
  "shell(git reset:*)",
  "shell(git checkout:*)",
  "shell(git switch:*)",
  "shell(gh pr create:*)",
];

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("copilot");
  assertCommand(command, "GitHub Copilot", ["--version"]);
  assertAuth("gh", ["auth", "status"], "GitHub");
  const permissionArgs = [
    ...ALLOWED_TOOLS.map((tool) => `--allow-tool=${tool}`),
    ...DENIED_TOOLS.map((tool) => `--deny-tool=${tool}`),
  ];
  runCli(command, ["--no-ask-user", ...permissionArgs], {
    cwd,
    displayName: "GitHub Copilot",
    input: prompt,
  });
}
