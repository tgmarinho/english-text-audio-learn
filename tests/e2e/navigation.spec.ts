import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

test.describe("Fluxo principal", () => {
  test("login + abrir primeiro conteúdo + navegar", async ({ page }) => {
    await login(page);

    const title = page.locator(".viewer-header h2");
    await expect(title).toBeVisible();

    const nextButton = page.getByRole("button", { name: "Próximo" }).first();
    const previousButton = page.getByRole("button", { name: "Anterior" }).first();

    await expect(nextButton).toBeVisible();
    await expect(previousButton).toBeDisabled();

    await nextButton.click();
    await expect(previousButton).toBeEnabled();
  });

  test("filtro de busca reduz a lista de itens", async ({ page }) => {
    await login(page);

    const listItems = page.locator(".items li");
    await expect(listItems.first()).toBeVisible();

    const countBefore = await listItems.count();
    await page.getByPlaceholder("Buscar…").fill("99999");

    await expect(listItems).toHaveCount(0);
    expect(countBefore).toBeGreaterThan(0);
  });
});
