import { spawnSync } from "node:child_process";

import { fail } from "../git-github.mjs";

// Agent JSONL과 최종 응답이 커질 수 있어 Node 기본 1 MiB보다 여유 있게 둔다.
export const AGENT_OUTPUT_MAX_BUFFER = 16 * 1024 * 1024;

export class AgentOutputError extends TypeError {
  constructor(message, { rawOutputLength = 0, extractedResponseLength = 0 } = {}) {
    super(message);
    this.name = "AgentOutputError";
    this.rawOutputLength = rawOutputLength;
    this.extractedResponseLength = extractedResponseLength;
  }
}

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

export function runCli(
  command,
  args,
  { cwd, displayName, input, captureOutput = false } = {},
) {
  const result = spawnResolved(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    input,
    maxBuffer: captureOutput ? AGENT_OUTPUT_MAX_BUFFER : undefined,
    stdio: captureOutput
      ? [input ? "pipe" : "inherit", "pipe", "inherit"]
      : input
        ? ["pipe", "inherit", "inherit"]
        : "inherit",
  });
  if (result.error?.code === "ENOENT") {
    fail(`${displayName} CLI를 찾을 수 없습니다.`);
  }
  if (result.error) {
    fail(`${displayName} 실행에 실패했습니다.\n${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(
      `${displayName} 실행에 실패했습니다. 다른 agent로 자동 전환하지 않습니다.`,
    );
  }
  return captureOutput ? result.stdout || "" : undefined;
}

export function extractSingleJsonObjectResponse(rawOutput) {
  const candidates = [];

  for (let start = 0; start < rawOutput.length; start += 1) {
    if (rawOutput[start] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let end = start; end < rawOutput.length; end += 1) {
      const character = rawOutput[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth !== 0) continue;
        const candidate = rawOutput.slice(start, end + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            candidates.push(candidate);
            start = end;
          }
        } catch {
          // 이 시작 위치는 JSON 객체가 아니므로 다음 중괄호를 검사한다.
        }
        break;
      }
    }
  }

  if (candidates.length === 0) {
    throw new AgentOutputError("Agent 출력에서 JSON 객체를 찾을 수 없습니다.", {
      rawOutputLength: rawOutput.length,
    });
  }
  if (candidates.length > 1) {
    throw new AgentOutputError(
      "Agent 출력에 JSON 객체가 여러 개 있어 응답이 모호합니다.",
      { rawOutputLength: rawOutput.length },
    );
  }
  return candidates[0];
}

export function extractCopilotFinalResponse(rawOutput) {
  const events = [];
  for (const line of rawOutput.split(/\r?\n/u).filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new AgentOutputError(
        "Copilot JSONL 출력에 올바르지 않은 event가 있습니다.",
        { rawOutputLength: rawOutput.length },
      );
    }
    events.push(event);
  }

  const messages = events.filter(
    (event) =>
      event?.type === "assistant.message" &&
      typeof event.data?.content === "string" &&
      event.data.content.trim(),
  );
  if (messages.length === 0) {
    throw new AgentOutputError(
      "Copilot JSONL 출력에 final assistant.message가 없습니다.",
      { rawOutputLength: rawOutput.length },
    );
  }
  const finalResponse = messages.at(-1).data.content.trim();
  return {
    output: finalResponse,
    diagnostics: `Copilot JSONL events: ${events.map((event) => event?.type || "unknown").join(", ")}`,
    rawOutputLength: rawOutput.length,
    extractedResponseLength: finalResponse.length,
  };
}

export function createAgentResult(rawOutput) {
  const output = extractSingleJsonObjectResponse(rawOutput);
  return {
    output,
    diagnostics: "",
    rawOutputLength: rawOutput.length,
    extractedResponseLength: output.length,
  };
}

export function extractCodexFinalResponse(rawOutput) {
  const events = rawOutput.split(/\r?\n/u).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new AgentOutputError("Codex JSONL 출력에 올바르지 않은 event가 있습니다.", {
        rawOutputLength: rawOutput.length,
      });
    }
  });
  const messages = events.filter(
    (event) =>
      event?.type === "item.completed" &&
      event.item?.type === "agent_message" &&
      typeof event.item.text === "string" &&
      event.item.text.trim(),
  );
  if (messages.length === 0) {
    throw new AgentOutputError("Codex JSONL 출력에 final agent_message가 없습니다.", {
      rawOutputLength: rawOutput.length,
    });
  }
  const output = messages.at(-1).item.text.trim();
  return {
    output,
    diagnostics: `Codex JSONL events: ${events.map((event) => event?.type || "unknown").join(", ")}`,
    rawOutputLength: rawOutput.length,
    extractedResponseLength: output.length,
  };
}
