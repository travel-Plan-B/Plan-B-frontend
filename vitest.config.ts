import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": path.join(dirname, "src"),
          },
        },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
          // travelTime.ts가 모듈 로드 시 이 값을 읽어서, .env.local이 없는
          // 환경(CI, 다른 팀원 머신 등)에서는 값이 undefined라 대중교통
          // 테스트가 "키 없음" 에러로 실패한다 — 실제 키가 아니라 목업
          // 응답만 검증하는 테스트라 더미 값으로 고정해둔다.
          env: {
            NEXT_PUBLIC_ODSAY_API_KEY: "test-odsay-key",
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
