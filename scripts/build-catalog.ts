import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const PUBLIC = path.join(ROOT, "public");
const COLLECTIONS_DIR = path.join(PUBLIC, "collections");

type Item = {
  id: string;
  title: string;
  mdPath: string;
  audioPath: string | null;
};

type Collection = {
  slug: string;
  title: string;
  count: number;
  items: Item[];
};

const PRETTY: Record<string, string> = {
  "100-textos-em-ingles-com-traducao-e-audio": "100 Textos em Inglês",
  "200-textos": "200 Textos em Inglês",
  "110-textos-em-ingles-intermediario-e-avancado-com-audio-e-traducao":
    "110 Textos Avançados",
  "100-conversacoes-em-ingles": "100 Conversações",
  "conversacoes-em-ingles-para-iniciantes": "215 Conversações (iniciantes)",
  "textos-em-ingles-para-iniciantes-com-audio": "105 Textos (iniciantes)",
};

async function isCollection(dir: string): Promise<boolean> {
  const textos = path.join(dir, "textos");
  const audio = path.join(dir, "audio");
  return existsSync(textos) && existsSync(audio);
}

function parseTitle(md: string, fallback: string): string {
  const firstLine = md.split("\n", 1)[0]?.trim() ?? "";
  const m = firstLine.match(/^#\s*\d+\s*—\s*(.+)$/);
  return m ? m[1].trim() : fallback;
}

async function scanCollection(slug: string): Promise<Collection | null> {
  const dir = path.join(COLLECTIONS_DIR, slug);
  const textosDir = path.join(dir, "textos");
  const audioDir = path.join(dir, "audio");
  if (!existsSync(textosDir)) return null;

  const files = (await readdir(textosDir))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const items: Item[] = [];
  for (const f of files) {
    const id = f.replace(/\.md$/, "");
    const mdPath = path.join(textosDir, f);
    const md = await readFile(mdPath, "utf8");
    const title = parseTitle(md, id);
    const audioRel = `texto-${id}.mp3`;
    const audioAbs = path.join(audioDir, audioRel);
    const hasAudio = existsSync(audioAbs);
    items.push({
      id,
      title,
      mdPath: `/collections/${slug}/textos/${f}`,
      audioPath: hasAudio ? `/collections/${slug}/audio/${audioRel}` : null,
    });
  }

  return {
    slug,
    title: PRETTY[slug] ?? slug,
    count: items.length,
    items,
  };
}

async function discoverSlugs(): Promise<string[]> {
  const entries = await readdir(COLLECTIONS_DIR);
  const slugs: string[] = [];
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const full = path.join(COLLECTIONS_DIR, e);
    if (await isCollection(full)) slugs.push(e);
  }
  return slugs.sort();
}

async function main() {
  const slugs = await discoverSlugs();
  if (slugs.length === 0) {
    console.error("Nenhuma coleção encontrada em", COLLECTIONS_DIR);
    process.exit(1);
  }
  const collections = (await Promise.all(slugs.map(scanCollection))).filter(
    (c): c is Collection => !!c && c.count > 0,
  );
  await Bun.write(
    path.join(PUBLIC, "catalog.json"),
    JSON.stringify({ collections }, null, 2),
  );
  const total = collections.reduce((a, c) => a + c.count, 0);
  console.log(
    `Catálogo gerado: ${collections.length} coleções, ${total} itens.`,
  );
}

await main();
