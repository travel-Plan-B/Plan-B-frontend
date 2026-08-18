import {
  assertAuth,
  assertCommand,
  extractCopilotFinalResponse,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

const ALLOWED_TOOLS = [
  "read",
  "shell(git status:*)",
  "shell(git diff:*)",
  "shell(git ls-files:*)",
  "shell(git log:*)",
  "shell(gh issue list:*)",
  "shell(gh issue view:*)",
  "shell(gh pr view:*)",
  "shell(gh pr diff:*)",
];

const DENIED_TOOLS = [
  "shell(git add:*)",
  "shell(git branch:*)",
  "shell(git commit:*)",
  "shell(git push:*)",
  "shell(git rebase:*)",
  "shell(git reset:*)",
  "shell(git checkout:*)",
  "shell(git switch:*)",
  "shell(gh pr create:*)",
  "shell(gh pr edit:*)",
  "shell(gh issue edit:*)",
  "shell(pnpm pr:*)",
];

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("copilot");
  assertCommand(command, "GitHub Copilot", ["--version"]);
  assertAuth("gh", ["auth", "status"], "GitHub");
  const permissionArgs = [
    ...ALLOWED_TOOLS.map((tool) => `--allow-tool=${tool}`),
    ...DENIED_TOOLS.map((tool) => `--deny-tool=${tool}`),
  ];
  const rawOutput = runCli(
    command,
    [
      "--no-ask-user",
      "--silent",
      "--stream",
      "off",
      "--output-format",
      "json",
      "--no-color",
      "--log-level",
      "none",
      ...permissionArgs,
    ],
    {
    cwd,
    displayName: "GitHub Copilot",
    input: prompt,
    captureOutput: true,
    },
  );
  return extractCopilotFinalResponse(rawOutput);
}
