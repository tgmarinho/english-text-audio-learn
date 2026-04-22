---
name: baixar-coleção-aulasdeinglesgratis
description: Baixa uma coleção completa (áudio MP3 + texto bilíngue EN/PT em Markdown) do site aulasdeinglesgratis.net para estudo offline. Aceita qualquer URL de índice do site. Use quando o usuário pedir para raspar, baixar ou sincronizar textos/conversações/aulas dessa plataforma.
---

# Baixar coleções do aulasdeinglesgratis.net

Script único que sincroniza qualquer coleção numerada do site, detectando automaticamente a estrutura.

## Uso

```bash
~/english-study/200-textos/scripts/sync.sh <INDEX_URL> [--out DIR] [--jobs N] [--force]
```

Sem `--out`, a coleção é salva em `~/english-study/<slug-do-url>/`.

### Exemplos testados

```bash
# 200 textos (formato tabela)
./sync.sh https://aulasdeinglesgratis.net/200-textos-em-ingles-com-traducao-e-audio/

# 110 textos avançados (formato tabela)
./sync.sh https://aulasdeinglesgratis.net/110-textos-em-ingles-intermediario-e-avancado-com-audio-e-traducao/

# 100 aulas/conversações (formato <p>PT<br><strong>EN</strong></p>)
./sync.sh https://aulasdeinglesgratis.net/100-conversacoes-em-ingles/

# 215 conversações para iniciantes (formato <strong>EN</strong><br>PT</p>)
./sync.sh https://aulasdeinglesgratis.net/conversacoes-em-ingles-para-iniciantes/
```

## O que o script faz

1. Baixa a página índice
2. Extrai URLs dos itens em **ordem de aparição** no conteúdo principal (não depende de numeração no slug)
3. Baixa todas as páginas HTML em paralelo (`--jobs 8` por padrão)
4. Para cada página, extrai: título, URL do áudio, e pares EN/PT detectando um de 3 formatos:
   - **Tabela**: `<table><thead><th>EN</th><th>PT</th></thead><tbody><tr><td>EN</td><td>PT</td></tr>...` (ignora tabelas com classe `cookielawinfo`)
   - **Diálogo PT-primeiro**: `<p>PT<br><b|strong>EN</b|strong></p>`
   - **Diálogo EN-primeiro**: `<strong>EN</strong><br>PT</p>`
5. Baixa todos os MP3s em paralelo; infere o padrão da URL (`prefix + {n,n:02d,n:03d} + suffix`) e preenche itens que não tinham player na página
6. Gera um `NNN.md` por item em `textos/` e um `README.md` com índice clicável

## Saída

```
~/english-study/<slug>/
├── audio/texto-NNN.mp3       (MP3s numerados por ordem no índice)
├── textos/NNN.md             (Markdown com EN + tradução PT)
├── .cache/html/NNN.html      (HTML cru — idempotência, permite re-parse)
└── README.md                 (índice clicável)
```

Re-executar o script é **idempotente**: pula HTMLs/MP3s já baixados. Passe `--force` para re-baixar tudo.

## Quando a estrutura muda

Se o site adicionar uma nova coleção em formato que não bate com nenhum dos 3 casos (tabela, `<b>/<strong>` após `<br>`, `<strong>` antes de `<br>`), você verá `[WARN] página N: conteúdo não extraído`. Como resolver:

1. Abrir um dos HTMLs em `.cache/html/` e ver o padrão do conteúdo
2. Adicionar um novo bloco em `extract_page_data()` em `sync_collection.py` logo antes do `return None`
3. Seguir o mesmo estilo dos 3 formatos existentes: regex que encontra pares e faz `pairs.append((en, pt))`

## Padrões de áudio observados

| Coleção | Padrão S3 |
|--|--|
| 200 textos | `200textosemingles/200+Textos+em+Ingles+NNN.mp3` (3 dígitos) |
| 110 textos avançados | `110textosavancados/Textos+Avancados+NNN.mp3` (3 dígitos) |
| 100 conversações | `100conversacoes/100conversacoesN.mp3` (sem padding) |
| 215 conversações | `215conversacoes/215conversacoesN.mp3` (sem padding) |

O script não assume nenhum padrão — ele lê a URL direto de cada página e usa `infer_audio_pattern()` só como fallback.
