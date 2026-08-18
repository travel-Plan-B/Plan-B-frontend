import { createHash } from "node:crypto";

export function fingerprintWorkingTree({ trackedDiff, untrackedFiles }) {
  const hash = createHash("sha256");
  hash.update("tracked\0");
  hash.update(trackedDiff);

  for (const file of [...untrackedFiles].sort((left, right) =>
    left.path.localeCompare(right.path, "en"),
  )) {
    hash.update("\0untracked\0");
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.type || "file");
    hash.update("\0");
    hash.update(String(file.mode ?? ""));
    hash.update("\0");
    hash.update(file.linkTarget || "");
    hash.update("\0");
    hash.update(file.content);
  }

  return hash.digest("hex");
}
