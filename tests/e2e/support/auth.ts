import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

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

const nonEmpty = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

function resolveCredential(envKey: string, viteKey: string, fallback: string) {
  const fromE2E = nonEmpty(process.env[envKey]);
  if (fromE2E) return { value: fromE2E, source: envKey };

  const fromViteEnv = nonEmpty(process.env[viteKey]);
  if (fromViteEnv) return { value: fromViteEnv, source: viteKey };

  const fromFile = nonEmpty(readEnvFileValue(viteKey));
  if (fromFile) return { value: fromFile, source: `.env:${viteKey}` };

  return { value: fallback, source: "fallback" };
}

const userCredential = resolveCredential("E2E_APP_USER", "VITE_APP_USER", "qa-user");
const passwordCredential = resolveCredential(
  "E2E_APP_PASSWORD",
  "VITE_APP_PASSWORD",
  "qa-password",
);

export async function login(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();

  await page.getByLabel("Usuário").fill(userCredential.value);
  await page.getByLabel("Senha").fill(passwordCredential.value);
  await page.getByRole("button", { name: "Entrar" }).click();

  const invalidError = page.getByText("Usuário ou senha inválidos.");
  if (await invalidError.isVisible()) {
    throw new Error(
      `Login E2E falhou com usuário "${userCredential.value}" (origem: ${userCredential.source}) e senha da origem ${passwordCredential.source}. Defina E2E_APP_USER/E2E_APP_PASSWORD para forçar credenciais do teste.`,
    );
  }

  await expect(page.locator(".sidebar-header h1")).toBeVisible();
}
