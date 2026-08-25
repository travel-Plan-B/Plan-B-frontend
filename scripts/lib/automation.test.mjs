import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  fingerprintRepositoryIndex,
  fingerprintRepositoryWorkingTree,
  fingerprintWorkingTree,
  getStagingSnapshotError,
  snapshotUntrackedFile,
} from "./checkpoint-fingerprint.mjs";
import { DENIED_TOOLS as CLAUDE_DENIED_TOOLS } from "./agents/claude.mjs";
import {
  ALLOWED_TOOLS as COPILOT_ALLOWED_TOOLS,
  DENIED_TOOLS as COPILOT_DENIED_TOOLS,
} from "./agents/copilot.mjs";
import {
  buildAgentResultRepairPrompt,
  buildPrAgentPrompt,
} from "./pr-agent-prompt.mjs";
import {
  CLI_STDERR_TAIL_BYTES,
  extractCopilotFinalResponse,
  extractCodexFinalResponse,
  getAgentJsonContractDiagnostics,
  normalizeAgentJsonResponse,
  runCli,
  truncateCapturedStderr,
} from "./agents/shared.mjs";
import {
  argsWithoutGitPager,
  isQuickIssuePlaceholder,
  issueReferencesFromPr,
  parseArgs,
  QUICK_ISSUE_MARKER,
  QUICK_ISSUE_TITLE,
  TYPES,
} from "./git-github.mjs";
import {
  applyTypeLabels,
  labelForType,
} from "./github-labels.mjs";
import {
  clearAgentArtifacts,
  getAgentMutationError,
  getBranchSwitchIntegrityError,
  getTargetBranch,
  buildQuickIssueUpdate,
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
import {
  assertSafeAgentDiff,
  buildSafeAgentDiff,
} from "./safe-agent-diff.mjs";

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
    records: [{ status: "M", path: "src/a.ts", size: 6, hash: "before" }],
  });
  const after = fingerprintWorkingTree({
    records: [{ status: "M", path: "src/a.ts", size: 5, hash: "after" }],
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

test("모든 작업 type을 GitHub label로 결정적으로 매핑한다", () => {
  for (const type of TYPES) {
    assert.equal(labelForType(type), type);
  }
});

test("Issue와 PR에 기존 label을 보존하는 add-label 명령을 적용한다", () => {
  const calls = [];
  applyTypeLabels({
    type: "fix",
    issueNumber: 76,
    prNumber: 77,
    runCommand: (command, args, options) => {
      calls.push({ command, args, options });
      if (args[0] === "label") {
        return { status: 0, stdout: JSON.stringify([{ name: "fix" }]) };
      }
      return { status: 0, stdout: "" };
    },
    log: () => {},
    warn: () => {},
  });

  assert.deepEqual(calls.slice(1).map(({ args }) => args), [
    ["issue", "edit", "76", "--add-label", "fix"],
    ["pr", "edit", "77", "--add-label", "fix"],
  ]);
  assert.equal(calls.every(({ options }) => options.allowFailure), true);
});

test("repository에 type label이 없으면 write 없이 warning만 출력한다", () => {
  const calls = [];
  const warnings = [];
  applyTypeLabels({
    type: "feat",
    issueNumber: 76,
    prNumber: 77,
    runCommand: (_command, args) => {
      calls.push(args);
      return { status: 0, stdout: JSON.stringify([{ name: "priority" }]) };
    },
    log: () => {},
    warn: (message) => warnings.push(message),
  });

  assert.equal(calls.length, 1);
  assert.match(warnings[0], /feat/u);
});

test("label API 일부 실패는 다른 대상 적용과 PR 완료를 막지 않는다", () => {
  const calls = [];
  const warnings = [];
  applyTypeLabels({
    type: "refactor",
    issueNumber: 80,
    prNumber: 81,
    runCommand: (_command, args) => {
      calls.push(args);
      if (args[0] === "label") {
        return { status: 0, stdout: JSON.stringify([{ name: "refactor" }]) };
      }
      return { status: args[0] === "issue" ? 1 : 0, stdout: "" };
    },
    log: () => {},
    warn: (message) => warnings.push(message),
  });

  assert.equal(calls.some((args) => args[0] === "pr"), true);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Issue #80/u);
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
      afterPrSuccess: () => {},
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
      afterPrSuccess: () => calls.push("issue"),
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
      "pr",
      "save:prCompleted",
      "issue",
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
      afterPrSuccess: () => calls.push("issue"),
      updatePr: () => {
        calls.push("pr");
        return { prNumber: 59, prUrl: "https://example.test/pull/59" };
      },
    });

    assert.deepEqual(calls, [
      "push",
      "save:pushed",
      "pr",
      "save:prCompleted",
      "issue",
      "clear",
    ]);
  });
}

test("transaction 실패 시 checkpoint를 유지한다", () => {
  const persisted = [];
  let cleared = false;
  let failurePhase;
  let afterPrSuccessCalls = 0;

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
      afterPrSuccess: () => {
        afterPrSuccessCalls += 1;
      },
      updatePr: () => {
        throw new Error("PR 실패");
      },
    }),
  );

  assert.deepEqual(persisted, ["started", "committed", "pushed"]);
  assert.equal(cleared, false);
  assert.equal(failurePhase, "pushed");
  assert.equal(afterPrSuccessCalls, 0);
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
      afterPrSuccess: () => {
        throw new Error("commit 실패 뒤에는 호출되면 안 됩니다.");
      },
      updatePr: () => ({}),
    }),
  );

  assert.deepEqual(persisted, ["started"]);
  assert.equal(cleared, false);
});

test("prCompleted 재실행은 기존 PR을 재사용하고 checkpoint만 삭제한다", () => {
  let savedCheckpoint;
  let updatePrCalls = 0;
  let afterPrSuccessCalls = 0;

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
      afterPrSuccess: () => {
        afterPrSuccessCalls += 1;
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
    afterPrSuccess: () => {
      afterPrSuccessCalls += 1;
    },
    updatePr: () => {
      updatePrCalls += 1;
      return {};
    },
  });

  assert.equal(afterPrSuccessCalls, 2);
  assert.equal(updatePrCalls, 1);
  assert.equal(cleared, true);
  assert.deepEqual(recovered.pr, {
    prNumber: 49,
    prUrl: "https://example.test/pull/49",
  });
});

test("Quick Issue placeholder는 정확한 제목과 marker가 모두 있을 때만 식별한다", () => {
  assert.equal(
    isQuickIssuePlaceholder({
      title: QUICK_ISSUE_TITLE,
      body: `${QUICK_ISSUE_MARKER}\n\n작업 내용을 입력해 주세요.`,
    }),
    true,
  );
  assert.equal(
    isQuickIssuePlaceholder({
      title: "[Fix] 이미 정리된 Issue",
      body: QUICK_ISSUE_MARKER,
    }),
    false,
  );
  assert.equal(
    isQuickIssuePlaceholder({
      title: QUICK_ISSUE_TITLE,
      body: "일반 Issue 본문",
    }),
    false,
  );
});

test("Quick Issue update는 최종 PR metadata로 결정적으로 생성한다", () => {
  assert.deepEqual(
    buildQuickIssueUpdate({
      isQuickIssue: true,
      type: "fix",
      subject: "PR 에이전트 실행 흐름 정리",
      prBody: "## 작업 내용\n\n- 실행 흐름을 정리했습니다.\n\nCloses #76",
      prNumber: 77,
    }),
    {
      title: "[Fix] PR 에이전트 실행 흐름 정리",
      body:
        "## 작업 내용\n\n- 실행 흐름을 정리했습니다.\n\nCloses #76\n\n## 관련 PR\n\n#77",
    },
  );
  assert.equal(
    buildQuickIssueUpdate({
      isQuickIssue: false,
      type: "fix",
      subject: "일반 Issue",
      prBody: "PR body",
      prNumber: 77,
    }),
    null,
  );
});

test("PR 성공 뒤 Issue update 실패는 PR transaction을 rollback하지 않는다", () => {
  const warnings = [];
  let cleared = false;
  const result = executePrTransaction({
    checkpoint: null,
    checkpointData: () => ({ mode: "create", commit: "abc" }),
    persistCheckpoint: () => {},
    clearCheckpoint: () => {
      cleared = true;
    },
    commit: () => {},
    push: () => {},
    updatePr: () => ({
      prNumber: 77,
      prUrl: "https://example.test/pull/77",
    }),
    afterPrSuccess: () => {
      throw new Error("Issue update failed");
    },
    onAfterPrFailure: ({ pr, error }) => {
      warnings.push({ prNumber: pr.prNumber, message: error.message });
    },
  });

  assert.equal(result.pr.prNumber, 77);
  assert.equal(cleared, true);
  assert.deepEqual(warnings, [
    { prNumber: 77, message: "Issue update failed" },
  ]);
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

test("새 실행은 이전 Agent 분석 산출물을 정리하고 Git checkpoint는 유지한다", () => {
  const removed = [];

  clearAgentArtifacts(".tmp/planb-pr", {
    removeFile: (path, options) =>
      removed.push({ path: path.replaceAll("\\", "/"), options }),
  });

  assert.deepEqual(
    removed.map(({ path }) => path.split("/").at(-1)),
    [
      "analysis-checkpoint.json",
      "pr-plan.md",
      "pr-body.md",
      "issue-result.md",
      "issue-body.md",
    ],
  );
  assert.equal(
    removed.some(({ path }) => path.endsWith("git-checkpoint.json")),
    false,
  );
  assert.equal(removed.every(({ options }) => options.force === true), true);
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

test("prBody 내부 backtick은 top-level JSON fence로 오인하지 않는다", () => {
  const response = JSON.stringify({
    type: "fix",
    subject: "parser 경계 수정",
    slug: "parser-boundary",
    prBody: "`inline code`와 backtick ` 문자를 포함합니다.",
  });

  assert.equal(normalizeAgentJsonResponse(response), response);
  assert.equal(getAgentJsonContractDiagnostics(response).hasMarkdownFence, false);
});

test("prBody 내부 triple backtick 문자열도 JSON envelope 판정에 영향을 주지 않는다", () => {
  const response = JSON.stringify({
    type: "fix",
    subject: "parser 경계 수정",
    slug: "parser-boundary",
    prBody: "예시:\n```ts\nconst value = 1;\n```",
  });

  assert.equal(normalizeAgentJsonResponse(response), response);
  assert.equal(getAgentJsonContractDiagnostics(response).hasMarkdownFence, false);
});

test("fenced JSON의 prBody 내부 backtick은 바깥 fence만 인식한다", () => {
  const candidate = JSON.stringify({
    type: "fix",
    subject: "parser 경계 수정",
    slug: "parser-boundary",
    prBody: "`inline code`를 포함한 Markdown",
  });

  assert.equal(
    normalizeAgentJsonResponse(`설명문\n\n\`\`\`json\n${candidate}\n\`\`\`\n\n완료`),
    candidate,
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
  assert.match(prompt, /prBody.*triple backtick fenced code block/u);
  assert.doesNotMatch(prompt, /unrelatedFiles/u);
});

test("PR Agent prompt는 binary patch를 금지하고 text diff 분석은 유지한다", () => {
  const prompt = buildPrAgentPrompt({
    issue: 65,
    context: {
      branch: "dev",
      base: "dev",
      stagedFiles: ["public/images/home/hero-map-clean.png"],
      unstagedFiles: ["src/features/home/HeroSection.tsx"],
      untrackedFiles: [],
      safeDiff: "A public/images/home/hero-map-clean.png [binary, 1.3 MB]\n+const hero = true;",
      validationPolicy: { checks: ["lint", "typecheck"] },
    },
  });

  assert.match(prompt, /raw `git diff`를 직접 실행하거나 binary patch 본문/u);
  assert.match(prompt, /`git diff --binary`.*사용하지 마세요/u);
  assert.match(prompt, /binary 파일.*metadata만 분석하세요/u);
  assert.match(prompt, /text source\/config\/docs 파일.*safe textual diff/u);
  assert.match(prompt, /hero-map-clean\.png/u);
  assert.match(prompt, /safe textual diff/u);
  assert.match(prompt, /\+const hero = true/u);
  assert.match(prompt, /raw git diff를 직접 실행하지 않습니다/u);
});

test("Copilot은 raw git diff 권한 없이 안전한 Git metadata 조회만 허용한다", () => {
  assert.equal(COPILOT_ALLOWED_TOOLS.includes("shell(git diff:*)"), false);
  assert.equal(COPILOT_ALLOWED_TOOLS.includes("shell(git status:*)"), true);
  assert.equal(COPILOT_ALLOWED_TOOLS.includes("shell(git log:*)"), true);
  assert.equal(COPILOT_ALLOWED_TOOLS.includes("shell(git ls-files:*)"), true);
});

test("safe diff guard는 독립된 Git binary patch marker만 거부한다", () => {
  assert.throws(
    () => assertSafeAgentDiff("header\nGIT binary patch\nfooter"),
    /binary patch/u,
  );
  assert.throws(
    () => assertSafeAgentDiff("header\nliteral 1234\nfooter"),
    /binary patch/u,
  );
  assert.throws(
    () => assertSafeAgentDiff("header\ndelta 1234\nfooter"),
    /binary patch/u,
  );
});

test("safe diff guard는 source와 Markdown 내부 marker 문구를 허용한다", () => {
  assert.doesNotThrow(() =>
    assertSafeAgentDiff('+const marker = "GIT binary patch";'),
  );
  assert.doesNotThrow(() =>
    assertSafeAgentDiff("+문서에서 `GIT binary patch` 출력을 설명합니다."),
  );
  assert.doesNotThrow(() =>
    assertSafeAgentDiff(
      "+const FORBIDDEN_BINARY_PATCH = /^GIT binary patch$|^(?:literal|delta) \\d+$/mu;",
    ),
  );
});

test("safe Agent diff는 staged binary fixture 본문을 제외하고 text patch는 포함한다", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "planb-safe-diff-"));
  try {
    execFileSync("git", ["init"], { cwd: fixtureRoot, stdio: "ignore" });
    mkdirSync(join(fixtureRoot, "public", "images", "home"), { recursive: true });
    mkdirSync(join(fixtureRoot, "src"), { recursive: true });
    writeFileSync(
      join(fixtureRoot, "public", "images", "home", "hero-map-clean.png"),
      Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]),
        Buffer.from("GIT binary patch\nliteral 1294768\nzcmVfixture"),
      ]),
    );
    writeFileSync(join(fixtureRoot, "src", "Hero.tsx"), "export const Hero = () => <main />;\n");
    writeFileSync(join(fixtureRoot, "src", "hero.css"), ".hero { color: teal; }\n");
    writeFileSync(
      join(fixtureRoot, "src", "markers.ts"),
      'export const marker = "GIT binary patch";\n',
    );
    writeFileSync(
      join(fixtureRoot, "README.md"),
      "문서에서 `GIT binary patch` 출력을 설명합니다.\n",
    );
    writeFileSync(
      join(fixtureRoot, "safe-agent-diff.mjs"),
      "const FORBIDDEN_BINARY_PATCH = /^GIT binary patch$|^(?:literal|delta) \\d+$/mu;\n",
    );
    execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });

    const stagedChanges = parseStagedNameStatus(
      execFileSync("git", ["diff", "--cached", "--name-status"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }),
    );
    const safeDiff = buildSafeAgentDiff({
      cwd: fixtureRoot,
      stagedChanges,
      unstagedChanges: [],
      untrackedFiles: [],
      gitOutput: (args) =>
        execFileSync("git", args, { cwd: fixtureRoot, encoding: "utf8" }),
    });

    assert.doesNotMatch(safeDiff, /^GIT binary patch$|^literal 1294768$/mu);
    assert.doesNotMatch(safeDiff, /zcmVfixture/u);
    assert.match(safeDiff, /A public\/images\/home\/hero-map-clean\.png \[binary/u);
    assert.match(safeDiff, /\+export const Hero/u);
    assert.match(safeDiff, /\+\.hero \{ color: teal; \}/u);
    assert.match(safeDiff, /\+export const marker = "GIT binary patch"/u);
    assert.match(safeDiff, /\+문서에서 `GIT binary patch`/u);
    assert.match(safeDiff, /safe-agent-diff\.mjs/u);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("runCli는 stdout을 캡처하고 요청된 경우 정상 stderr를 숨긴다", () => {
  const stdout = runCli(
    process.execPath,
    ["-e", 'process.stdout.write("stdout-ok"); process.stderr.write("hidden-warning")'],
    { displayName: "fixture", captureOutput: true, captureStderr: true },
  );
  assert.equal(stdout, "stdout-ok");
});

test("공통 Git helper는 모든 Git 명령에 --no-pager를 적용한다", () => {
  assert.deepEqual(argsWithoutGitPager("git", ["status", "--short"]), [
    "--no-pager",
    "status",
    "--short",
  ]);
  assert.deepEqual(argsWithoutGitPager("gh", ["pr", "view"]), [
    "pr",
    "view",
  ]);
});

test("Agent CLI 자식 프로세스는 Git pager 비활성화 환경을 상속한다", () => {
  const pager = runCli(
    process.execPath,
    ["-e", "process.stdout.write(process.env.GIT_PAGER || '')"],
    { displayName: "fixture", captureOutput: true },
  );
  assert.equal(pager, "cat");
});

test("runCli 실패는 대용량 stderr 전체 대신 마지막 8KB만 보고한다", () => {
  const moduleUrl = pathToFileURL(resolve("scripts/lib/agents/shared.mjs")).href;
  const probe = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { runCli } from ${JSON.stringify(moduleUrl)}; runCli(process.execPath, ["-e", "process.stderr.write('BINARY_PREFIX' + 'x'.repeat(20000) + 'FINAL_ERROR'); process.exit(7)"], { displayName: "fixture", captureOutput: true, captureStderr: true });`,
    ],
    { encoding: "utf8" },
  );

  assert.equal(probe.status, 1);
  assert.match(probe.stderr, /stderr 마지막 8KB/u);
  assert.match(probe.stderr, /FINAL_ERROR/u);
  assert.doesNotMatch(probe.stderr, /BINARY_PREFIX/u);
  assert.ok(Buffer.byteLength(probe.stderr) < CLI_STDERR_TAIL_BYTES + 1024);
});

test("stderr tail helper는 진단 끝부분과 생략 크기를 보존한다", () => {
  const diagnostic = truncateCapturedStderr(
    `PREFIX${"x".repeat(10000)}FINAL_ERROR`,
    1024,
  );
  assert.match(diagnostic, /^\[stderr 앞부분 \d+ bytes 생략\]/u);
  assert.match(diagnostic, /FINAL_ERROR$/u);
  assert.doesNotMatch(diagnostic, /PREFIX/u);
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

test("fingerprint는 content hash와 파일 metadata를 보존한다", () => {
  const base = { path: "tool", content: Buffer.from("same"), type: "file", mode: 0o100644 };
  assert.notEqual(
    fingerprintWorkingTree({ untrackedFiles: [base] }),
    fingerprintWorkingTree({ untrackedFiles: [{ ...base, content: Buffer.from("changed") }] }),
  );
  assert.notEqual(
    fingerprintWorkingTree({ untrackedFiles: [base] }),
    fingerprintWorkingTree({ untrackedFiles: [{ ...base, mode: 0o100755 }] }),
  );
});

test("repository fingerprint는 binary patch 없이 name-status metadata를 사용한다", () => {
  const calls = [];
  fingerprintRepositoryWorkingTree({
    cwd: process.cwd(),
    gitOutput: (args) => {
      calls.push(args);
      return "";
    },
  });
  assert.deepEqual(calls[0], [
    "diff",
    "HEAD",
    "--no-renames",
    "--name-status",
    "-z",
    "--no-ext-diff",
  ]);
  assert.equal(calls.flat().includes("--binary"), false);
});

test("rename staging 전후 working tree fingerprint는 같고 내용 변경은 감지한다", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "planb-rename-fingerprint-"));
  const git = (args) =>
    execFileSync("git", args, { cwd: fixtureRoot, encoding: "utf8" });

  try {
    execFileSync("git", ["init"], { cwd: fixtureRoot, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "fixture@example.com"], {
      cwd: fixtureRoot,
    });
    execFileSync("git", ["config", "user.name", "Fixture"], {
      cwd: fixtureRoot,
    });
    writeFileSync(join(fixtureRoot, "before.ts"), "export const value = 1;\n");
    execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });
    execFileSync("git", ["commit", "-m", "fixture"], {
      cwd: fixtureRoot,
      stdio: "ignore",
    });

    renameSync(join(fixtureRoot, "before.ts"), join(fixtureRoot, "after.ts"));
    const beforeStaging = fingerprintRepositoryWorkingTree({
      cwd: fixtureRoot,
      gitOutput: git,
    });

    execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });
    const afterStaging = fingerprintRepositoryWorkingTree({
      cwd: fixtureRoot,
      gitOutput: git,
    });

    assert.equal(afterStaging, beforeStaging);
    assert.match(git(["diff", "--cached", "--name-status", "-M"]), /^R/u);

    writeFileSync(join(fixtureRoot, "after.ts"), "export const value = 2;\n");
    assert.notEqual(
      fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git }),
      afterStaging,
    );
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("index fingerprint는 특수문자 경로를 literal pathspec으로 조회한다", () => {
  const paths = ["a[1].png", "img?.png", "file*.png"];
  const lsFilesCalls = [];
  const fingerprint = fingerprintRepositoryIndex({
    gitOutput: (args) => {
      if (args[0] === "diff") {
        return paths.map((path) => `A\0${path}\0`).join("");
      }
      if (args[1] === "ls-files") {
        lsFilesCalls.push(args);
        const path = args.at(-1);
        return `100644 abcdef1234567890 0\t${path}\0`;
      }
      if (args[0] === "cat-file") return "42\n";
      throw new Error(`예상하지 못한 Git 호출: ${args.join(" ")}`);
    },
  });

  assert.match(fingerprint, /^[0-9a-f]{64}$/u);
  assert.deepEqual(
    lsFilesCalls.map((args) => args.slice(0, -1)),
    paths.map(() => ["--literal-pathspecs", "ls-files", "-s", "-z", "--"]),
  );
  assert.deepEqual(lsFilesCalls.map((args) => args.at(-1)), paths);
});

test("safe textual diff도 직접 전달한 경로를 literal pathspec으로 조회한다", () => {
  const calls = [];
  const safeDiff = buildSafeAgentDiff({
    cwd: process.cwd(),
    stagedChanges: [{ status: "M", path: "src/a[1]?.ts" }],
    unstagedChanges: [],
    untrackedFiles: [],
    gitOutput: (args) => {
      calls.push(args);
      return args.includes("--numstat") ? "1\t1\tsrc/a[1]?.ts\n" : "+changed\n";
    },
  });

  assert.match(safeDiff, /\+changed/u);
  assert.equal(calls.length, 2);
  for (const args of calls) {
    assert.deepEqual(args.slice(0, 2), ["--literal-pathspecs", "diff"]);
    assert.equal(args.at(-1), "src/a[1]?.ts");
  }
});

test("hash fingerprint는 binary, text, untracked, staging 변경을 patch 생성 없이 검증한다", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "planb-fingerprint-"));
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return execFileSync("git", args, { cwd: fixtureRoot, encoding: "utf8" });
  };
  try {
    execFileSync("git", ["init"], { cwd: fixtureRoot, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "fixture@example.com"], { cwd: fixtureRoot });
    execFileSync("git", ["config", "user.name", "Fixture"], { cwd: fixtureRoot });
    mkdirSync(join(fixtureRoot, "src"), { recursive: true });
    mkdirSync(join(fixtureRoot, "public"), { recursive: true });
    writeFileSync(join(fixtureRoot, "src", "app.tsx"), "export const value = 1;\n");
    writeFileSync(join(fixtureRoot, "public", "image.png"), Buffer.from([0x89, 0x50, 0x00, 1]));
    execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });
    execFileSync("git", ["commit", "-m", "fixture"], { cwd: fixtureRoot, stdio: "ignore" });

    const clean = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    writeFileSync(join(fixtureRoot, "public", "image.png"), Buffer.from([0x89, 0x50, 0x00, 2]));
    const binaryChanged = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    assert.notEqual(binaryChanged, clean);

    writeFileSync(join(fixtureRoot, "src", "app.tsx"), "export const value = 2;\n");
    const textChanged = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    assert.notEqual(textChanged, binaryChanged);

    writeFileSync(join(fixtureRoot, "public", "new.png"), Buffer.from([0x89, 0x50, 3]));
    const untrackedAdded = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    writeFileSync(join(fixtureRoot, "public", "new.png"), Buffer.from([0x89, 0x50, 4]));
    const untrackedChanged = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    assert.notEqual(untrackedAdded, untrackedChanged);

    const analysisSnapshot = untrackedChanged;
    execFileSync("git", ["add", "public/image.png"], { cwd: fixtureRoot });
    assert.match(
      getStagingSnapshotError({
        baseline: analysisSnapshot,
        current: fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git }),
        unstaged: git(["diff", "--name-only"]),
        untracked: git(["ls-files", "--others", "--exclude-standard"]),
      }),
      /commit하지 않습니다/u,
    );
    execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });
    assert.equal(
      fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git }),
      analysisSnapshot,
    );
    const stagedBefore = fingerprintRepositoryIndex({ gitOutput: git });
    writeFileSync(join(fixtureRoot, "public", "image.png"), Buffer.from([0x89, 0x50, 0x00, 5]));
    assert.notEqual(
      fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git }),
      analysisSnapshot,
    );
    execFileSync("git", ["add", "public/image.png"], { cwd: fixtureRoot });
    assert.notEqual(fingerprintRepositoryIndex({ gitOutput: git }), stagedBefore);

    rmSync(join(fixtureRoot, "src", "app.tsx"));
    const deleted = fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git });
    assert.notEqual(deleted, analysisSnapshot);
    rmSync(join(fixtureRoot, "public", "image.png"));
    assert.notEqual(
      fingerprintRepositoryWorkingTree({ cwd: fixtureRoot, gitOutput: git }),
      deleted,
    );
    assert.equal(calls.flat().includes("--binary"), false);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("symlink snapshot은 link target을 hash에 반영한다", () => {
  const options = (target) => ({
    lstat: () => ({ mode: 0o120000, isFile: () => false, isSymbolicLink: () => true }),
    readFile: () => {
      throw new Error("symlink content를 file로 읽으면 안 됩니다.");
    },
    readlink: () => target,
  });
  const first = snapshotUntrackedFile("link", process.cwd(), options("first"));
  const second = snapshotUntrackedFile("link", process.cwd(), options("second"));
  assert.equal(first.type, "symlink");
  assert.notEqual(fingerprintWorkingTree({ records: [first] }), fingerprintWorkingTree({ records: [second] }));
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
    /지원하지 않는 파일 형식/u,
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
      unstaged: "src/missing.ts",
      untracked: "",
    }),
    /commit하지 않습니다/u,
  );
});

test("staging 이후 snapshot 불일치는 commit 단계에 맞는 오류를 표시한다", () => {
  const error = getStagingSnapshotError({
    baseline: "before",
    current: "after",
    unstaged: "",
    untracked: "",
    afterStaging: true,
  });

  assert.match(error, /staging 이후/u);
  assert.match(error, /commit하지 않습니다/u);
  assert.doesNotMatch(error, /staging하지 않습니다/u);
});
