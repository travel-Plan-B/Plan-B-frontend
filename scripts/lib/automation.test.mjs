import assert from "node:assert/strict";
import test from "node:test";

import { fingerprintWorkingTree } from "./checkpoint-fingerprint.mjs";
import { issueReferencesFromPr, parseArgs } from "./git-github.mjs";
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
    untrackedFiles: [
      { path: "tmp/data.bin", content: Buffer.from([0, 1, 2]) },
    ],
  });
  const after = fingerprintWorkingTree({
    trackedDiff: "",
    untrackedFiles: [
      { path: "tmp/data.bin", content: Buffer.from([0, 1, 3]) },
    ],
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
