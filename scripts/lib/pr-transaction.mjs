export function executePrTransaction({
  checkpoint,
  checkpointData,
  persistCheckpoint,
  commit,
  push,
  updateIssue,
  updatePr,
}) {
  let state = checkpoint;

  if (!state) {
    commit();
    state = { ...checkpointData(), phase: "committed" };
    persistCheckpoint(state);
  }

  if (state.phase === "committed") {
    push();
    state = { ...state, phase: "pushed" };
    persistCheckpoint(state);
  }

  updateIssue();
  return { checkpoint: state, pr: updatePr() };
}
