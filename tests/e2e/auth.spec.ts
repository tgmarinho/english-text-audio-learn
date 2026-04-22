import { expect, test } from "@playwright/test";

test.describe("Autenticação", () => {
  test("exibe erro para credenciais inválidas", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Usuário").fill("usuario-invalido");
    await page.getByLabel("Senha").fill("senha-invalida");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Usuário ou senha inválidos.")).toBeVisible();
  });
});
