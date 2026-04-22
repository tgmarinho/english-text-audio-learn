# English Study

Aplicacao web para estudo de ingles com textos, traducao e audio.

## Visao geral

O projeto organiza colecoes de conteudo em markdown e mp3 e gera um catalogo consumido pelo frontend React.
Ao iniciar em desenvolvimento ou gerar build, o catalogo e atualizado automaticamente.
Na versao mobile, a navegacao foi otimizada com drawer de conteudos e barra fixa inferior para navegacao rapida entre licoes.

## Estrutura do projeto

- `src/`: codigo da aplicacao React + TypeScript.
- `public/collections/`: colecoes de conteudo (cada colecao com `textos/` e `audio/`).
- `public/category/`: categorias acessiveis pelo frontend.
- `public/catalog.json`: catalogo gerado automaticamente com as colecoes e itens.
- `scripts/build-catalog.ts`: script que gera o catalogo a partir de `public/collections`.
- `index.html`: entrada principal da aplicacao na raiz.
- `.pi/skills/`: skills locais do Pi para UX/UI e design.

## Requisitos

- [Bun](https://bun.sh/) instalado.

## Controle de acesso (usuario/senha)

O app possui uma tela de login simples no frontend. O acesso so e liberado quando o usuario e a senha batem com as variaveis de ambiente.

1. Crie seu arquivo de ambiente local:

```bash
cp .env.example .env
```

2. Defina os valores:

```env
VITE_APP_USER=seu-usuario
VITE_APP_PASSWORD=sua-senha-forte
```

3. Reinicie o servidor (`bun run dev`) para carregar as variaveis.

Observacao importante: como essa validacao roda no frontend, ela ajuda a restringir acesso basico, mas nao substitui autenticacao segura no backend.

## Como rodar localmente

1. Instale dependencias:

```bash
bun install
```

2. Rode em desenvolvimento:

```bash
bun run dev
```

O script `predev` gera o catalogo automaticamente antes de subir o Vite.

A aplicacao fica disponivel em `http://localhost:5173`.

## Scripts uteis

Na raiz do projeto:

- `bun run catalog`: gera/atualiza `public/catalog.json`.
- `bun run dev`: inicia ambiente de desenvolvimento.
- `bun run build`: gera build de producao.
- `bun run preview`: serve a build localmente.
- `bun run lint`: roda o ESLint.
- `bun run test:e2e`: roda testes E2E de QA com Playwright.
- `bun run test:e2e:ui`: abre o runner interativo do Playwright.
- `bun run test:e2e:a11y`: executa auditoria de acessibilidade com axe.
- `bun run test:e2e:visual`: valida regressão visual por screenshot.
- `bun run test:e2e:visual:update`: atualiza baseline dos screenshots.
- `bun run qa:ux`: gera checklist UX automatizado com prioridades.
- `bun run test:e2e:report`: abre o relatório HTML do Playwright.

## UX mobile (resumo)

A interface mobile prioriza leitura e navegacao com o polegar:

- Sidebar em drawer (abre pelo botao `Conteudos` no topo).
- Fechamento automatico do drawer ao selecionar colecao/item.
- Barra inferior sticky com `Anterior`, `Marcar/Estudado` e `Proximo`.
- Estados de foco e alvo de toque ajustados para telas menores.

Arquivos principais desse comportamento:

- `src/App.tsx`
- `src/App.css`

## Fluxo de dados

1. O script `scripts/build-catalog.ts` varre `public/collections`.
2. Para cada item, extrai titulo do markdown e verifica existencia de audio.
3. O script grava `public/catalog.json`.
4. O frontend carrega `/catalog.json` e usa os paths de `/collections/...` para abrir texto e audio.

## Formato esperado das colecoes

Cada pasta dentro de `public/collections/<slug>/` deve conter:

- `textos/`: arquivos `.md` (um por item).
- `audio/`: arquivos `.mp3` nomeados como `texto-<id>.mp3`.

Os caminhos sao expostos no frontend como:

- Markdown: `/collections/<slug>/textos/<arquivo>.md`
- Audio: `/collections/<slug>/audio/texto-<id>.mp3`

## Exemplo de colecao

```text
public/collections/minha-colecao/
  textos/
    001.md
    002.md
  audio/
    texto-001.mp3
    texto-002.mp3
```

## Skills locais (Pi)

O projeto pode carregar skills locais via `.pi/skills/`. Atualmente, o foco esta em UI/UX e design:

- `banner-design`
- `brand`
- `design`
- `design-system`
- `slides`
- `ui-styling`
- `ui-ux-pro-max`

Se alterar esse conjunto, prefira manter apenas as skills necessarias ao projeto para evitar sobreposicao de instrucoes.

## QA de UI/UX com Playwright

Foi adicionada uma base de QA E2E em `tests/e2e` com configuracao em `playwright.config.ts`.

Guia rapido:

```bash
bun install
bunx playwright install
bun run test:e2e
bun run test:e2e:a11y
bun run test:e2e:visual:update
bun run test:e2e:visual
bun run qa:ux
bun run test:e2e:report
```

Mais detalhes e backlog de melhorias em `docs/qa-ui-ux.md`.
