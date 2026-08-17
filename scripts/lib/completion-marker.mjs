import { readFileSync } from "node:fs";

export class CompletionMarkerError extends Error {
  constructor(message) {
    super(message);
    this.name = "CompletionMarkerError";
  }
}

export function parseCompletionMarker(content, expectedIssue) {
  let marker;
  try {
    marker = JSON.parse(content);
  } catch {
    throw new CompletionMarkerError(
      "완료 marker JSON이 손상되어 파싱할 수 없습니다.",
    );
  }

  if (!Number.isInteger(marker.issue) || marker.issue <= 0) {
    throw new CompletionMarkerError(
      `완료 marker의 issue는 양의 정수여야 합니다. 실제 값: ${JSON.stringify(marker.issue)}`,
    );
  }

  if (marker.issue !== expectedIssue) {
    throw new CompletionMarkerError(
      `완료 Issue mismatch: 예상 Issue #${expectedIssue}, 실제 완료 Issue #${marker.issue}`,
    );
  }

  return marker;
}

export function readCompletionMarker(file, expectedIssue) {
  try {
    return parseCompletionMarker(readFileSync(file, "utf8"), expectedIssue);
  } catch (error) {
    if (error instanceof CompletionMarkerError) throw error;
    throw new CompletionMarkerError(
      `완료 marker를 읽을 수 없습니다: ${error.message}`,
    );
  }
}

export function finalizeCompletedRun({
  markerContent,
  expectedIssue,
  clearActiveIssue,
  cleanup,
}) {
  const marker = parseCompletionMarker(markerContent, expectedIssue);
  const activeIssueCleared = clearActiveIssue(marker.issue);
  cleanup();
  return { marker, activeIssueCleared };
}
