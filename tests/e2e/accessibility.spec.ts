import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

test.describe("Acessibilidade", () => {
  test("login sem violações críticas/sérias", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    );

    expect(
      blocking,
      `Foram encontradas violações críticas/sérias no login: ${blocking
        .map((v) => v.id)
        .join(", ")}`,
    ).toEqual([]);
  });

  test("área autenticada sem violações críticas/sérias", async ({ page }) => {
    await login(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    );

    expect(
      blocking,
      `Foram encontradas violações críticas/sérias na área logada: ${blocking
        .map((v) => v.id)
        .join(", ")}`,
    ).toEqual([]);
  });
});
