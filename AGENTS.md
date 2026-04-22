# AGENTS.md

Este arquivo define instrucoes para agentes que trabalham neste repositorio.

## Contexto do projeto

- Aplicacao: estudo de ingles com textos, traducao e audio.
- Frontend: React + TypeScript + Vite na raiz do repositorio.
- Runtime e scripts: Bun.
- Conteudo estatico: `public/collections/`, `public/category/` e `public/catalog.json`.
- Priorize mudancas pequenas, seguras e faceis de revisar.

## Regras de trabalho

1. Sempre responda em portugues.
2. Antes de editar, entenda rapidamente o contexto dos arquivos envolvidos.
3. Nao altere codigo fora do escopo solicitado.
4. Preserve estilo e convencoes existentes do projeto.
5. Evite adicionar dependencias sem necessidade clara.
6. Sempre que possivel, mantenha a edicao nas pastas `src/`, `public/` e `scripts/` quando a solicitacao for de frontend/conteudo.

## Implementacao

- Prefira componentes e funcoes pequenas, com nomes claros.
- Evite comentarios obvios; comente apenas quando houver logica nao trivial.
- Mantenha compatibilidade com TypeScript estrito quando aplicavel.
- Nao introduza mudancas destrutivas sem confirmacao explicita.
- Ao mexer em colecoes, preserve o formato esperado:
  - markdown em `public/collections/<slug>/textos/*.md`
  - audio em `public/collections/<slug>/audio/texto-<id>.mp3`

## Verificacao

- Sempre que fizer mudancas relevantes, execute validacoes basicas:
  - `bun run lint`
  - `bun run build`
- Quando houver mudancas em colecoes, rode:
  - `bun run catalog`
- Se nao for possivel executar comandos, explique o motivo.

## Entrega

- Informe de forma objetiva:
  - o que foi alterado;
  - quais arquivos foram tocados;
  - como validar localmente.

## Limites

- Nao exponha segredos, tokens ou credenciais.
- Nao remova arquivos importantes sem pedido explicito.
- Em caso de ambiguidade, pergunte antes de assumir.
