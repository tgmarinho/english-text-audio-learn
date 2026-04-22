#!/usr/bin/env python3
"""
Sincroniza uma coleção de textos/áudios do aulasdeinglesgratis.net.

Detecta automaticamente:
  - URLs dos textos individuais no índice (em ordem)
  - Padrão de áudio (lido direto de cada página, funciona para qualquer coleção)
  - Formato do conteúdo (tabela bilíngue OU diálogo <br>/<strong>)

Uso:
    ./sync_collection.py <INDEX_URL> [--out DIR] [--jobs N] [--force]

Saída padrão: ~/english-study/<slug-do-url>/
    ├── audio/            MP3s baixados
    ├── textos/           Markdown com inglês + tradução
    ├── .cache/html/      HTML cru (para re-parseamento)
    └── README.md         Índice
"""
from __future__ import annotations
import argparse
import html
import os
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor


UA = "Mozilla/5.0 (compatible; study-sync/1.0)"
SITE = "aulasdeinglesgratis.net"


def fetch(url: str, binary: bool = False, timeout: int = 60) -> bytes | str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", errors="replace")


def clean_html(s: str) -> str:
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def extract_index_urls(index_html: str, index_url: str) -> list[str]:
    """Extrai URLs dos itens na ordem em que aparecem no conteúdo principal."""
    # Restringe à área de conteúdo (entry-content)
    m = re.search(r'class="entry-content[^"]*"[^>]*>', index_html)
    content = index_html[m.end():] if m else index_html
    # Corta no rodapé/barra lateral
    end_m = re.search(r'<footer|id="post-extra-info"|stream-item-below-post', content)
    if end_m:
        content = content[:end_m.start()]

    index_norm = index_url.rstrip("/")
    seen: set[str] = set()
    ordered: list[str] = []
    # Captura links com path de uma única pasta
    for m in re.finditer(
        rf'href="(https?://{re.escape(SITE)}/([^/"?#]+)/?)"',
        content,
    ):
        url = m.group(1).rstrip("/")
        slug = m.group(2)
        # Pula não-conteúdo óbvio
        if url == index_norm:
            continue
        if slug.startswith(("category", "tag", "author", "page", "wp-")):
            continue
        if slug in ("privacidade", "politica-de-privacidade", "contato", "sobre"):
            continue
        if url in seen:
            continue
        seen.add(url)
        ordered.append(url + "/")
    return ordered


def extract_page_data(h: str) -> dict | None:
    """Extrai áudio, título e pares EN/PT de uma página individual."""
    # Título
    title_m = re.search(r"<title>([^<]+)</title>", h)
    page_title = html.unescape(title_m.group(1)).strip() if title_m else ""
    # Remove sufixo do site
    page_title = re.sub(r"\s*[-–]\s*(Aulas de Inglês Grátis|Inglês)\s*$", "", page_title).strip()

    # URL do MP3
    mp3_m = re.search(
        rf'(https?://[^"\'<>\s]+?/{SITE}/[^"\'<>\s]+?\.mp3)',
        h,
    ) or re.search(r'(https?://[^"\'<>\s]+\.mp3)', h)
    mp3_url = mp3_m.group(1) if mp3_m else ""

    # Recorta a área de conteúdo
    ec_m = re.search(r'class="entry-content[^"]*"[^>]*>', h)
    content = h[ec_m.end():] if ec_m else h
    end_m = re.search(r'<div[^>]*class="[^"]*stream-item|id="post-extra-info"|<footer', content)
    if end_m:
        content = content[:end_m.start()]
    # Remove audio tag do conteúdo
    content = re.sub(r"<audio\b.*?</audio>", "", content, flags=re.DOTALL | re.I)

    en_title = ""
    pt_title = ""
    pairs: list[tuple[str, str]] = []

    # Formato A — tabela bilíngue (ignora tabelas de cookie consent)
    for m in re.finditer(r"<table[^>]*>(.*?)</table>", content, re.DOTALL):
        tbl = m.group(1)
        if "cookielawinfo" in tbl:
            continue
        ths = re.findall(r"<th[^>]*>(.*?)</th>", tbl, re.DOTALL)
        if len(ths) >= 2:
            en_title = clean_html(ths[0])
            pt_title = clean_html(ths[1])
        body_m = re.search(r"<tbody[^>]*>(.*?)</tbody>", tbl, re.DOTALL)
        body = body_m.group(1) if body_m else tbl
        for row in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.DOTALL):
            tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL)
            if len(tds) >= 2:
                en = clean_html(tds[0])
                pt = clean_html(tds[1])
                if en or pt:
                    pairs.append((en, pt))
        if pairs:
            break

    # Formato B/D — <p>PT<br><b|strong>EN</b|strong></p>  (100 conversações)
    if not pairs:
        for m in re.finditer(
            r"<p[^>]*>\s*([^<][^<]*?)\s*<br\s*/?>\s*<(b|strong)[^>]*>(.*?)</\2>\s*</p>",
            content,
            re.DOTALL,
        ):
            pt = clean_html(m.group(1))
            en = clean_html(m.group(3))
            if en or pt:
                pairs.append((en, pt))

    # Formato C — <strong>EN</strong><br>PT  (215 conversações, HTML malformado)
    if not pairs:
        for m in re.finditer(
            r"<strong[^>]*>(.*?)</strong>\s*<br\s*/?>\s*(.*?)(?=<strong|</p>|<div|$)",
            content,
            re.DOTALL,
        ):
            en = clean_html(m.group(1))
            pt = clean_html(m.group(2))
            if en and pt:
                pairs.append((en, pt))

    if not pairs:
        return None

    return {
        "title": page_title,
        "en_title": en_title,
        "pt_title": pt_title,
        "mp3_url": mp3_url,
        "pairs": pairs,
    }


def infer_audio_pattern(known: dict[int, str]) -> tuple[str, str, str] | None:
    """Detecta (prefix, fmt, suffix) para URLs do tipo PREFIX + fmt(n) + SUFFIX."""
    if len(known) < 3:
        return None
    items = sorted(known.items())
    n1, u1 = items[0]
    for fmt in ("{n}", "{n:02d}", "{n:03d}"):
        target = fmt.format(n=n1)
        idx = u1.rfind(target)
        if idx < 0:
            continue
        prefix, suffix = u1[:idx], u1[idx + len(target):]
        if all(prefix + fmt.format(n=n) + suffix == u for n, u in items):
            return prefix, fmt, suffix
    return None


def download(url: str, dest: str, force: bool) -> bool:
    if not force and os.path.exists(dest) and os.path.getsize(dest) > 0:
        return True
    try:
        data = fetch(url, binary=True)
        with open(dest, "wb") as f:
            f.write(data)
        return os.path.getsize(dest) > 0
    except Exception as e:
        print(f"    FALHA {os.path.basename(dest)}: {e}", file=sys.stderr)
        try:
            os.remove(dest)
        except OSError:
            pass
        return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("index_url")
    ap.add_argument("--out", help="Pasta de saída (padrão: ~/english-study/<slug>/)")
    ap.add_argument("--jobs", type=int, default=8)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    slug = urllib.parse.urlparse(args.index_url).path.strip("/")
    out_dir = os.path.expanduser(args.out) if args.out else os.path.expanduser(f"~/english-study/{slug}")
    audio_dir = os.path.join(out_dir, "audio")
    textos_dir = os.path.join(out_dir, "textos")
    cache_dir = os.path.join(out_dir, ".cache", "html")
    for d in (audio_dir, textos_dir, cache_dir):
        os.makedirs(d, exist_ok=True)

    print(f"==> Saída: {out_dir}")
    print(f"==> Baixando página índice: {args.index_url}")
    index_html = fetch(args.index_url)

    urls = extract_index_urls(index_html, args.index_url)
    if not urls:
        print("ERRO: nenhuma URL de conteúdo encontrada no índice", file=sys.stderr)
        return 1
    print(f"==> {len(urls)} URLs detectadas (ordem de aparição)")

    # Baixar HTML em paralelo
    print(f"==> Baixando páginas HTML ({args.jobs} paralelos)...")
    def fetch_page(i_url: tuple[int, str]) -> tuple[int, str, bool]:
        i, url = i_url
        dest = os.path.join(cache_dir, f"{i:03d}.html")
        if not args.force and os.path.exists(dest) and os.path.getsize(dest) > 0:
            return i, url, True
        try:
            data = fetch(url)
            with open(dest, "w", encoding="utf-8") as f:
                f.write(data)
            return i, url, True
        except Exception as e:
            print(f"    FALHA página {i}: {e}", file=sys.stderr)
            return i, url, False

    indexed = list(enumerate(urls, 1))
    with ThreadPoolExecutor(max_workers=args.jobs) as ex:
        html_results = list(ex.map(fetch_page, indexed))
    html_ok = sum(1 for _, _, ok in html_results if ok)
    print(f"    HTMLs: {html_ok}/{len(urls)}")

    # Parsear cada página
    print("==> Extraindo texto e áudio de cada página...")
    parsed: dict[int, dict] = {}
    fmt_counts: dict[str, int] = {}
    for i, url, ok in html_results:
        if not ok:
            continue
        path = os.path.join(cache_dir, f"{i:03d}.html")
        with open(path, encoding="utf-8") as f:
            h = f.read()
        data = extract_page_data(h)
        if data is None:
            print(f"    [WARN] página {i}: conteúdo não extraído", file=sys.stderr)
            continue
        data["url"] = url
        parsed[i] = data

    # Preenche áudios faltantes por inferência de padrão
    audio_map = {i: d["mp3_url"] for i, d in parsed.items() if d["mp3_url"]}
    missing = [i for i, d in parsed.items() if not d["mp3_url"]]
    if missing and len(audio_map) >= 3:
        pat = infer_audio_pattern(audio_map)
        if pat:
            prefix, fmt, suffix = pat
            for i in missing:
                guessed = prefix + fmt.format(n=i) + suffix
                parsed[i]["mp3_url"] = guessed
                parsed[i]["mp3_inferred"] = True
            print(f"    inferido áudio para {len(missing)} item(s) sem player")

    # Baixar áudios em paralelo
    audio_jobs = [
        (i, d["mp3_url"], os.path.join(audio_dir, f"texto-{i:03d}.mp3"))
        for i, d in parsed.items()
        if d["mp3_url"]
    ]
    print(f"==> Baixando {len(audio_jobs)} áudios...")
    with ThreadPoolExecutor(max_workers=args.jobs) as ex:
        audio_results = list(
            ex.map(lambda job: (job[0], download(job[1], job[2], args.force)), audio_jobs)
        )
    audio_ok = sum(1 for _, ok in audio_results if ok)
    print(f"    áudios: {audio_ok}/{len(audio_jobs)}")

    # Escrever Markdown
    print("==> Gerando Markdown...")
    written = 0
    for i in sorted(parsed):
        d = parsed[i]
        title = d["en_title"] or d["title"] or f"Item {i}"
        pt_title = d["pt_title"]

        # Formata pares como EN/PT intercalados
        sections = []
        for en, pt in d["pairs"]:
            sections.append((en, pt))

        en_block = "\n\n".join(en for en, _ in sections if en)
        pt_block = "\n\n".join(pt for _, pt in sections if pt)

        md_parts = [f"# {i:03d} — {title}", ""]
        if pt_title:
            md_parts += [f"**Tradução:** {pt_title}", ""]
        md_parts += [
            f"**Áudio local:** [`../audio/texto-{i:03d}.mp3`](../audio/texto-{i:03d}.mp3)",
            f"**Áudio online:** {d['mp3_url']}",
            f"**Página original:** {d['url']}",
            "",
            "---",
            "",
            "## English",
            "",
            en_block,
            "",
            "---",
            "",
            "## Português",
            "",
            pt_block,
            "",
        ]
        with open(os.path.join(textos_dir, f"{i:03d}.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(md_parts))
        written += 1
    print(f"    Markdown: {written}/{len(parsed)}")

    # README
    print("==> Gerando README.md...")
    lines = [
        f"# {slug}",
        "",
        f"Total: {written} itens baixados.",
        "",
        "- `audio/` — MP3s",
        "- `textos/` — Markdown bilíngue",
        "",
        f"Fonte: {args.index_url}",
        "",
        "## Itens",
        "",
    ]
    for i in sorted(parsed):
        d = parsed[i]
        title = d["en_title"] or d["title"] or f"Item {i}"
        lines.append(
            f"{i}. [{title}](textos/{i:03d}.md) — [🔊 áudio](audio/texto-{i:03d}.mp3)"
        )
    with open(os.path.join(out_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"\nPronto. Conteúdo em: {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
