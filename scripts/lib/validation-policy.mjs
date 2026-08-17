import { extname, resolve } from "node:path";

import { run } from "./git-github.mjs";
import { runCli } from "./agents/shared.mjs";

const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const HIGH_IMPACT_FILES = [
  /^(?:package\.json|pnpm-lock\.yaml)$/u,
  /^(?:next|postcss|tailwind|eslint)\.config\./u,
  /^tsconfig(?:\..+)?\.json$/u,
  /^src\/app\//u,
  /^(?:middleware|instrumentation)\./u,
];

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

export function determineRequiredChecks(
  changedFiles,
  { mode = "create" } = {},
) {
  if (!new Set(["create", "update"]).has(mode)) {
    throw new TypeError(`지원하지 않는 PR mode입니다: ${mode}`);
  }
  const files = changedFiles.map(normalizePath);
  const codeFiles = files.filter((file) => CODE_EXTENSIONS.has(extname(file)));
  const needsBuild = files.some((file) =>
    HIGH_IMPACT_FILES.some((pattern) => pattern.test(file)),
  );
  const needsTypecheck = codeFiles.length > 0 || needsBuild;

  return {
    mode,
    files,
    codeFiles,
    checks: [
      "git diff --cached --check",
      ...(codeFiles.length > 0 ? ["eslint"] : []),
      ...(needsTypecheck ? ["typecheck"] : []),
      ...(needsBuild ? ["build"] : []),
    ],
    needsBuild,
    needsTypecheck,
  };
}

function timed(label, action) {
  const startedAt = performance.now();
  action();
  console.log(
    `✓ ${label} (${((performance.now() - startedAt) / 1000).toFixed(1)}s)`,
  );
}

export function runRequiredChecks(
  changedFiles,
  { cwd = process.cwd(), mode = "create" } = {},
) {
  const policy = determineRequiredChecks(changedFiles, { mode });
  const executable = (name) =>
    resolve(
      cwd,
      "node_modules",
      ".bin",
      `${name}${process.platform === "win32" ? ".cmd" : ""}`,
    );

  console.log(`ℹ 필수 검증: ${policy.checks.join(" → ")}`);
  timed("staged diff 검사", () =>
    run("git", ["diff", "--cached", "--check"], { inherit: true }),
  );
  if (policy.codeFiles.length > 0) {
    timed("변경 코드 lint", () =>
      runCli(executable("eslint"), policy.codeFiles, {
        cwd,
        displayName: "ESLint",
      }),
    );
  }
  if (policy.needsTypecheck) {
    timed("Next.js type 생성", () =>
      runCli(executable("next"), ["typegen"], {
        cwd,
        displayName: "Next.js typegen",
      }),
    );
    timed("typecheck", () =>
      runCli(executable("tsc"), ["--noEmit"], {
        cwd,
        displayName: "TypeScript",
      }),
    );
  }
  if (policy.needsBuild) {
    timed("build", () =>
      runCli(executable("next"), ["build"], {
        cwd,
        displayName: "Next.js build",
      }),
    );
  }
  return policy;
}
