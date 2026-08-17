export function executePrTransaction({
  checkpoint,
  checkpointData,
  persistCheckpoint,
  clearCheckpoint,
  onFailure,
  commit,
  push,
  updateIssue,
  updatePr,
}) {
  let state = checkpoint;

  try {
    if (state?.phase === "prCompleted") {
      const pr = { prNumber: state.prNumber, prUrl: state.prUrl };
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

    updateIssue();
    const pr = updatePr();
    state = {
      ...state,
      phase: "prCompleted",
      prNumber: pr.prNumber,
      prUrl: pr.prUrl,
    };
    persistCheckpoint(state);
    clearCheckpoint?.();
    return { checkpoint: state, pr };
  } catch (error) {
    onFailure?.({ checkpoint: state, error });
    throw error;
  }
}
