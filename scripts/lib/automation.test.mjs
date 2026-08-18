import assert from "node:assert/strict";
import test from "node:test";

import {
  fingerprintWorkingTree,
  getStagingSnapshotError,
  snapshotUntrackedFile,
} from "./checkpoint-fingerprint.mjs";
import { DENIED_TOOLS as CLAUDE_DENIED_TOOLS } from "./agents/claude.mjs";
import { DENIED_TOOLS as COPILOT_DENIED_TOOLS } from "./agents/copilot.mjs";
import {
  buildAgentResultRepairPrompt,
  buildPrAgentPrompt,
} from "./pr-agent-prompt.mjs";
import {
  extractCopilotFinalResponse,
  extractCodexFinalResponse,
  getAgentJsonContractDiagnostics,
  normalizeAgentJsonResponse,
} from "./agents/shared.mjs";
import { issueReferencesFromPr, parseArgs } from "./git-github.mjs";
import {
  getAgentMutationError,
  getAnalysisCheckpointIntegrityError,
  getBranchSwitchIntegrityError,
  getTargetBranch,
  normalizeSubjectIssueSuffix,
  parseAgentResult,
  parsePrPlan,
  resolvePrMetadata,
  writeAgentArtifacts,
} from "./pr-analysis.mjs";
import {
  executePrTransaction,
  getStartedCheckpointIntegrityError,
} from "./pr-transaction.mjs";
import {
  determineRequiredChecks,
  normalizeGitPath,
  parseStagedNameStatus,
} from "./validation-policy.mjs";

test("Windows Git 경로를 POSIX 형식으로 정규화한다", () => {
  assert.equal(
    normalizeGitPath("src\\features\\recommendation\\PlaceCard.tsx"),
    "src/features/recommendation/PlaceCard.tsx",
  );
});

test("reset-checkpoint를 값 없는 복구 플래그로 파싱한다", () => {
  assert.deepEqual(parseArgs(["--reset-checkpoint", "--issue", "59"]), {
    "reset-checkpoint": true,
    issue: "59",
  });
});

test("Agent PR plan Markdown 계약을 파싱한다", () => {
  assert.deepEqual(
    parsePrPlan(`
# PR plan

- issue: 63
- mode: create
- type: feat
- subject: 간단 복구 흐름 UI 추가
- slug: simple-recovery-flow
`),
    {
      issue: 63,
      mode: "create",
      type: "feat",
      subject: "간단 복구 흐름 UI 추가",
      slug: "simple-recovery-flow",
    },
  );
});

test("subject의 동일 Issue suffix는 최종 조합 전에 모두 제거한다", () => {
  assert.equal(
    normalizeSubjectIssueSuffix("간단 복구 흐름 UI 추가 (#63) (#63)", 63),
    "간단 복구 흐름 UI 추가",
  );
  assert.throws(
    () => normalizeSubjectIssueSuffix("간단 복구 흐름 UI 추가 (#62)", 63),
    /Issue #62/u,
  );
});

test("dev에서는 Agent metadata와 Issue 번호로 작업 branch를 결정한다", () => {
  const metadata = resolvePrMetadata(
    {
      type: "feat",
      subject: "간편 복구 기본 정보 추가",
      slug: "simple-recovery-info",
      prBody: "body",
    },
    null,
  );

  assert.equal(
    getTargetBranch({ sourceBranch: "dev", issue: 63, ...metadata }),
    "feat/63-simple-recovery-info",
  );
});

test("기존 작업 branch에서는 branch의 type과 slug를 source of truth로 사용한다", () => {
  const metadata = resolvePrMetadata(
    {
      type: "feat",
      subject: "PR Agent 단순화",
      slug: "different-agent-slug",
      prBody: "body",
    },
    { type: "fix", issue: 76, slug: "pr-agent-unrelated-files" },
  );

  assert.equal(metadata.type, "fix");
  assert.equal(metadata.slug, "pr-agent-unrelated-files");
  assert.equal(
    getTargetBranch({
      sourceBranch: "fix/76-pr-agent-unrelated-files",
      issue: 76,
      ...metadata,
    }),
    "fix/76-pr-agent-unrelated-files",
  );
});

test("update mode의 기존 branch는 새 target branch를 만들지 않는다", () => {
  assert.equal(
    getTargetBranch({
      sourceBranch: "fix/76-pr-agent-unrelated-files",
      issue: 76,
      type: "fix",
      slug: "pr-agent-unrelated-files",
    }),
    "fix/76-pr-agent-unrelated-files",
  );
});

test("작업 branch 생성 전후 working tree fingerprint 보존을 검증한다", () => {
  assert.equal(getBranchSwitchIntegrityError("same", "same"), null);
  assert.match(
    getBranchSwitchIntegrityError("before", "after"),
    /working tree가 달라졌습니다/u,
  );
});

test("staging 실패 후 동일한 분석 checkpoint는 Agent 재실행 없이 재개할 수 있다", () => {
  const checkpoint = {
    phase: "agentAnalysisComplete",
    issue: 63,
    mode: "create",
    sourceBranch: "dev",
    targetBranch: "feat/63-simple-recovery",
    changesFingerprint: "changes",
    planFingerprint: "plan",
  };

  assert.equal(
    getAnalysisCheckpointIntegrityError(checkpoint, {
      issue: 63,
      mode: "create",
      branch: "dev",
      changesFingerprint: "changes",
      planFingerprint: "plan",
    }),
    null,
  );
  assert.match(
    getAnalysisCheckpointIntegrityError(checkpoint, {
      issue: 63,
      mode: "create",
      branch: "dev",
      changesFingerprint: "changed",
      planFingerprint: "plan",
    }),
    /변경사항이 달라졌습니다/u,
  );
});

test("fingerprint가 없는 구버전 started checkpoint는 변경된 staged diff를 commit하지 않는다", () => {
  for (const checkpoint of [
    {
      mode: "update",
      phase: "started",
      commit: "base",
      workingTreeFingerprint: "old-working-tree",
    },
    {
      mode: "update",
      phase: "started",
      commit: "base",
      stagedFingerprint: "old-staged-diff",
    },
  ]) {
    const error = getStartedCheckpointIntegrityError(checkpoint, {
      stagedFingerprint: "changed-staged-diff",
      workingTreeFingerprint: "changed-working-tree",
    });
    let committed = false;

    if (!error) committed = true;

    assert.match(error, /--reset-checkpoint/u);
    assert.equal(committed, false);
  }
});

test("fingerprint가 일치하는 started checkpoint는 정상 재개할 수 있다", () => {
  const checkpoint = {
    mode: "update",
    phase: "started",
    commit: "base",
    stagedFingerprint: "staged",
    workingTreeFingerprint: "working-tree",
  };

  assert.equal(
    getStartedCheckpointIntegrityError(checkpoint, {
      stagedFingerprint: "staged",
      workingTreeFingerprint: "working-tree",
    }),
    null,
  );
});

test("tracked 파일이 M 상태를 유지해도 unstaged 내용 변경을 감지한다", () => {
  const before = fingerprintWorkingTree({
    trackedDiff: Buffer.from("binary-diff-before\0", "utf8"),
    untrackedFiles: [],
  });
  const after = fingerprintWorkingTree({
    trackedDiff: Buffer.from("binary-diff-after\0", "utf8"),
    untrackedFiles: [],
  });

  assert.notEqual(before, after);
  assert.match(
    getStartedCheckpointIntegrityError(
      {
        phase: "started",
        stagedFingerprint: "staged",
        workingTreeFingerprint: before,
      },
      { stagedFingerprint: "staged", workingTreeFingerprint: after },
    ),
    /working tree/u,
  );
});

test("동일한 untracked 경로의 내용 변경을 감지한다", () => {
  const before = fingerprintWorkingTree({
    trackedDiff: "",
    untrackedFiles: [{ path: "tmp/data.bin", content: Buffer.from([0, 1, 2]) }],
  });
  const after = fingerprintWorkingTree({
    trackedDiff: "",
    untrackedFiles: [{ path: "tmp/data.bin", content: Buffer.from([0, 1, 3]) }],
  });

  assert.notEqual(before, after);
  assert.match(
    getStartedCheckpointIntegrityError(
      {
        phase: "started",
        stagedFingerprint: "staged",
        workingTreeFingerprint: before,
      },
      { stagedFingerprint: "staged", workingTreeFingerprint: after },
    ),
    /working tree/u,
  );
});

test("동일한 working tree 내용은 파일 열거 순서와 무관하게 정상 재개한다", () => {
  const files = [
    { path: "z.bin", content: Buffer.from([255, 0]) },
    { path: "a.txt", content: Buffer.from("same", "utf8") },
  ];
  const before = fingerprintWorkingTree({
    trackedDiff: "same tracked diff",
    untrackedFiles: files,
  });
  const after = fingerprintWorkingTree({
    trackedDiff: "same tracked diff",
    untrackedFiles: [...files].reverse(),
  });

  assert.equal(before, after);
  assert.equal(
    getStartedCheckpointIntegrityError(
      {
        phase: "started",
        stagedFingerprint: "staged",
        workingTreeFingerprint: before,
      },
      { stagedFingerprint: "staged", workingTreeFingerprint: after },
    ),
    null,
  );
});

test("Issue 종료 및 내부 참조 키워드를 파싱하고 중복을 제거한다", () => {
  assert.deepEqual(
    issueReferencesFromPr(
      "Closes #42\nFixes #42\nResolved #42\nResolves #42\nRefs #42",
    ),
    [42],
  );
  assert.deepEqual(
    issueReferencesFromPr("closing #1 fixing #2 resolving #3"),
    [],
  );
});

test("삭제된 staged 코드는 lint에서 제외하되 typecheck는 유지한다", () => {
  const changes = parseStagedNameStatus("D\tsrc/lib/deleted.ts");
  const policy = determineRequiredChecks(changes, { mode: "update" });

  assert.deepEqual(policy.codeFiles, []);
  assert.deepEqual(policy.checks, ["git diff --cached --check", "typecheck"]);
});

test("staged rename은 새 경로만 lint한다", () => {
  const changes = parseStagedNameStatus("R100\tsrc/lib/old.ts\tsrc/lib/new.ts");
  const policy = determineRequiredChecks(changes, { mode: "create" });

  assert.deepEqual(policy.files, ["src/lib/new.ts"]);
  assert.deepEqual(policy.codeFiles, ["src/lib/new.ts"]);
});

for (const mode of ["create", "update"]) {
  test(`${mode} transaction 성공 시 checkpoint를 삭제한다`, () => {
    const persisted = [];
    let cleared = false;
    const result = executePrTransaction({
      checkpoint: null,
      checkpointData: () => ({ mode, commit: "abc" }),
      persistCheckpoint: (checkpoint) => persisted.push(checkpoint.phase),
      clearCheckpoint: () => {
        cleared = true;
      },
      commit: () => {},
      push: () => {},
      updateIssue: () => {},
      updatePr: () => ({ prNumber: 49 }),
    });

    assert.deepEqual(persisted, [
      "started",
      "committed",
      "pushed",
      "prCompleted",
    ]);
    assert.equal(cleared, true);
    assert.equal(result.pr.prNumber, 49);
  });

  test(`${mode} started checkpoint 재개는 commit부터 이어서 실행한다`, () => {
    const calls = [];
    const result = executePrTransaction({
      checkpoint: {
        mode,
        phase: "started",
        commit: "base",
        checksCompleted: true,
        stagedFingerprint: "staged",
        workingTreeFingerprint: "working-tree",
      },
      checkpointData: () => ({ mode, commit: "head" }),
      persistCheckpoint: (checkpoint) => calls.push(`save:${checkpoint.phase}`),
      clearCheckpoint: () => calls.push("clear"),
      commit: () => calls.push("commit"),
      push: () => calls.push("push"),
      updateIssue: () => calls.push("issue"),
      updatePr: () => {
        calls.push("pr");
        return { prNumber: 59, prUrl: "https://example.test/pull/59" };
      },
    });

    assert.deepEqual(calls, [
      "commit",
      "save:committed",
      "push",
      "save:pushed",
      "issue",
      "pr",
      "save:prCompleted",
      "clear",
    ]);
    assert.equal(result.pr.prNumber, 59);
  });

  test(`${mode} committed checkpoint 재개는 commit을 반복하지 않는다`, () => {
    const calls = [];
    executePrTransaction({
      checkpoint: { mode, phase: "committed", commit: "head" },
      checkpointData: () => ({ mode, commit: "head" }),
      persistCheckpoint: (checkpoint) => calls.push(`save:${checkpoint.phase}`),
      clearCheckpoint: () => calls.push("clear"),
      commit: () => calls.push("commit"),
      push: () => calls.push("push"),
      updateIssue: () => calls.push("issue"),
      updatePr: () => {
        calls.push("pr");
        return { prNumber: 59, prUrl: "https://example.test/pull/59" };
      },
    });

    assert.deepEqual(calls, [
      "push",
      "save:pushed",
      "issue",
      "pr",
      "save:prCompleted",
      "clear",
    ]);
  });
}

test("transaction 실패 시 checkpoint를 유지한다", () => {
  const persisted = [];
  let cleared = false;
  let failurePhase;

  assert.throws(() =>
    executePrTransaction({
      checkpoint: null,
      checkpointData: () => ({ mode: "create", commit: "abc" }),
      persistCheckpoint: (checkpoint) => persisted.push(checkpoint.phase),
      clearCheckpoint: () => {
        cleared = true;
      },
      onFailure: ({ checkpoint }) => {
        failurePhase = checkpoint.phase;
      },
      commit: () => {},
      push: () => {},
      updateIssue: () => {},
      updatePr: () => {
        throw new Error("PR 실패");
      },
    }),
  );

  assert.deepEqual(persisted, ["started", "committed", "pushed"]);
  assert.equal(cleared, false);
  assert.equal(failurePhase, "pushed");
});

test("commit 실패 전에도 started checkpoint를 유지한다", () => {
  const persisted = [];
  let cleared = false;

  assert.throws(() =>
    executePrTransaction({
      checkpoint: null,
      checkpointData: () => ({ mode: "update", commit: "base" }),
      persistCheckpoint: (checkpoint) => persisted.push(checkpoint.phase),
      clearCheckpoint: () => {
        cleared = true;
      },
      commit: () => {
        throw new Error("commit 실패");
      },
      push: () => {},
      updateIssue: () => {},
      updatePr: () => ({}),
    }),
  );

  assert.deepEqual(persisted, ["started"]);
  assert.equal(cleared, false);
});

test("prCompleted 재실행은 기존 PR을 재사용하고 checkpoint만 삭제한다", () => {
  let savedCheckpoint;
  let updatePrCalls = 0;
  let updateIssueCalls = 0;

  assert.throws(() =>
    executePrTransaction({
      checkpoint: null,
      checkpointData: () => ({
        mode: "create",
        branch: "feat/48-automation",
        issue: 48,
        commit: "abc",
      }),
      persistCheckpoint: (checkpoint) => {
        savedCheckpoint = checkpoint;
      },
      clearCheckpoint: () => {
        throw new Error("checkpoint 삭제 실패");
      },
      commit: () => {},
      push: () => {},
      updateIssue: () => {
        updateIssueCalls += 1;
      },
      updatePr: () => {
        updatePrCalls += 1;
        return { prNumber: 49, prUrl: "https://example.test/pull/49" };
      },
    }),
  );

  assert.equal(savedCheckpoint.phase, "prCompleted");
  assert.equal(savedCheckpoint.prNumber, 49);
  assert.equal(savedCheckpoint.prUrl, "https://example.test/pull/49");

  let cleared = false;
  const recovered = executePrTransaction({
    checkpoint: savedCheckpoint,
    checkpointData: () => {
      throw new Error("재실행에서 checkpointData를 호출하면 안 됩니다.");
    },
    persistCheckpoint: () => {
      throw new Error("재실행에서 checkpoint를 다시 저장하면 안 됩니다.");
    },
    clearCheckpoint: () => {
      cleared = true;
    },
    commit: () => {
      throw new Error("재실행에서 commit하면 안 됩니다.");
    },
    push: () => {
      throw new Error("재실행에서 push하면 안 됩니다.");
    },
    updateIssue: () => {
      updateIssueCalls += 1;
    },
    updatePr: () => {
      updatePrCalls += 1;
      return {};
    },
  });

  assert.equal(updateIssueCalls, 1);
  assert.equal(updatePrCalls, 1);
  assert.equal(cleared, true);
  assert.deepEqual(recovered.pr, {
    prNumber: 49,
    prUrl: "https://example.test/pull/49",
  });
});

const validAgentJson = JSON.stringify({
  type: "feat",
  subject: "간편 복구 화면 추가",
  slug: "simple-recovery-page",
  prBody: "## 변경 내용\n\nCloses #63",
});

test("최소 Agent metadata schema를 검증한다", () => {
  assert.deepEqual(parseAgentResult(validAgentJson), JSON.parse(validAgentJson));
  for (const field of ["type", "subject", "slug", "prBody"]) {
    const value = JSON.parse(validAgentJson);
    delete value[field];
    assert.throws(() => parseAgentResult(JSON.stringify(value)), /필드가 없거나/u);
  }
});

test("schema 교정 prompt는 최소 metadata 네 필드만 요구한다", () => {
  const prompt = buildAgentResultRepairPrompt({
    output: '{"type":"fix"}',
    validationError: "필드가 없습니다.",
  });
  assert.match(prompt, /schema만 수정/u);
  assert.match(prompt, /type, subject, slug, prBody 네 필드/u);
});

test("Agent는 JSON만 반환하고 Node가 기존 Markdown 파일을 생성한다", () => {
  const created = [];
  const written = new Map();
  const removed = [];
  const result = parseAgentResult(validAgentJson);

  writeAgentArtifacts(result, ".tmp/planb-pr", { issue: 63, mode: "create" }, {
    mkdir: (path, options) => created.push({ path, options }),
    writeFile: (path, content) =>
      written.set(path.replaceAll("\\", "/"), content),
    removeFile: (path) => removed.push(path.replaceAll("\\", "/")),
  });

  const contentFor = (name) =>
    [...written].find(([path]) => path.endsWith(`/planb-pr/${name}`))?.[1];
  assert.equal(created.length, 1);
  assert.match(contentFor("pr-plan.md"), /- issue: 63/u);
  assert.equal(removed.some((path) => path.endsWith("issue-result.md")), true);
  assert.equal(
    contentFor("pr-body.md"),
    "## 변경 내용\n\nCloses #63\n",
  );
  assert.equal(removed.some((path) => path.endsWith("issue-body.md")), true);
});

test("Agent JSON 파싱 실패 시 파일, checkpoint, staging을 시작하지 않는다", () => {
  let wrote = false;
  let checkpointed = false;
  let staged = false;

  assert.throws(() => {
    const result = parseAgentResult("분석 완료\n```json\n{}\n```");
    writeAgentArtifacts(result, ".tmp/planb-pr", { issue: 63, mode: "create" }, {
      mkdir: () => {
        wrote = true;
      },
    });
    checkpointed = true;
    staged = true;
  }, /단일 JSON 객체/u);
  assert.equal(wrote, false);
  assert.equal(checkpointed, false);
  assert.equal(staged, false);
});

test("Node tmp 쓰기 실패 시 checkpoint와 staging을 시작하지 않는다", () => {
  let checkpointed = false;
  let staged = false;
  const result = parseAgentResult(validAgentJson);

  assert.throws(() => {
    writeAgentArtifacts(result, ".tmp/planb-pr", { issue: 63, mode: "create" }, {
      mkdir: () => {},
      writeFile: () => {
        throw new Error("EACCES");
      },
    });
    checkpointed = true;
    staged = true;
  }, /EACCES/u);
  assert.equal(checkpointed, false);
  assert.equal(staged, false);
});

test("Agent JSON contract는 순수 객체와 앞뒤 whitespace를 허용한다", () => {
  assert.equal(normalizeAgentJsonResponse('{"one":1}'), '{"one":1}');
  assert.equal(normalizeAgentJsonResponse(' \r\n {"one":1} \n '), '{"one":1}');
});

test("Agent JSON contract는 정확히 하나의 json fence만 복구한다", () => {
  assert.equal(
    normalizeAgentJsonResponse('```json\n{"one":1}\n```'),
    '{"one":1}',
  );
});

test("Agent JSON contract는 설명문과 정확히 하나의 fenced JSON을 허용한다", () => {
  assert.equal(
    normalizeAgentJsonResponse('분석 결과입니다.\n```json\n{"one":1}\n```\n완료'),
    '{"one":1}',
  );
});

test("fenced JSON 밖에 다른 JSON 객체가 있으면 거부한다", () => {
  assert.throws(
    () =>
      normalizeAgentJsonResponse(
        '```json\n{"one":1}\n```\n추가 결과: {"two":2}',
      ),
    /JSON 후보가 여러 개/u,
  );
});

for (const [name, raw] of [
  ["JSON 앞 설명문", '분석 결과입니다.\n{"one":1}'],
  ["JSON 뒤 설명문", '{"one":1}\n완료했습니다.'],
  ["JSON 객체 두 개", '{"one":1}\n{"two":2}'],
  ["JSON fence 두 개", '```json\n{"one":1}\n```\n```json\n{"two":2}\n```'],
  ["malformed JSON", '{"one":'],
]) {
  test(`Agent JSON contract는 ${name}을 거부한다`, () => {
    assert.throws(() => normalizeAgentJsonResponse(raw), /Agent/u);
  });
}

test("Agent JSON contract diagnostic은 응답 구조만 노출한다", () => {
  assert.deepEqual(getAgentJsonContractDiagnostics('{"one":1}\n{"two":2}'), {
    startsWithBrace: true,
    endsWithBrace: true,
    hasMarkdownFence: false,
    topLevelObjects: 2,
  });
});

test("Copilot JSONL adapter는 마지막 assistant.message만 반환한다", () => {
  const raw = [
    JSON.stringify({ type: "session.mcp_servers_loaded", data: {} }),
    JSON.stringify({
      type: "assistant.message",
      data: { content: '{"plan":{"issue":63},"prBody":"example: {value}"}' },
    }),
    JSON.stringify({ type: "session.usage_checkpoint", data: {} }),
    JSON.stringify({ type: "result", exitCode: 0 }),
  ].join("\n");

  const result = extractCopilotFinalResponse(raw);
  assert.deepEqual(JSON.parse(result.output), {
    plan: { issue: 63 },
    prBody: "example: {value}",
  });
  assert.equal(result.rawOutputLength, raw.length);
  assert.equal(result.extractedResponseLength, result.output.length);
  assert.match(result.diagnostics, /assistant\.message/u);
});

for (const [name, content, succeeds] of [
  ["순수 JSON", '{"one":1}', true],
  ["json fence", '```json\n{"one":1}\n```', true],
  ["앞 설명문", '분석 결과\n{"one":1}', false],
  ["뒤 설명문", '{"one":1}\n완료', false],
  ["객체 두 개", '{"one":1}\n{"two":2}', false],
  ["설명과 fenced JSON", '설명\n```json\n{"one":1}\n```', true],
  ["fenced JSON 두 개", '```json\n{"one":1}\n```\n```json\n{"two":2}\n```', false],
  ["malformed JSON", '{"one":', false],
]) {
  test(`Copilot JSONL final message contract: ${name}`, () => {
    const raw = [
      JSON.stringify({ type: "assistant.message", data: { content } }),
      JSON.stringify({ type: "result", exitCode: 0 }),
    ].join("\n");
    if (succeeds) assert.doesNotThrow(() => extractCopilotFinalResponse(raw));
    else assert.throws(() => extractCopilotFinalResponse(raw), /Agent/u);
  });
}

test("PR body 계약은 리뷰 정보와 사용자 실행 보고를 분리한다", () => {
  const prompt = buildPrAgentPrompt({
    issue: 65,
    mode: "create",
    existingPr: null,
    context: {
      branch: "dev",
      base: "dev",
      stagedFiles: [],
      unstagedFiles: ["scripts/run-pr-agent.mjs"],
      untrackedFiles: [],
      cachedDevRelation: "cached origin/dev 포함",
      validationPolicy: { checks: ["lint", "typecheck"] },
    },
  });

  assert.match(prompt, /working tree의 모든 변경사항은 이번 PR에 포함하도록 확정/u);
  assert.match(prompt, /Issue 제목과 본문을 분석하거나 diff와 비교하지 마세요/u);
  assert.match(prompt, /"type"/u);
  assert.doesNotMatch(prompt, /unrelatedFiles/u);
});

test("Agent 실행 중 working tree 변경은 artifact와 staging 전에 거부한다", () => {
  assert.match(getAgentMutationError("before", "after"), /작업 트리가 변경/u);
  assert.equal(getAgentMutationError("same", "same"), null);
});

test("metadata scalar의 multiline 값은 거부한다", () => {
  for (const field of ["type", "subject", "slug"]) {
    const value = JSON.parse(validAgentJson);
    value[field] = "safe\nvalue";
    assert.throws(() => parseAgentResult(JSON.stringify(value)), /한 줄/u);
  }
});

test("Codex JSONL의 마지막 agent_message를 추출한다", () => {
  const raw = [
    JSON.stringify({ type: "thread.started" }),
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "old" } }),
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: validAgentJson } }),
  ].join("\n");
  assert.equal(extractCodexFinalResponse(raw).output, validAgentJson);
});

test("fingerprint는 raw diff whitespace와 untracked metadata를 보존한다", () => {
  const base = { path: "tool", content: Buffer.from("same"), type: "file", mode: 0o100644 };
  assert.notEqual(
    fingerprintWorkingTree({ trackedDiff: "line ", untrackedFiles: [base] }),
    fingerprintWorkingTree({ trackedDiff: "line", untrackedFiles: [base] }),
  );
  assert.notEqual(
    fingerprintWorkingTree({ trackedDiff: "", untrackedFiles: [base] }),
    fingerprintWorkingTree({ trackedDiff: "", untrackedFiles: [{ ...base, mode: 0o100755 }] }),
  );
});

test("fingerprint는 Git path의 slash와 backslash를 서로 다르게 보존한다", () => {
  const file = {
    type: "file",
    mode: 0o100644,
    linkTarget: "",
    content: Buffer.from("same"),
  };
  const slashPath = snapshotUntrackedFile("a/b", process.cwd(), {
    lstat: () => ({ mode: file.mode, isFile: () => true, isSymbolicLink: () => false }),
    readFile: () => file.content,
  });
  const backslashPath = snapshotUntrackedFile("a\\b", process.cwd(), {
    lstat: () => ({ mode: file.mode, isFile: () => true, isSymbolicLink: () => false }),
    readFile: () => file.content,
  });

  assert.equal(slashPath.path, "a/b");
  assert.equal(backslashPath.path, "a\\b");
  assert.notEqual(
    fingerprintWorkingTree({ trackedDiff: "", untrackedFiles: [slashPath] }),
    fingerprintWorkingTree({ trackedDiff: "", untrackedFiles: [backslashPath] }),
  );
});

test("Claude와 Copilot은 filesystem write 도구를 명시적으로 deny한다", () => {
  for (const tool of ["Write", "Edit", "MultiEdit", "NotebookEdit"]) {
    assert.match(CLAUDE_DENIED_TOOLS, new RegExp(`(?:^|,)${tool}(?:,|$)`, "u"));
  }
  assert.equal(COPILOT_DENIED_TOOLS.includes("write"), true);
});

test("content length framing은 delimiter collision을 방지한다", () => {
  const first = fingerprintWorkingTree({
    trackedDiff: "",
    untrackedFiles: [
      {
        path: "a",
        type: "file",
        mode: 1,
        linkTarget: "",
        content: Buffer.concat([
          Buffer.from("x"),
          Buffer.from([0]),
          Buffer.from("path"),
          Buffer.from([0]),
          Buffer.from("1"),
          Buffer.from([0]),
          Buffer.from("b"),
        ]),
      },
    ],
  });
  const second = fingerprintWorkingTree({
    trackedDiff: "",
    untrackedFiles: [
      { path: "a", type: "file", mode: 1, linkTarget: "", content: Buffer.from("x") },
      { path: "b", type: "file", mode: 1, linkTarget: "", content: Buffer.alloc(0) },
    ],
  });
  assert.notEqual(first, second);
});

test("unsupported untracked file type은 content read 전에 거부한다", () => {
  let read = false;
  assert.throws(
    () =>
      snapshotUntrackedFile("pipe", process.cwd(), {
        lstat: () => ({ isFile: () => false, isSymbolicLink: () => false }),
        readFile: () => {
          read = true;
          return Buffer.alloc(0);
        },
      }),
    /지원하지 않는 untracked 파일 형식/u,
  );
  assert.equal(read, false);
});

test("Agent 종료 후 staging 전 변경은 staging을 차단한다", () => {
  assert.match(
    getStagingSnapshotError({
      baseline: "before",
      current: "after",
      headDiff: "pending",
      stagedDiff: "pending",
      unstaged: "",
      untracked: "",
    }),
    /staging하지 않습니다/u,
  );
});

test("staging 결과가 분석 snapshot과 다르면 commit 전에 차단한다", () => {
  assert.match(
    getStagingSnapshotError({
      baseline: "same",
      current: "same",
      headDiff: "expected",
      stagedDiff: "different",
      unstaged: "",
      untracked: "",
    }),
    /commit하지 않습니다/u,
  );
});
