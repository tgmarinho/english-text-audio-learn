import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function readEnvFileValue(key: string) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...rest] = trimmed.split("=");
      if (k !== key) continue;
      return rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

const nonEmpty = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const appUser =
  nonEmpty(process.env.E2E_APP_USER) ??
  nonEmpty(process.env.VITE_APP_USER) ??
  nonEmpty(readEnvFileValue("VITE_APP_USER")) ??
  "qa-user";
const appPassword =
  nonEmpty(process.env.E2E_APP_PASSWORD) ??
  nonEmpty(process.env.VITE_APP_PASSWORD) ??
  nonEmpty(readEnvFileValue("VITE_APP_PASSWORD")) ??
  "qa-password";

const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `bun run dev --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: reuseExistingServer,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      VITE_APP_USER: appUser,
      VITE_APP_PASSWORD: appPassword,
    },
  },
});
