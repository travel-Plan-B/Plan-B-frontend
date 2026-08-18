import {
  assertAuth,
  assertCommand,
  extractCodexFinalResponse,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("codex");
  assertCommand(command, "Codex");
  assertAuth(command, ["login", "status"], "Codex");
  const rawOutput = runCli(
    command,
    [
      "exec",
      "--sandbox",
      "read-only",
      "--ephemeral",
      "--json",
      "--cd",
      cwd,
      "-",
    ],
    { cwd, displayName: "Codex", input: prompt, captureOutput: true },
  );
  return extractCodexFinalResponse(rawOutput);
}
