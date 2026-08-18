import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";

function asBuffer(value) {
  return Buffer.isBuffer(value) ? value : Buffer.from(String(value));
}

function hashFramed(hash, label, value) {
  const bytes = asBuffer(value);
  hash.update(`${label}\0${bytes.byteLength}\0`);
  hash.update(bytes);
}

export function fingerprintWorkingTree({ trackedDiff, untrackedFiles }) {
  const hash = createHash("sha256");
  hashFramed(hash, "tracked", trackedDiff);
  for (const file of [...untrackedFiles].sort((left, right) =>
    left.path.localeCompare(right.path, "en"),
  )) {
    hashFramed(hash, "path", file.path);
    hashFramed(hash, "type", file.type);
    hashFramed(hash, "mode", String(file.mode));
    hashFramed(hash, "linkTarget", file.linkTarget || "");
    hashFramed(hash, "content", file.content);
  }
  return hash.digest("hex");
}

export function snapshotUntrackedFile(
  path,
  cwd = process.cwd(),
  { lstat = lstatSync, readFile = readFileSync, readlink = readlinkSync } = {},
) {
  const absolutePath = resolve(cwd, path);
  const stat = lstat(absolutePath);
  if (!stat.isFile() && !stat.isSymbolicLink()) {
    throw new TypeError(
      `지원하지 않는 untracked 파일 형식입니다: ${path}. regular file과 symbolic link만 허용합니다.`,
    );
  }
  const symbolicLink = stat.isSymbolicLink();
  return {
    // Fingerprints must preserve the exact path spelling returned by Git.
    path,
    type: symbolicLink ? "symlink" : "file",
    mode: stat.mode,
    linkTarget: symbolicLink ? readlink(absolutePath) : "",
    content: symbolicLink ? Buffer.alloc(0) : readFile(absolutePath),
  };
}

export function fingerprintRepositoryWorkingTree({ cwd, rawGitOutput, gitOutput }) {
  const trackedDiff = rawGitOutput(["diff", "HEAD", "--binary", "--no-ext-diff"]);
  const paths = gitOutput(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return fingerprintWorkingTree({
    trackedDiff,
    untrackedFiles: paths.map((path) => snapshotUntrackedFile(path, cwd)),
  });
}

export function getStagingSnapshotError({ baseline, current, headDiff, stagedDiff, unstaged, untracked }) {
  if (baseline !== current) return "분석 이후 작업 트리가 변경되어 staging하지 않습니다.";
  if (unstaged || untracked || headDiff !== stagedDiff) {
    return "staged 결과가 분석한 작업 snapshot과 일치하지 않아 commit하지 않습니다.";
  }
  return null;
}
