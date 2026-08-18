import {
  assertAuth,
  assertCommand,
  resolveCliCommand,
  runCli,
} from "./shared.mjs";

export function runAgent({ prompt, cwd }) {
  const command = resolveCliCommand("codex");
  assertCommand(command, "Codex");
  assertAuth(command, ["login", "status"], "Codex");
  runCli(
    command,
    [
      "exec",
      "--sandbox",
      "workspace-write",
      "--ephemeral",
      "--cd",
      cwd,
      "-",
    ],
    { cwd, displayName: "Codex", input: prompt },
  );
}
