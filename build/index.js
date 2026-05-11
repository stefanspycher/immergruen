// Indexer — runs before serving or deploying.
// Two-pass walk of the content directory; produces notes.json.
// Standard library only. No imports from the app.

import * as fs from 'node:fs';
import * as path from 'node:path';

const FRONTMATTER = /^---[\s\S]*?---\r?\n?/;
const HEADING     = /^#\s+(.+?)\s*#*\s*$/m;
const WIKILINK    = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const NOT_FOUND   = '__not_found__';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--content') out.content = argv[++i];
    else if (a === '--out') out.out = argv[++i];
  }
  if (!out.content || !out.out) {
    console.error('usage: node build/index.js --content <dir> --out <file>');
    process.exit(2);
  }
  return out;
}

function walkMarkdown(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith('.md')) continue;
    const parent = e.parentPath ?? e.path ?? dir;
    results.push(path.join(parent, e.name));
  }
  return results;
}

function idFromPath(file, contentRoot) {
  const rel = path.relative(contentRoot, file);
  const noExt = rel.slice(0, -'.md'.length);
  return noExt.split(path.sep).join('/');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const contentRoot = path.resolve(args.content);
  const outPath = path.resolve(args.out);

  const files = walkMarkdown(contentRoot);

  // Pass 1 — collect titles.
  const entries = [];
  const titleCounts = new Map();

  for (const file of files) {
    const id = idFromPath(file, contentRoot);
    if (id === NOT_FOUND) continue;

    const raw = fs.readFileSync(file, 'utf8');
    const body = raw.startsWith('---') ? raw.replace(FRONTMATTER, '') : raw;

    const m = body.match(HEADING);
    const title = m ? m[1].trim() : path.basename(file, '.md');

    const relPath = path.relative(process.cwd(), file).split(path.sep).join('/');
    entries.push({ id, path: relPath, title, body });

    const lower = title.toLowerCase();
    titleCounts.set(lower, (titleCounts.get(lower) ?? 0) + 1);
  }

  const idSet = new Set(entries.map(e => e.id));

  // titles map: only titles that uniquely identify a single note.
  const titles = {};
  const byTitleUnique = new Map(); // lower title → id (for resolution below)
  for (const e of entries) {
    const lower = e.title.toLowerCase();
    if (titleCounts.get(lower) === 1) {
      titles[lower] = e.id;
      byTitleUnique.set(lower, e.id);
    }
  }

  // Pass 2 — resolve wiki-links → references → backlinks.
  const references = new Map(); // id → Set<id>
  for (const e of entries) references.set(e.id, new Set());

  for (const e of entries) {
    let match;
    WIKILINK.lastIndex = 0;
    while ((match = WIKILINK.exec(e.body)) !== null) {
      const raw = match[1].trim();
      let target = null;
      if (idSet.has(raw)) {
        target = raw;
      } else {
        const t = byTitleUnique.get(raw.toLowerCase());
        if (t) target = t;
      }
      if (target) references.get(e.id).add(target);
      // Targets resolving to NOT_FOUND are omitted.
    }
  }

  // Invert to backlinks.
  const backlinks = new Map();
  for (const id of idSet) backlinks.set(id, []);
  for (const [src, targets] of references.entries()) {
    for (const t of targets) {
      backlinks.get(t).push(src);
    }
  }
  for (const arr of backlinks.values()) arr.sort();

  // Build output.
  const notes = {};
  for (const e of entries) {
    notes[e.id] = {
      title: e.title,
      path: e.path,
      backlinks: backlinks.get(e.id),
    };
  }

  const output = { notes, titles };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`indexed ${entries.length} notes → ${path.relative(process.cwd(), outPath)}`);
}

main();
