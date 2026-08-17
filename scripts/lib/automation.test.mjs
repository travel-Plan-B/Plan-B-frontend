import assert from "node:assert/strict";
import test from "node:test";

import { issueReferencesFromPr } from "./git-github.mjs";
import { executePrTransaction } from "./pr-transaction.mjs";
import {
  determineRequiredChecks,
  parseStagedNameStatus,
} from "./validation-policy.mjs";

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

    assert.deepEqual(persisted, ["started", "committed", "pushed"]);
    assert.equal(cleared, true);
    assert.equal(result.pr.prNumber, 49);
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
