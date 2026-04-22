# English Study

Aplicacao web para estudo de ingles com textos, traducao e audio.

## Visao geral

O projeto organiza colecoes de conteudo em markdown e mp3 e gera um catalogo consumido pelo frontend React.
Ao iniciar em desenvolvimento ou gerar build, o catalogo e atualizado automaticamente.

## Estrutura do projeto

- `src/`: codigo da aplicacao React + TypeScript.
- `public/collections/`: colecoes de conteudo (cada colecao com `textos/` e `audio/`).
- `public/category/`: categorias acessiveis pelo frontend.
- `public/catalog.json`: catalogo gerado automaticamente com as colecoes e itens.
- `scripts/build-catalog.ts`: script que gera o catalogo a partir de `public/collections`.
- `index.html`: entrada principal da aplicacao na raiz.

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
