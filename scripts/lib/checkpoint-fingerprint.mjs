import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseNameStatusZ(output) {
  const fields = output.split("\0");
  if (fields.at(-1) === "") fields.pop();
  const changes = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++][0];
    const sourcePath = status === "R" || status === "C" ? fields[index++] : "";
    const path = fields[index++];
    if (!path) throw new TypeError("Git name-status -z 출력을 해석할 수 없습니다.");
    changes.push({ status, path, sourcePath });
  }
  return changes;
}

export function snapshotFile(
  path,
  cwd = process.cwd(),
  { lstat = lstatSync, readFile = readFileSync, readlink = readlinkSync } = {},
) {
  const absolutePath = resolve(cwd, path);
  const stat = lstat(absolutePath);
  if (!stat.isFile() && !stat.isSymbolicLink()) {
    throw new TypeError(
      `지원하지 않는 파일 형식입니다: ${path}. regular file과 symbolic link만 허용합니다.`,
    );
  }
  const symbolicLink = stat.isSymbolicLink();
  const content = symbolicLink
    ? Buffer.from(readlink(absolutePath), "utf8")
    : readFile(absolutePath);
  return {
    path,
    type: symbolicLink ? "symlink" : "file",
    mode: stat.mode,
    size: content.byteLength,
    hash: sha256(content),
  };
}

export const snapshotUntrackedFile = snapshotFile;

export function fingerprintRecords(records) {
  const canonical = [...records]
    .map((record) => ({
      status: record.status || "A",
      sourcePath: record.sourcePath || "",
      path: record.path,
      type: record.type || "file",
      mode: record.mode ?? 0,
      size: record.size ?? 0,
      hash: record.hash || "-",
    }))
    .sort((left, right) =>
      `${left.path}\0${left.status}`.localeCompare(
        `${right.path}\0${right.status}`,
        "en",
      ),
    )
    .map((record) => JSON.stringify(record))
    .join("\n");
  return sha256(canonical);
}

export function fingerprintWorkingTree({ records, untrackedFiles = [] }) {
  return fingerprintRecords(
    records || untrackedFiles.map((file) => ({
      ...file,
      size: file.size ?? file.content?.byteLength ?? 0,
      hash: file.hash || sha256(file.content || Buffer.alloc(0)),
    })),
  );
}

function snapshotChange(change, cwd) {
  if (change.status === "D") {
    return { ...change, type: "deleted", mode: 0, size: 0, hash: "-" };
  }
  return { ...change, ...snapshotFile(change.path, cwd) };
}

export function fingerprintRepositoryWorkingTree({ cwd, gitOutput }) {
  const tracked = parseNameStatusZ(
    gitOutput([
      "diff",
      "HEAD",
      "--no-renames",
      "--name-status",
      "-z",
      "--no-ext-diff",
    ]),
  );
  const untracked = gitOutput([
    "ls-files", "--others", "--exclude-standard", "-z",
  ]).split("\0").filter(Boolean).map((path) => ({ status: "A", path }));
  return fingerprintRecords([
    ...tracked.map((change) => snapshotChange(change, cwd)),
    ...untracked.map((change) => snapshotChange(change, cwd)),
  ]);
}

export function fingerprintRepositoryIndex({ gitOutput }) {
  const changes = parseNameStatusZ(
    gitOutput(["diff", "--cached", "--name-status", "-z", "--no-ext-diff"]),
  );
  const records = changes.map((change) => {
    if (change.status === "D") {
      return { ...change, type: "deleted", mode: 0, size: 0, hash: "-" };
    }
    const entry = gitOutput([
      "--literal-pathspecs",
      "ls-files",
      "-s",
      "-z",
      "--",
      change.path,
    ]);
    const match = entry.match(/^(\d+) ([0-9a-f]+) \d+\t/u);
    if (!match) throw new TypeError(`Git index 정보를 읽을 수 없습니다: ${change.path}`);
    const [, mode, oid] = match;
    const size = Number(gitOutput(["cat-file", "-s", oid]).trim());
    return {
      ...change,
      type: mode === "120000" ? "symlink" : "file",
      mode: Number(mode),
      size,
      hash: `git:${oid}`,
    };
  });
  return fingerprintRecords(records);
}

export function getStagingSnapshotError({
  baseline,
  current,
  unstaged,
  untracked,
  afterStaging = false,
}) {
  if (baseline !== current) {
    return afterStaging
      ? "staging 이후 작업 snapshot이 분석 시점과 달라 commit하지 않습니다."
      : "분석 이후 작업 트리가 변경되어 staging하지 않습니다.";
  }
  if (unstaged || untracked) {
    return "staged 결과가 분석 시점의 작업 snapshot과 일치하지 않아 commit하지 않습니다.";
  }
  return null;
}
