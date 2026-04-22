# Tasks

## 1. Atalhos de teclado (~20min)

**Objetivo:** reduzir fricção do fluxo de estudo. Nada de mouse pra navegar entre textos e controlar o player.

**Bindings:**
- `J` / `↓` — próximo item
- `K` / `↑` — item anterior
- `Space` — play/pause (sem conflitar com scroll quando input/textarea focado)
- `E` — toggle "marcar estudado"
- `S` — toggle visibilidade da tradução PT (modo self-test)
- `/` — focar campo de busca
- `Esc` — sair da busca / limpar
- `←` / `→` — seek -5s / +5s no áudio
- `?` — mostrar overlay com lista de atalhos

**Arquivos:**
- `src/useHotkeys.ts` (novo) — hook `useHotkeys(map, deps)`
- `src/App.tsx` — registrar bindings globais; estado `hideTranslation`
- `src/Player.tsx` — expor controle play/pause/seek via ref ou callback
- `src/App.css` — estado `.bilingual.hide-pt` + overlay `?`

**Notas:**
- Ignorar quando o alvo é input/textarea/select (exceto `Esc`)
- Respeitar `prefers-reduced-motion` nas transições

---

## 2. Vocabulário clicável + revisão (~2–4h)

**Objetivo:** transformar leitura passiva em retenção ativa. Clicar numa palavra salva na lista; lista vira flashcards com revisão espaçada.

### 2a. Click-to-save
- No texto EN, cada `<span class="word">` vira clicável
- Ctrl/Cmd+Click (ou shift-click) adiciona à lista de vocabulário, sem tirar foco do player
- Guardar: `{ word, lemma, contextSentence, contextEn, contextPt, collectionSlug, itemId, addedAt, ease, nextReview, reps }`
- Storage: `localStorage` (chave `english-study.vocab.v1`)
- Visual: palavra salva fica com underline dotted âmbar

### 2b. Painel de vocabulário
- Nova rota/view (tab "Vocabulário" no sidebar)
- Lista filtrada: Todas / Pra revisar hoje / Novas / Aprendidas
- Busca por palavra
- Card: palavra + frase de contexto + botão "ir pro texto original"
- Ações: deletar, editar tradução manual

### 2c. Modo revisão (flashcards)
- Botão "Revisar (N)" mostra contagem de cards devidos
- Flashcard: frente EN word + contexto, verso tradução PT da palavra
- 4 botões pós-virada: Again / Hard / Good / Easy (SM-2 simplificado)
- Atualiza `ease`, `interval`, `nextReview`
- Ao terminar: toast com quantos revisados hoje

### 2d. Extração de tradução por palavra
- Parsing simples: procura a palavra EN no texto EN e a palavra correspondente na mesma posição do PT (não perfeito, mas útil)
- Fallback: campo editável manual
- Upgrade futuro: dicionário offline (ex.: wiktionary ou freedict pt-BR)

**Arquivos novos:**
- `src/vocab/types.ts` — `VocabCard`, enum status
- `src/vocab/storage.ts` — load/save localStorage
- `src/vocab/srs.ts` — SM-2 simplificado
- `src/vocab/VocabPanel.tsx` — lista + filtros
- `src/vocab/FlashcardModal.tsx` — modo revisão
- `src/hooks/useVocab.ts` — hook consumidor

**Mudanças:**
- `src/Player.tsx` — onClick em `.word` com modifier → adicionar ao vocab
- `src/App.tsx` — tab/rota pra painel de vocabulário
- `src/App.css` — estilos do painel + modal de flashcard

**Decisões em aberto:**
- SM-2 tradicional ou FSRS (mais moderno, open source)?
- Exportar/importar deck em formato Anki (.apkg) ou CSV simples?
- Sync entre devices? Começa sem; adiciona backend depois se precisar.

---

## Ordem sugerida

1 → 2a → 2b → 2c → 2d. Cada um já entrega valor sozinho. Começar pelo 1 mesmo dia, pausar antes de 2 pra validar que os atalhos estão confortáveis no uso real.
