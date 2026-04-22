import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

test.describe("Regressão visual", () => {
  test("layout desktop principal", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Snapshots visuais somente no Chromium.");

    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await expect(page.locator(".viewer-header")).toBeVisible();

    await expect(page).toHaveScreenshot("home-desktop.png", {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("layout mobile principal", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Snapshots visuais somente no Chromium.");

    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.locator(".mobile-menu-btn").click();
    await expect(page.locator(".sidebar")).toHaveClass(/open/);

    await expect(page).toHaveScreenshot("home-mobile-sidebar-open.png", {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });
});
