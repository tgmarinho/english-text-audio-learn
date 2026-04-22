# QA de UI/UX com Playwright

Este projeto usa Playwright para validar fluxo crítico e guiar melhorias de UI/UX.

## O que está coberto

- Login com erro para credenciais inválidas.
- Login bem-sucedido.
- Carregamento do conteúdo principal.
- Navegação entre itens (anterior/próximo).
- Busca/filtro da lista de itens.
- Auditoria de acessibilidade com axe (`@axe-core/playwright`).
- Regressão visual por screenshot (Chromium).
- Checklist UX automatizado com priorização (Alta/Média/Baixa).
- Evidências automáticas em falhas (screenshot, vídeo e trace).

## Como rodar

1. Instale dependências:

```bash
bun install
```

2. Instale os navegadores do Playwright:

```bash
bunx playwright install
```

3. Rode os testes E2E:

```bash
bun run test:e2e
```

4. Rodar auditoria de acessibilidade:

```bash
bun run test:e2e:a11y
```

5. Gerar/validar baseline visual:

```bash
bun run test:e2e:visual:update
bun run test:e2e:visual
```

6. Gerar checklist UX com prioridades:

```bash
bun run qa:ux
```

7. Abrir o relatório HTML:

```bash
bun run test:e2e:report
```

## Variáveis para QA

Prioridade de credenciais usadas nos testes:

1. `E2E_APP_USER` / `E2E_APP_PASSWORD`
2. `VITE_APP_USER` / `VITE_APP_PASSWORD` (variáveis de ambiente)
3. `VITE_APP_USER` / `VITE_APP_PASSWORD` lidas do arquivo `.env`
4. fallback: `qa-user` / `qa-password`

Exemplo com override explícito:

```bash
E2E_APP_USER=meu-user E2E_APP_PASSWORD=minha-senha bun run test:e2e
```

> Observação: por padrão, os testes **não reutilizam** servidor existente (`reuseExistingServer: false`) para evitar conflito de credenciais.
> Se quiser reaproveitar um servidor já em execução, rode com `E2E_REUSE_EXISTING_SERVER=1`.

## Relatórios e artefatos

- `bun run test:e2e:report`: abre o relatório consolidado do Playwright.
- `bun run qa:ux`: anexa `ux-checklist-report.md` no resultado do teste.
- Regressão visual guarda snapshots em `tests/e2e/visual-regression.spec.ts-snapshots/`.

## Backlog de melhorias UI/UX sugeridas

1. **(Concluída) Acessibilidade de formulário**
   - Label explícito adicionado para o campo de busca (`Buscar…`).

2. **(Concluída parcialmente) Drawer mobile**
   - `aria-expanded`/`aria-controls` adicionados no botão `Conteúdos`.
   - Próximo passo: trap de foco quando o drawer estiver aberto.

3. **(Concluída) Feedback de ação**
   - Feedback com região `aria-live` adicionado ao marcar/desmarcar “Estudado”.

4. **(Baixa) Estado de carregamento**
   - Evoluir de texto `Carregando…` para skeleton no cabeçalho e no conteúdo para melhor percepção de performance.

5. **(Média) Métricas de UX contínuas**
   - Incluir checks de performance (Lighthouse) em pipeline separado de regressão visual.
