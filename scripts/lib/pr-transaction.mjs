export function getStartedCheckpointIntegrityError(
  checkpoint,
  { stagedFingerprint, workingTreeFingerprint },
) {
  if (checkpoint?.phase !== "started") return null;
  if (!checkpoint.stagedFingerprint || !checkpoint.workingTreeFingerprint) {
    return "기존 Git checkpoint는 상태를 검증할 수 없습니다. --reset-checkpoint로 초기화하세요.";
  }
  if (checkpoint.workingTreeFingerprint !== workingTreeFingerprint) {
    return "Git checkpoint 이후 working tree 상태가 변경되었습니다. 자동 재개하지 않습니다.";
  }
  if (checkpoint.stagedFingerprint !== stagedFingerprint) {
    return "Git checkpoint의 staged 상태와 현재 staged diff가 다릅니다. 자동 재개하지 않습니다.";
  }
  return null;
}

export function executePrTransaction({
  checkpoint,
  checkpointData,
  persistCheckpoint,
  clearCheckpoint,
  onFailure,
  commit,
  push,
  updatePr,
  afterPrSuccess,
  onAfterPrFailure,
}) {
  let state = checkpoint;

  try {
    if (state?.phase === "prCompleted") {
      const pr = { prNumber: state.prNumber, prUrl: state.prUrl };
      try {
        afterPrSuccess?.(pr);
      } catch (error) {
        onAfterPrFailure?.({ pr, error });
      }
      clearCheckpoint?.();
      return { checkpoint: state, pr };
    }

    if (!state) {
      state = { ...checkpointData(), phase: "started" };
      persistCheckpoint(state);
    }

    if (state.phase === "started") {
      commit();
      state = { ...state, ...checkpointData(), phase: "committed" };
      persistCheckpoint(state);
    }

    if (state.phase === "committed") {
      push();
      state = { ...state, ...checkpointData(), phase: "pushed" };
      persistCheckpoint(state);
    }

    const pr = updatePr();
    state = {
      ...state,
      phase: "prCompleted",
      prNumber: pr.prNumber,
      prUrl: pr.prUrl,
    };
    persistCheckpoint(state);
    try {
      afterPrSuccess?.(pr);
    } catch (error) {
      onAfterPrFailure?.({ pr, error });
    }
    clearCheckpoint?.();
    return { checkpoint: state, pr };
  } catch (error) {
    onFailure?.({ checkpoint: state, error });
    throw error;
  }
}
