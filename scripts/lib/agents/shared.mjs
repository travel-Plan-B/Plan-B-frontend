import { spawnSync } from "node:child_process";

import { fail } from "../git-github.mjs";

export function resolveCliCommand(command, platform = process.platform) {
  if (platform !== "win32") return command;

  const shimName = `${command}.cmd`;
  const result = spawnSync("where.exe", [shimName], {
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });
  const resolved = result.stdout
    ?.split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().endsWith(".cmd"));
  return resolved || shimName;
}

function quoteCmdArgument(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function spawnResolved(command, args, options) {
  if (process.platform !== "win32" || !command.toLowerCase().endsWith(".cmd")) {
    return spawnSync(command, args, { ...options, shell: false });
  }

  const commandLine = [
    quoteCmdArgument(command),
    ...args.map(quoteCmdArgument),
  ].join(" ");
  return spawnSync(
    process.env.ComSpec || "cmd.exe",
    ["/d", "/s", "/c", `"${commandLine}"`],
    {
      ...options,
      shell: false,
      windowsHide: true,
      windowsVerbatimArguments: true,
    },
  );
}

export function assertCommand(
  command,
  displayName,
  versionArgs = ["--version"],
) {
  const result = spawnResolved(command, versionArgs, {
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });
  if (result.error?.code === "ENOENT") {
    fail(`${displayName} CLI를 찾을 수 없습니다. 설치 후 다시 시도해 주세요.`);
  }
  if (result.status !== 0) {
    const detail =
      result.stderr?.trim() || result.stdout?.trim() || result.error?.message;
    fail(
      `${displayName} CLI 실행 상태를 확인할 수 없습니다.${detail ? `\n${detail}` : ""}`,
    );
  }
}

export function assertAuth(command, args, displayName) {
  const result = spawnResolved(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    fail(
      `${displayName} 인증 상태를 확인해 주세요.${detail ? `\n${detail}` : ""}`,
    );
  }
}

export function runCli(command, args, { cwd, displayName, input } = {}) {
  const result = spawnResolved(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    input,
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
  });
  if (result.error?.code === "ENOENT") {
    fail(`${displayName} CLI를 찾을 수 없습니다.`);
  }
  if (result.status !== 0) {
    fail(
      `${displayName} 실행에 실패했습니다. 다른 agent로 자동 전환하지 않습니다.`,
    );
  }
}
