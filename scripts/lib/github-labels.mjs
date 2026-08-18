import { TYPES } from "./git-github.mjs";

export function labelForType(type) {
  if (!TYPES.includes(type)) {
    throw new TypeError(`지원하지 않는 작업 type입니다: ${type}`);
  }
  return type;
}

export function applyTypeLabels({
  type,
  issueNumber,
  prNumber,
  runCommand,
  log = console.log,
  warn = console.warn,
}) {
  const label = labelForType(type);
  const listResult = runCommand(
    "gh",
    ["label", "list", "--limit", "1000", "--json", "name"],
    { allowFailure: true },
  );

  let labels;
  try {
    if (listResult.status !== 0) throw new Error("label 목록 조회 실패");
    labels = JSON.parse(listResult.stdout || "[]");
  } catch {
    warn(`⚠ GitHub label 목록을 확인하지 못해 \"${label}\" label을 적용하지 않았습니다.`);
    return;
  }

  if (!labels.some((item) => item?.name === label)) {
    warn(`⚠ GitHub label \"${label}\"가 존재하지 않아 자동 적용하지 못했습니다.`);
    return;
  }

  for (const [target, number] of [
    ["issue", issueNumber],
    ["pr", prNumber],
  ]) {
    if (!Number.isInteger(number) || number <= 0) {
      warn(`⚠ ${target === "issue" ? "Issue" : "PR"} 번호를 확인할 수 없어 \"${label}\" label을 적용하지 않았습니다.`);
      continue;
    }
    const result = runCommand(
      "gh",
      [target, "edit", String(number), "--add-label", label],
      { allowFailure: true },
    );
    if (result.status === 0) {
      log(`✓ ${target === "issue" ? "Issue" : "PR"} #${number}에 ${label} label 적용`);
    } else {
      warn(`⚠ ${target === "issue" ? "Issue" : "PR"} #${number}에 \"${label}\" label을 적용하지 못했습니다.`);
    }
  }
}
