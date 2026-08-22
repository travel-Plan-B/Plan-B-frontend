import { spawnSync } from "node:child_process";

import { fail } from "../git-github.mjs";

// Agent JSONL과 최종 응답이 커질 수 있어 Node 기본 1 MiB보다 여유 있게 둔다.
export const AGENT_OUTPUT_MAX_BUFFER = 16 * 1024 * 1024;
export const CLI_STDERR_TAIL_BYTES = 8 * 1024;

export function truncateCapturedStderr(stderr, maxBytes = CLI_STDERR_TAIL_BYTES) {
  const normalized = String(stderr || "").trim();
  const bytes = Buffer.from(normalized);
  if (bytes.byteLength <= maxBytes) return normalized;

  const omittedBytes = bytes.byteLength - maxBytes;
  const tail = bytes
    .subarray(omittedBytes)
    .toString("utf8")
    .replace(/^\uFFFD+/u, "");
  return `[stderr 앞부분 ${omittedBytes} bytes 생략]\n${tail}`;
}

export class AgentOutputError extends TypeError {
  constructor(
    message,
    { rawOutputLength = 0, extractedResponseLength = 0, contractDiagnostics } = {},
  ) {
    super(message);
    this.name = "AgentOutputError";
    this.rawOutputLength = rawOutputLength;
    this.extractedResponseLength = extractedResponseLength;
    this.contractDiagnostics = contractDiagnostics;
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
  { cwd, displayName, input, captureOutput = false, captureStderr = false } = {},
) {
  const shouldCaptureStderr = captureOutput && captureStderr;
  const result = spawnResolved(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    input,
    maxBuffer: captureOutput ? AGENT_OUTPUT_MAX_BUFFER : undefined,
    stdio: captureOutput
      ? [
          input ? "pipe" : "inherit",
          "pipe",
          shouldCaptureStderr ? "pipe" : "inherit",
        ]
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
    const stderr = shouldCaptureStderr
      ? truncateCapturedStderr(result.stderr)
      : "";
    fail(
      `${displayName} 실행에 실패했습니다. 다른 agent로 자동 전환하지 않습니다.${stderr ? `\n--- stderr 마지막 ${CLI_STDERR_TAIL_BYTES / 1024}KB ---\n${stderr}` : ""}`,
    );
  }
  return captureOutput ? result.stdout || "" : undefined;
}

function countTopLevelJsonObjects(rawOutput) {
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

  return candidates.length;
}

export function getAgentJsonContractDiagnostics(response) {
  const trimmed = response.trim();
  const fencedBlocks = findTopLevelJsonFences(trimmed);
  return {
    startsWithBrace: trimmed.startsWith("{"),
    endsWithBrace: trimmed.endsWith("}"),
    hasMarkdownFence: fencedBlocks.length > 0,
    topLevelObjects: countTopLevelJsonObjects(trimmed),
  };
}

function findTopLevelJsonFences(response) {
  return [
    ...response.matchAll(/^```json[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gmu),
  ];
}

export function normalizeAgentJsonResponse(
  response,
  { rawOutputLength = response.length, extractedResponseLength = response.length } = {},
) {
  const trimmed = response.trim();
  const diagnostics = getAgentJsonContractDiagnostics(response);
  const fencedBlocks = findTopLevelJsonFences(trimmed);
  const candidate =
    fencedBlocks.length === 1 ? fencedBlocks[0][1].trim() : trimmed;

  if (fencedBlocks.length > 1) {
    throw new AgentOutputError("Agent JSON contract 위반: json fence가 정확히 하나여야 합니다.", {
      rawOutputLength,
      extractedResponseLength,
      contractDiagnostics: diagnostics,
    });
  }

  if (fencedBlocks.length === 1 && diagnostics.topLevelObjects !== 1) {
    throw new AgentOutputError("Agent 출력에 JSON 후보가 여러 개 있습니다.", {
      rawOutputLength,
      extractedResponseLength,
      contractDiagnostics: diagnostics,
    });
  }

  if (fencedBlocks.length === 0 && diagnostics.topLevelObjects !== 1) {
    throw new AgentOutputError("Agent 출력이 단일 JSON 객체가 아닙니다.", {
      rawOutputLength,
      extractedResponseLength,
      contractDiagnostics: diagnostics,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new AgentOutputError("Agent 출력이 단일 JSON 객체가 아닙니다.", {
      rawOutputLength,
      extractedResponseLength,
      contractDiagnostics: diagnostics,
    });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AgentOutputError("Agent 결과는 JSON 객체여야 합니다.", {
      rawOutputLength,
      extractedResponseLength,
      contractDiagnostics: diagnostics,
    });
  }
  return candidate;
}

export function extractSingleJsonObjectResponse(rawOutput) {
  return normalizeAgentJsonResponse(rawOutput);
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
  const output = normalizeAgentJsonResponse(finalResponse, {
    rawOutputLength: rawOutput.length,
    extractedResponseLength: finalResponse.length,
  });
  return {
    output,
    diagnostics: `Copilot JSONL events: ${events.map((event) => event?.type || "unknown").join(", ")}`,
    rawOutputLength: rawOutput.length,
    extractedResponseLength: finalResponse.length,
  };
}

export function createAgentResult(rawOutput) {
  const output = normalizeAgentJsonResponse(rawOutput);
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
  const finalResponse = messages.at(-1).item.text.trim();
  const output = normalizeAgentJsonResponse(finalResponse, {
    rawOutputLength: rawOutput.length,
    extractedResponseLength: finalResponse.length,
  });
  return {
    output,
    diagnostics: `Codex JSONL events: ${events.map((event) => event?.type || "unknown").join(", ")}`,
    rawOutputLength: rawOutput.length,
    extractedResponseLength: output.length,
  };
}
