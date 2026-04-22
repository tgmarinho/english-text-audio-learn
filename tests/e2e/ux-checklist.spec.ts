import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

type Priority = "Alta" | "Média" | "Baixa";

type ChecklistItem = {
  id: string;
  title: string;
  priority: Priority;
  status: "OK" | "Melhorar";
  recommendation: string;
};

test.describe("Checklist UX automatizado", () => {
  test("gera relatório com prioridades", async ({ page }) => {
    await login(page);

    const hasSearchAccessibleName = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(".search");
      if (!input) return false;
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");
      return Boolean(ariaLabel || ariaLabelledBy);
    });

    const hasMobileMenuAriaState = await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>(".mobile-menu-btn");
      if (!button) return false;
      return button.hasAttribute("aria-expanded") && button.hasAttribute("aria-controls");
    });

    const hasLiveRegionFeedback = await page.evaluate(() => {
      return Boolean(document.querySelector('[role="status"], [aria-live]'));
    });

    const hasSkeletonLoading = await page.evaluate(() => {
      return Boolean(document.querySelector("[class*='skeleton']"));
    });

    const checklist: ChecklistItem[] = [
      {
        id: "UX-001",
        title: "Campo de busca com nome acessível",
        priority: "Alta",
        status: hasSearchAccessibleName ? "OK" : "Melhorar",
        recommendation:
          "Adicionar <label>, aria-label ou aria-labelledby no input de busca para leitores de tela.",
      },
      {
        id: "UX-002",
        title: "Botão de menu mobile com aria-expanded/aria-controls",
        priority: "Alta",
        status: hasMobileMenuAriaState ? "OK" : "Melhorar",
        recommendation:
          "Sincronizar estado do drawer com aria-expanded e associar ao painel usando aria-controls.",
      },
      {
        id: "UX-003",
        title: "Feedback de ação para marcar/desmarcar estudado",
        priority: "Média",
        status: hasLiveRegionFeedback ? "OK" : "Melhorar",
        recommendation:
          "Exibir feedback curto com aria-live (ex.: 'Marcado como estudado').",
      },
      {
        id: "UX-004",
        title: "Estado de carregamento com skeleton",
        priority: "Baixa",
        status: hasSkeletonLoading ? "OK" : "Melhorar",
        recommendation:
          "Adicionar skeleton no cabeçalho e texto durante troca de conteúdo.",
      },
    ];

    const now = new Date().toISOString();
    const lines = [
      "# Relatório UX automatizado",
      "",
      `Gerado em: ${now}`,
      "",
      "| ID | Item | Prioridade | Status | Recomendação |",
      "| --- | --- | --- | --- | --- |",
      ...checklist.map(
        (item) =>
          `| ${item.id} | ${item.title} | ${item.priority} | ${item.status} | ${item.recommendation} |`,
      ),
      "",
    ];

    const report = lines.join("\n");
    const reportPath = test.info().outputPath("ux-checklist-report.md");
    await writeFile(reportPath, report, "utf-8");

    await test.info().attach("ux-checklist-report", {
      path: reportPath,
      contentType: "text/markdown",
    });

    expect(checklist.length).toBeGreaterThan(0);
  });
});
