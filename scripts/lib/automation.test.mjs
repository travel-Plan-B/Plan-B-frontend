import assert from "node:assert/strict";
import test from "node:test";

import { fingerprintWorkingTree } from "./checkpoint-fingerprint.mjs";
import { buildPrAgentPrompt } from "./pr-agent-prompt.mjs";
import {
  extractCopilotFinalResponse,
  extractSingleJsonObjectResponse,
} from "./agents/shared.mjs";
import { issueReferencesFromPr, parseArgs } from "./git-github.mjs";
import {
  findUnrelatedToolingChanges,
  getAnalysisCheckpointIntegrityError,
  getScopeBlockReason,
  normalizeSubjectIssueSuffix,
  parseAgentResult,
  parsePrPlan,
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
- scope: all
- validation: pr:finish 필수 검증에 위임
`),
    {
      issue: 63,
      mode: "create",
      type: "feat",
      subject: "간단 복구 흐름 UI 추가",
      slug: "simple-recovery-flow",
      scope: "all",
      validation: "pr:finish 필수 검증에 위임",
    },
  );
});

test("unrelated 변경을 나타내는 PR plan은 staging 전에 거부한다", () => {
  assert.throws(
    () =>
      parsePrPlan(`
- issue: 63
- mode: create
- type: feat
- subject: 작업 요약
- slug: work-summary
- scope: partial
- validation: pending
`),
    /scope가 all이 아닙니다/u,
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
  plan: {
    issue: 63,
    mode: "create",
    type: "feat",
    subject: "간편 복구 화면 추가",
    slug: "simple-recovery-page",
    scope: "all",
    validation: "pr:finish 검증에 위임",
    unrelatedFiles: [],
  },
  issueResult: "## 작업 결과",
  prBody: "## 변경 내용\n\nCloses #63",
  issueBody: null,
});

test("Agent는 JSON만 반환하고 Node가 기존 Markdown 파일을 생성한다", () => {
  const created = [];
  const written = new Map();
  const removed = [];
  const result = parseAgentResult(validAgentJson);

  writeAgentArtifacts(result, ".tmp/planb-pr", {
    mkdir: (path, options) => created.push({ path, options }),
    writeFile: (path, content) =>
      written.set(path.replaceAll("\\", "/"), content),
    removeFile: (path) => removed.push(path.replaceAll("\\", "/")),
  });

  const contentFor = (name) =>
    [...written].find(([path]) => path.endsWith(`/planb-pr/${name}`))?.[1];
  assert.equal(created.length, 1);
  assert.match(contentFor("pr-plan.md"), /- scope: all/u);
  assert.equal(contentFor("issue-result.md"), "## 작업 결과\n");
  assert.equal(
    contentFor("pr-body.md"),
    "## 변경 내용\n\nCloses #63\n",
  );
  assert.equal(removed[0].endsWith("/planb-pr/issue-body.md"), true);
});

test("Agent JSON 파싱 실패 시 파일, checkpoint, staging을 시작하지 않는다", () => {
  let wrote = false;
  let checkpointed = false;
  let staged = false;

  assert.throws(() => {
    const result = parseAgentResult("분석 완료\n```json\n{}\n```");
    writeAgentArtifacts(result, ".tmp/planb-pr", {
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
    writeAgentArtifacts(result, ".tmp/planb-pr", {
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

test("UI Issue에 섞인 automation 변경은 scope all이어도 staging 전에 거부한다", () => {
  const result = parseAgentResult(validAgentJson);
  const unrelated = findUnrelatedToolingChanges(
    [
      "src/features/recovery/simple/SimpleRecoveryReasonPage.tsx",
      "scripts/create-pr.mjs",
      "scripts/lib/agents/codex.mjs",
    ],
    { title: "간편복구 UI 구현", body: "1단계 화면을 추가합니다." },
  );

  assert.deepEqual(unrelated, [
    "scripts/create-pr.mjs",
    "scripts/lib/agents/codex.mjs",
  ]);
  assert.match(getScopeBlockReason(result, unrelated), /PR 범위를 분리/u);
});

test("자동화 Issue의 scripts 변경은 deterministic scope guard를 통과한다", () => {
  assert.deepEqual(
    findUnrelatedToolingChanges(["scripts/run-pr-agent.mjs"], {
      title: "PR 자동화 안정화",
      body: "Agent와 orchestrator 책임을 분리합니다.",
    }),
    [],
  );
});

for (const [name, raw] of [
  ["정상 JSON", '{"plan":{"issue":63}}'],
  ["앞에 CLI 로그", 'Starting...\n{"plan":{"issue":63}}'],
  [
    "뒤에 CLI 통계",
    '{"plan":{"issue":63}}\nChanges +0 -0\nAI Credits 0',
  ],
  [
    "앞뒤 CLI 로그",
    'CLI LOG\n{"plan":{"issue":63}}\nCLI STATS',
  ],
  [
    "JSON 문자열 내부 중괄호",
    '{"plan":{"issue":63},"prBody":"example: {value}"}',
  ],
]) {
  test(`Agent final response scanner: ${name}`, () => {
    assert.doesNotThrow(() => JSON.parse(extractSingleJsonObjectResponse(raw)));
  });
}

test("Agent final response scanner는 JSON이 없으면 실패한다", () => {
  assert.throws(
    () => extractSingleJsonObjectResponse("CLI LOG ONLY"),
    /JSON 객체를 찾을 수 없습니다/u,
  );
});

test("Agent final response scanner는 JSON 객체가 두 개면 실패한다", () => {
  assert.throws(
    () => extractSingleJsonObjectResponse('{"one":1}\n{"two":2}'),
    /여러 개/u,
  );
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

  assert.match(prompt, /작업 목적, 주요 변경 사항, 검증 결과, 관련 Issue/u);
  assert.match(prompt, /branch name, commit SHA, push\/upstream 상태/u);
  assert.match(prompt, /사용자에게 보여줄 실행 완료 보고/u);
});
