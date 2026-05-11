# Evergreen Notes App — Implementation Reference

## Stack Declaration

**HTML** — semantic structure, no framework, no templating engine.  
**CSS** — layered custom-property-driven styles. All visual decisions live in `design/tokens.css`.  
**JS** — native ES modules, no bundler, no transpiler, no third-party code. The markdown renderer is hand-rolled in `scripts/markdown.js`. The indexer is a plain Node.js script using only the standard library. See `.claude/rules/dependency-free.md`.

---

## Design.md Paradigm

All visual decisions — color, spacing, typography, timing, radius, breakpoints — are defined once in `design/tokens.css`. This file is the single source of truth for the app's appearance. Swapping a visual theme means replacing `tokens.css` only. No other file changes.

```
design/
  tokens.css        ← every CSS custom property
  animations/
    panel-open.css  ← one file per named animation, self-contained
    panel-close.css
    popover-in.css
    collapse.css
    link-highlight.css
```

Each animation file is a drop-in replacement. Removing a file reverts that transition to instant. Adding a file adds the animation. No JS changes required.

JS modules that need timing or breakpoint values read them once at module init via `getComputedStyle(document.documentElement).getPropertyValue('--token-name')`. The token in `tokens.css` remains the single source of truth; no JS constant duplicates a token value.

### Token reference (`design/tokens.css`)

The default theme. An implementer must create this file verbatim — every token referenced elsewhere in IMPL.md and the `styles/` files resolves through this file:

```css
@layer tokens {
  :root {
    /* Layout */
    --panel-width: 585px;
    --panel-overlap: 40px;
    --panel-radius: 8px;
    --header-height: 56px;
    --breakpoint: 800px;
    --collapse-threshold: 80px;

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-panel-gap: 16px;

    /* Type — system stack only, never a web font */
    --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                 "Liberation Mono", monospace;
    --text-base: 16px;
    --text-sm: 14px;
    --text-lg: 20px;
    --line-height: 1.5;

    /* Color */
    --color-bg: #ffffff;
    --color-surface: #fafafa;
    --color-surface-raised: #ffffff;
    --color-text: #1a1a1a;
    --color-muted: #6a6a6a;
    --color-border: #e0e0e0;
    --color-link: #1a73e8;
    --color-link-open: #20a020;
    --color-header-bg: rgba(255, 255, 255, 0.85);

    /* Effects */
    --shadow-popover: 0 4px 24px rgba(0, 0, 0, 0.15);
    --shadow-panel-edge: -4px 0 8px rgba(0, 0, 0, 0.06);
    --header-blur: 8px;
    --popover-width: 500px;
    --popover-max-height: 400px;
    --popover-fade: 32px;
    --popover-delay-ms: 300;
    --z-header: 100;
    --z-popover: 200;

    /* Misc */
    --icon-external: " ↗";
  }
}
```

Numeric tokens that JS reads (`--breakpoint`, `--collapse-threshold`, `--popover-delay-ms`) must remain integer px or ms values without unit math, so `parseInt` on the resolved string returns a meaningful number.

---

## File Structure

```
/
  index.html              ← app shell, one file
  config.json             ← site title, index path, bookmarks
  design/
    tokens.css            ← design tokens (the Design.md source)
    animations/           ← one CSS file per named animation
  styles/
    reset.css
    layout.css
    panel.css
    typography.css
    link.css
    popover.css
    header.css
    collapse.css
    responsive.css
  scripts/
    app.js                ← entry point, wires modules together
    config.js             ← loads config.json
    index.js              ← loads and queries the note index
    router.js             ← URL read/write, basename, SPA decode, popstate
    panels.js             ← panel lifecycle, header, click handler
    renderer.js           ← pipeline: strip frontmatter, inject heading,
                            render markdown, resolve wiki-links
    markdown.js           ← hand-rolled markdown parser (SPEC.md §4 subset)
    popover.js            ← hover popover lifecycle and positioning
    cache.js              ← in-memory note content cache
    scroll.js             ← horizontal scroll, collapse, page title
    dom.js                ← small DOM helpers (escapeHtml)
  content/
    *.md                  ← note files
  notes.json              ← generated index (build output)
  404.html                ← GitHub Pages SPA redirect (handshake half)
  build/
    index.js              ← indexer script, run before serving
    serve.js              ← local dev server with SPA fallback (Node stdlib)
  .github/
    workflows/
      deploy.yml          ← GitHub Pages build-and-deploy workflow
```

---

## CSS Layer Order

Declared once in `index.html` (see "App Shell" below):

```css
@layer reset, tokens, layout, panel, typography, link, popover, header, collapse, responsive, animations;
```

Later layers win. `animations` is last so motion never fights structure. `tokens` is second so properties cascade into every layer.

## Baseline stylesheets

Two stylesheets carry no app behaviour but anchor the visual baseline. They are short and must be created verbatim:

**`styles/reset.css`** — a minimal modern reset:

```css
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--line-height);
    -webkit-text-size-adjust: 100%;
  }
  img, svg { max-width: 100%; display: block; }
  button { font: inherit; }
}
```

**`styles/typography.css`** — the prose styles inside a panel's `.panel-content`:

```css
@layer typography {
  .panel-content h1 { font-size: 1.8em; margin-block: var(--space-lg) var(--space-md); }
  .panel-content h2 { font-size: 1.4em; margin-block: var(--space-lg) var(--space-sm); }
  .panel-content h3 { font-size: 1.15em; margin-block: var(--space-md) var(--space-sm); }
  .panel-content h4,
  .panel-content h5,
  .panel-content h6 { font-size: 1em; margin-block: var(--space-md) var(--space-xs); }

  .panel-content p,
  .panel-content ul,
  .panel-content ol,
  .panel-content blockquote,
  .panel-content table { margin-block: var(--space-sm); }

  .panel-content ul,
  .panel-content ol { padding-inline-start: var(--space-lg); }

  .panel-content code {
    font-family: var(--font-mono);
    font-size: 0.92em;
    background: var(--color-surface);
    padding: 0 4px;
    border-radius: 3px;
  }

  .panel-content pre {
    font-family: var(--font-mono);
    font-size: 0.92em;
    background: var(--color-surface);
    padding: var(--space-md);
    border-radius: var(--panel-radius);
    overflow-x: auto;
  }
  .panel-content pre code { background: none; padding: 0; }

  .panel-content blockquote {
    border-inline-start: 3px solid var(--color-border);
    padding-inline-start: var(--space-md);
    color: var(--color-muted);
  }

  .panel-content table {
    border-collapse: collapse;
    width: 100%;
  }
  .panel-content th,
  .panel-content td {
    border: 1px solid var(--color-border);
    padding: var(--space-xs) var(--space-sm);
    text-align: left;
  }

  .panel-content hr {
    border: 0;
    border-top: 1px solid var(--color-border);
    margin-block: var(--space-lg);
  }

  .panel-content .task-list-item { list-style: none; }
  .panel-content .task-list-item input[type="checkbox"] {
    margin-inline-end: var(--space-xs);
  }
}
```

Both files live in the `typography` and `reset` CSS layers (declared in §"CSS Layer Order"). Any additional typographic tuning belongs in `typography.css`; do not scatter typography rules across other files.

## App Shell (`index.html`)

The full HTML shell. The implementer must create this file verbatim except for the `<title>` placeholder and the optional animation `<link>` tags (which may be omitted if no animations are shipped):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading…</title>

    <style>
      @layer reset, tokens, layout, panel, typography, link, popover,
             header, collapse, responsive, animations;
    </style>

    <link rel="stylesheet" href="design/tokens.css">
    <link rel="stylesheet" href="styles/reset.css">
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/panel.css">
    <link rel="stylesheet" href="styles/typography.css">
    <link rel="stylesheet" href="styles/link.css">
    <link rel="stylesheet" href="styles/popover.css">
    <link rel="stylesheet" href="styles/header.css">
    <link rel="stylesheet" href="styles/collapse.css">
    <link rel="stylesheet" href="styles/responsive.css">

    <!-- Optional animation files (drop-in; absent files are silently
         ignored by the browser and degrade to instant transitions). -->
    <link rel="stylesheet" href="design/animations/panel-open.css">
    <link rel="stylesheet" href="design/animations/popover-in.css">
  </head>

  <body data-state="loading">
    <header id="site-header" role="banner">
      <a class="site-title" href="/" data-note=""></a>
      <nav class="bookmarks" aria-label="Bookmarks"></nav>
    </header>

    <main id="panels" role="main"></main>

    <div id="popover" class="popover" role="tooltip" hidden>
      <div class="popover-content"></div>
    </div>

    <template id="panel-template">
      <article class="panel" data-note-id="" data-state="loading">
        <header class="panel-header">
          <h2 class="panel-title"></h2>
        </header>
        <div class="panel-body">
          <div class="panel-content"></div>
          <footer class="panel-backlinks" hidden></footer>
        </div>
      </article>
    </template>

    <script type="module" src="scripts/app.js"></script>
  </body>
</html>
```

`index.html` contains no `<base>` element. The basename is detected at runtime by `router.js` (see §6).

## App Entry (`scripts/app.js`)

The single entry point. Every other module is reachable through it:

```js
// scripts/app.js
import {loadConfig}      from './config.js';
import * as index        from './index.js';
import * as router       from './router.js';
import * as scroll       from './scroll.js';
import {renderHeader}    from './panels.js';

document.title = 'Loading…';

const config = await loadConfig();
await index.loadIndex(config.indexPath);

scroll.init(config);
router.init(config);
renderHeader(config);

document.body.dataset.state = 'ready';
```

Top-level `await` is permitted because `<script type="module">` is loaded as a module. No bundler is required.

**Init order is load-bearing.** `scroll.init` must run before `router.init`, because `router.init → syncFromURL → panels.renderStack → stampPanel → scroll.observe` requires the IntersectionObserver to exist. `router.init` must run before `renderHeader`, because `renderHeader` writes anchor hrefs via `router.href(id)`, which reads `router._base`. With the wrong order, the site-title and bookmark hrefs are stamped before `_base` is set and silently miss the basename in subdirectory deployments (e.g., `/Home` instead of `/immergruen/Home`). Click behaviour still works because the delegated handler uses `data-note` + `router.pushStack`, but middle-click "open in new tab" and screen readers would see the wrong URL.

---

## 1. Application Configuration

**HTML:** None. Configuration is not reflected in markup.

**CSS:** None.

**JS — `scripts/config.js`:**

```js
// scripts/config.js
export async function loadConfig() {
  const res = await fetch('./config.json');
  if (!res.ok) throw new Error('config.json missing');
  return res.json();
  // { title, indexPath, bookmarks: [id, ...], basename?: '/repo' }
}
```

`config.json` is fetched once before any other module initialises. The fetch URL is document-relative (`./config.json`) — not basename-prefixed — because `basename` cannot be computed until after the config is loaded. The browser resolves `./` against `document.baseURI`, which always points inside the deployment directory.

The resolved config object is passed to every module that needs it (`router.init`, `scroll.init`, `panels.renderHeader`). No global variables. No runtime mutation.

If `bookmarks` is empty or missing, `renderer.NOT_FOUND_ID` is used as the landing note. If `basename` is missing on a non-`*.github.io` host, the basename defaults to the empty string (root deployment).

---

## 2. Note Data Model

**HTML:** A note is represented in the DOM only when it has an open panel. No hidden markup for unrendered notes.

**CSS:** None. The data model has no visual representation.

**JS — `scripts/index.js`:**

The in-memory index has two parts: a `Map<id, { title, path, backlinks[] }>` for note metadata, and a `Map<lowercased_title, id>` for unique-title resolution. All lookups are `O(1)` map gets. The structure matches the JSON index exactly so no transformation is needed on load.

```js
// scripts/index.js
let notes  = new Map();
let titles = new Map(); // lowercased title → id (unique titles only)

export async function loadIndex(path) {
  // `path` is relative to the deployment root (e.g. "notes.json").
  // Document-relative `./` resolution handles subdirectory deployments —
  // basename math is not needed for fetches.
  const res = await fetch('./' + path);
  if (!res.ok) throw new Error('index fetch failed: ' + path);
  const raw = await res.json();
  notes  = new Map(Object.entries(raw.notes ?? {}));
  titles = new Map(Object.entries(raw.titles ?? {}));
}

export const getNote     = id    => notes.get(id) ?? null;
export const hasNote     = id    => notes.has(id);
export const findByTitle = title => titles.get(title.toLowerCase()) ?? null;
export const allNotes    = ()    => notes;
```

---

## 3. Note Index

**HTML:** None.

**CSS — `styles/layout.css` (loading-state rule):**

```css
@layer layout {
  body[data-state="loading"] #panels { visibility: hidden; }
}
```

The `<body>` carries `data-state="loading"` until `loadConfig` and `loadIndex` both resolve. `scripts/app.js` (see "App Entry") flips it to `data-state="ready"` afterward. Nothing renders until both promises settle.

The index `Map` is module-private; every other module accesses it through `index.js` exports — there is no shared mutable global.

**JS — `scripts/cache.js`:**

```js
// scripts/cache.js
const store = new Map();
export const get = id       => store.get(id);
export const set = (id, md) => store.set(id, md);
export const has = id       => store.has(id);
```

A second fetch for any note is short-circuited in `panels.loadContent` and `popover.loadContent` by checking `cache.has(id)` before calling `fetch`. The cache is keyed by note identifier, not path, so the not-found id has a single slot too.

---

## 4. Content Authoring

### Render pipeline (`scripts/renderer.js`)

The render pipeline composes three pure functions. It is the only module that produces HTML strings from raw markdown:

```js
// scripts/renderer.js
import {renderMarkdown}  from './markdown.js';
import * as index        from './index.js';
import * as router       from './router.js';

export const NOT_FOUND_ID       = '__not_found__';
export const NOT_FOUND_TITLE    = 'Not found';
const NOT_FOUND_MARKDOWN        =
  `# ${NOT_FOUND_TITLE}\n\nThis note does not exist.`;

export const isNotFound       = id => id === NOT_FOUND_ID;
export const notFoundContent  = () => NOT_FOUND_MARKDOWN;
export const resolveOrFallback = id =>
  index.hasNote(id) || isNotFound(id) ? id : NOT_FOUND_ID;

export function process(id, rawMd) {
  const stripped = stripFrontmatter(rawMd);
  const withHeading = injectTitleHeading(id, stripped);
  const html = renderMarkdown(withHeading);
  return resolveWikilinks(html);
}

function stripFrontmatter(md) {
  return md.startsWith('---')
    ? md.replace(/^---[\s\S]*?---\r?\n?/, '')
    : md;
}

function injectTitleHeading(id, md) {
  // Skip blank lines, then check if the first non-blank line is an ATX heading.
  if (/^\s*#/.test(md)) return md;
  const title = isNotFound(id)
    ? NOT_FOUND_TITLE
    : (index.getNote(id)?.title ?? id);
  return `# ${title}\n\n${md}`;
}
```

### YAML frontmatter

Stripped by `stripFrontmatter`, above. The regex matches an opening `---` at column zero, the smallest non-greedy run, a closing `---`, and an optional trailing newline. Frontmatter content is never rendered.

### Heading injection

`injectTitleHeading` implements SPEC §7 step 2. If the (frontmatter-stripped) content does not begin with an ATX heading after leading whitespace, the note's title from the index is prepended as an H1. For the not-found note, the constant `NOT_FOUND_TITLE` is used because the index has no entry for it.

### Markdown renderer (`scripts/markdown.js`)

`scripts/markdown.js` is the hand-rolled, dependency-free parser for the subset specified in SPEC §4. It exports one function:

```js
export function renderMarkdown(md) { /* returns an HTML string */ }
```

**Algorithm — two passes.**

**Pass 1: block tokenization.** Split the input into lines and walk top-to-bottom, classifying each line by trying the rules below in order. The first match wins:

1. **Fenced code block.** Open on `/^```(\S*)?\s*$/`, close on the next bare ```` ``` ```` line. The content between is HTML-escaped and emitted inside `<pre><code class="language-{lang}">…</code></pre>`. No inline parsing inside.
2. **ATX heading.** `/^(#{1,6})\s+(.+?)\s*#*\s*$/` → `<h{n}>{inline(text)}</h{n}>`.
3. **Horizontal rule.** `/^(---|\*\*\*|___)\s*$/` → `<hr>`.
4. **Blockquote.** A run of consecutive lines each starting with `>`. Strip the leading `>` (and one optional space) from each, then recursively block-parse the result and wrap in `<blockquote>…</blockquote>`.
5. **Table.** A pipe-delimited row (`/^\|.*\|\s*$/`) followed immediately by a separator row of the form `| --- | :---: | ---: |` (with optional `:` for alignment). Subsequent pipe-prefixed rows are body rows. Emit `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` with `text-align` on cells when alignment is specified. Inline-parse cell contents.
6. **List.** A line starting with `-`, `*`, `+`, or `<digits>.` after zero or more spaces. Group consecutive list lines. Indentation in multiples of two spaces opens a nested list inside the previous item. Each item's content is inline-parsed. If the content begins with `[ ]` or `[x]` (case-insensitive on the `x`), strip the marker and prepend `<input type="checkbox" disabled[ checked]>` to the item's inline content; add `class="task-list-item"` to the `<li>`.
7. **Indented code block.** Four-space-indented lines that are not the continuation of a list item are gathered into a single `<pre><code>…</code></pre>` block (HTML-escaped, no inline parsing).
8. **Paragraph.** Any run of non-empty, non-matching lines. Adjacent lines join with a single space. A blank line ends the paragraph. Inline-parse the joined text. Emit `<p>…</p>`.

A blank line terminates the current block. Two or more blank lines collapse to one.

**Pass 2: inline parsing.** Within each non-code block's raw text, apply these transformations in order. Each step operates on the text already produced by the previous step:

1. **HTML-escape** ampersands and angle brackets that are not already part of HTML emitted in pass 1. The simplest correct implementation is to inline-parse the *raw text* (before any HTML emission), so every `<` in the input is an escape candidate; HTML emitted by pass 1 (e.g., `<li>`) is added around the inline-parsed text after this step.
2. **Code spans.** `` `code` `` → `<code>{escape(code)}</code>`. The content of a code span receives no further inline parsing.
3. **Auto-links.** `<https?://[^>\s]+>` → `<a href="$1">$1</a>` (with the external-link decoration from step 6's link rule). `<[^@\s>]+@[^@\s>]+>` → `<a href="mailto:$1">$1</a>`.
4. **Images.** `!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)` → `<img src="$2" alt="$1"[ title="$3"]>`.
5. **Markdown links.** `\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)` → `<a href="$2"[ title="$3"][ external attrs]>$1</a>`. A link is external when `new URL(href, location.href).origin !== location.origin`; external links receive `target="_blank" rel="noopener noreferrer"`.
6. **Bold.** `\*\*([^*]+)\*\*` and `__([^_]+)__` → `<strong>$1</strong>`.
7. **Italic.** `\*([^*]+)\*` and `_([^_]+)_` → `<em>$1</em>`. Italic is applied after bold so `***x***` is bold-italic.
8. **Strikethrough.** `~~([^~]+)~~` → `<del>$1</del>`.
9. **Hard line breaks.** A `  ` (two trailing spaces) or `\\` at end of a paragraph line → `<br>`.

Wiki-link tokens (`[[…]]`) are not part of standard markdown syntax and are passed through pass 1 and pass 2 unchanged — they appear as literal text in the rendered HTML. They are converted to internal-link anchors in the next stage.

### Wiki-link post-processing

After `renderMarkdown` returns, `resolveWikilinks(html)` rewrites every `[[id]]` and `[[id|label]]` token in the HTML *outside* `<code>` and `<pre>` regions. The same resolution order specified in SPEC §4 is applied — exact identifier match, then unique title, otherwise the not-found note:

```js
const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function resolveTarget(raw) {
  const trimmed = raw.trim();
  if (index.hasNote(trimmed))       return trimmed;
  const byTitle = index.findByTitle(trimmed);
  return byTitle ?? NOT_FOUND_ID;
}

function resolveWikilinks(html) {
  // Split on <pre>…</pre> and <code>…</code> regions; only non-code
  // segments are substituted. Code regions pass through unchanged.
  const PROTECTED = /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g;
  const parts = html.split(PROTECTED);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part; // odd indices are the protected matches
    return part.replace(WIKILINK, (_, raw, label) => {
      const target = resolveTarget(raw);
      const text   = label?.trim() ?? raw.trim();
      return `<a href="${router.href(target)}" data-note="${target}" class="internal-link">${escapeHtml(text)}</a>`;
    });
  }).join('');
}
```

`escapeHtml` lives in `scripts/dom.js`:

```js
// scripts/dom.js
const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ESC[c]);
```

The `data-note` attribute is the single identifier used downstream by click handlers, popover triggers, and visual-state checks.

---

## 5. Build Pipeline

**HTML:** None. The indexer is a Node.js script, not part of the app shell.

**CSS:** None.

**JS — `build/index.js`:**

A standalone script run before serving or deploying. Has no shared code with the app modules.

```
node build/index.js --content ./content --out ./notes.json
```

The indexer runs in **two passes** over the content directory. The first pass builds the title-to-identifier resolution table; the second pass resolves wiki-links against it. A single-pass walk cannot work because a wiki-link in the first file scanned may resolve to a title introduced by the last file scanned.

**Pass 1 — collect titles.**

1. `fs.readdirSync(..., { recursive: true })` walks the content directory; the walker keeps only files ending in `.md`.
2. For each file, derive `id` as the path relative to `--content`, with the `.md` extension removed and path separators normalised to `/`. **Skip the file entirely if `id === '__not_found__'`** — that identifier is reserved (SPEC §13) and must never appear in the index.
3. Read the file. Strip its YAML frontmatter (same regex as the runtime: `/^---[\s\S]*?---\r?\n?/`).
4. Extract the title: the text of the first ATX heading in the stripped content, matched by `/^#\s+(.+?)\s*#*\s*$/m`. If no heading exists, the title is the filename without extension.
5. Store `{ id, path: <content-relative path>, title, body: <stripped content> }` in a working list.
6. Accumulate the lowercased title in a `titleCounts` map (`Map<string, number>`). After the walk, build the final `titles` map (`Map<lowercased_title, id>`) from titles whose count is exactly one — titles that map to more than one id are dropped so they cannot be used to disambiguate at runtime.

**Pass 2 — resolve references.**

7. For each entry from pass 1, scan the body with the wiki-link regex `/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g`. For each match, resolve the target using the same order as the runtime renderer: exact identifier match (against the pass-1 id set), then unique title match (against the `titles` map), otherwise the not-found note. Add resolved-to-known-note targets to the `references` map (`Map<id, Set<id>>`). Targets resolving to the not-found note are omitted from `references`.
8. Invert `references` to produce `backlinks` (`Map<id, id[]>`). Backlink arrays are sorted alphabetically by id for deterministic output.

**Output.** Write a single JSON file with this shape:

```json
{
  "notes": {
    "<id>": { "title": "<string>", "path": "<content-relative path>", "backlinks": ["<id>", ...] }
  },
  "titles": {
    "<lowercased-title>": "<id>"
  }
}
```

The indexer imports nothing from the app and depends only on the Node.js standard library (`fs`, `path`). The wiki-link, frontmatter, and heading regexes are inlined; they must match the runtime regexes byte-for-byte. If the regexes drift, backlinks will not match what readers see in the rendered HTML.

---

## 6. Routing and Navigation

**HTML:** None. The URL is managed entirely in JS.

**CSS:** None.

**JS — `scripts/router.js`:**

The router owns four responsibilities: detect the basename, decode the GitHub-Pages SPA redirect on entry, parse the URL into a stack of note ids, and push new URLs when the stack changes.

URL structure: `/<primary-id>?stack=<id>&stack=<id>&...`. Identifiers may contain `/` (subdirectory notes), so the primary identifier is recovered by greedy-matching against the index — the longest joined path-segment prefix that is a known identifier wins. Each `stack` value and each primary-id path segment is URL-encoded individually, so commas, spaces, and other reserved characters in identifiers carry no encoding risk.

```js
// scripts/router.js
import * as index    from './index.js';
import * as panels   from './panels.js';

const PARAM = 'stack';

let _base   = '';
let _config = null;

export const base     = ()     => _base;
export const basename = path   => _base + path;
export const href     = id     =>
  _base + '/' + id.split('/').map(encodeURIComponent).join('/');

export function init(config) {
  _config = config;
  _base   = computeBase(config);
  decodeSpaRedirect();
  redirectRootToLanding();
  window.addEventListener('popstate', syncFromURL);
  syncFromURL();
}

// SPEC §6: the root path redirects to the default landing note (first
// bookmark) so the URL always names the visible primary note.
function redirectRootToLanding() {
  const rel = location.pathname.startsWith(_base)
    ? location.pathname.slice(_base.length)
    : location.pathname;
  const segments = rel.split('/').filter(Boolean);
  if (segments.length > 0) return;
  const landing = _config.bookmarks?.[0];
  if (!landing) return;
  const encoded = landing.split('/').map(encodeURIComponent).join('/');
  history.replaceState(null, '', _base + '/' + encoded + location.search + location.hash);
}

function computeBase(config) {
  if (location.host.endsWith('.github.io')) {
    const seg = location.pathname.split('/').filter(Boolean)[0];
    return seg ? '/' + seg : '';
  }
  return config.basename ?? '';
}

// rafgraph/spa-github-pages handshake: 404.html rewrites
//   /immergruen/foo/bar?baz   →   /immergruen/?/foo/bar&baz
// On entry we restore the original path before any other module reads the URL.
function decodeSpaRedirect() {
  const search = location.search;
  if (!search.startsWith('?/')) return;
  const decoded = search.slice(2)
    .replace(/&/g, '?')
    .replace(/~and~/g, '&');
  const restored = _base + '/' + decoded + location.hash;
  history.replaceState(null, '', restored);
}

export function getStack() {
  const path = location.pathname.startsWith(_base)
    ? location.pathname.slice(_base.length)
    : location.pathname;
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);

  let primary = null;
  for (let i = segments.length; i > 0; i--) {
    const candidate = segments.slice(0, i).join('/');
    if (index.hasNote(candidate)) { primary = candidate; break; }
  }

  if (!primary) {
    if (segments.length === 0) {
      primary = _config.bookmarks?.[0] ?? '__not_found__';
    } else {
      primary = '__not_found__';
    }
  }

  const stacked = new URLSearchParams(location.search)
    .getAll(PARAM).map(decodeURIComponent).filter(Boolean);
  return [primary, ...stacked];
}

export function pushStack(stack) {
  const [primary, ...rest] = stack;
  const params = new URLSearchParams();
  rest.forEach(id => params.append(PARAM, id));
  const query = params.toString();
  const path  = primary.split('/').map(encodeURIComponent).join('/');
  const url   = _base + '/' + path + (query ? '?' + query : '');
  history.pushState(null, '', url);
  syncFromURL();
}

function syncFromURL() {
  panels.renderStack(getStack());
}
```

**Basename behaviour, per SPEC §6:**

- On `*.github.io` hosts, `_base` is the first non-empty path segment prefixed with `/` (e.g., `/immergruen`).
- On all other hosts, `_base` is `config.basename ?? ''`. The same artifact serves both at the root and from a subdirectory.

**`popstate`.** Back/forward navigation calls `syncFromURL`, which re-reads the URL and asks `panels.renderStack` to reconcile the DOM. The renderer is idempotent — calling `renderStack` with the same stack twice produces no changes.

**Internal-link click handler.** The delegated click handler lives in `panels.js` (it needs access to the current stack), not in `router.js`. The handler calls `router.pushStack(...)`.

---

## 7. Note Rendering

**HTML — panel template (stamped by JS):**

```html
<article class="panel" data-note-id="" data-state="loading">
  <header class="panel-header">
    <h2 class="panel-title"></h2>
  </header>
  <div class="panel-body">
    <div class="panel-content"></div>
    <footer class="panel-backlinks" hidden></footer>
  </div>
</article>
```

Attributes drive CSS state. No class toggling for state — only `data-*` attributes and CSS attribute selectors.

```css
/* panel.css */
.panel[data-state="loading"] .panel-content { opacity: 0; }
.panel[data-state="ready"]   .panel-content { opacity: 1; }
```

**CSS — `panel.css`:**

```css
@layer panel {
  .panel {
    width: var(--panel-width);
    height: 100%;
    flex-shrink: 0;
    overflow-y: auto;
    background: var(--color-surface);
    border-radius: var(--panel-radius);
    container-type: inline-size;
    container-name: panel;
    anchor-name: --panel;
  }

  /* Internal padding for prose content. The injected H1 (from
     `renderer.injectTitleHeading`) is the visible title; `.panel-header`
     stays hidden while the panel is expanded — see `collapse.css`. */
  .panel-content { padding: var(--space-md); }
}
```

**JS — `scripts/panels.js`:**

`panels.js` owns the DOM lifecycle for note panels. It exports `renderStack(stack)` (called by the router on every URL change) and `renderHeader(config)` (called once on app boot). It registers a single delegated click handler at module scope for every `a[data-note]` in the document.

```js
// scripts/panels.js
import * as index    from './index.js';
import * as cache    from './cache.js';
import * as renderer from './renderer.js';
import * as router   from './router.js';
import * as scroll   from './scroll.js';
import * as popover  from './popover.js';
import {escapeHtml}  from './dom.js';

const root     = document.getElementById('panels');
const template = document.getElementById('panel-template');

let currentStack = [];

export function renderHeader({title, bookmarks}) {
  const landing = bookmarks?.[0] ?? renderer.NOT_FOUND_ID;
  const titleEl = document.querySelector('.site-title');
  titleEl.textContent     = title;
  titleEl.href            = router.href(landing);
  titleEl.dataset.note    = landing;
  document.querySelector('.bookmarks').innerHTML = (bookmarks ?? [])
    .map(id => {
      const t = index.getNote(id)?.title ?? id;
      return `<a href="${router.href(id)}" data-note="${id}" class="bookmark-link">${escapeHtml(t)}</a>`;
    }).join('');
}

export function renderStack(stack) {
  // Remove panels that are no longer in the stack.
  [...root.children].forEach(panel => {
    if (!stack.includes(panel.dataset.noteId)) panel.remove();
  });

  // Insert / reorder panels to match `stack`.
  stack.forEach((id, i) => {
    const existing = root.children[i];
    if (existing && existing.dataset.noteId === id) return;
    const panel = existingPanelFor(id) ?? stampPanel(id, i);
    root.insertBefore(panel, existing ?? null);
    if (panel.dataset.state !== 'ready') hydrate(panel, id);
  });

  // z-index ascends with stack position so later panels paint on top.
  [...root.children].forEach((p, i) => p.style.zIndex = i + 1);
  currentStack = stack;
  updateLinkOpenState();
  scroll.onStackChanged(stack);
}

function existingPanelFor(id) {
  return [...root.children].find(p => p.dataset.noteId === id) ?? null;
}

function stampPanel(id, stackIndex) {
  const fragment = template.content.cloneNode(true);
  const panel    = fragment.querySelector('.panel');
  panel.dataset.noteId = id;
  panel.style.zIndex   = stackIndex + 1;
  scroll.observe(panel);
  return panel;
}

async function hydrate(panel, id) {
  const note  = index.getNote(id);
  const title = note?.title ?? renderer.NOT_FOUND_TITLE;
  panel.querySelector('.panel-title').textContent = title;

  const md = renderer.isNotFound(id)
    ? renderer.notFoundContent()
    : await loadContent(id, note);

  panel.querySelector('.panel-content').innerHTML = renderer.process(id, md);
  if (!renderer.isNotFound(id) && note?.backlinks?.length) {
    renderBacklinks(panel, note);
  }
  panel.dataset.state = 'ready';

  panel.querySelectorAll('.internal-link').forEach(el => popover.wire(el));
  updateLinkOpenState();
}

async function loadContent(id, note) {
  if (cache.has(id)) return cache.get(id);
  // Note paths are relative to the deployment root. Document-relative `./`
  // resolution handles subdirectory deployments — basename math is not
  // needed for content fetches.
  const path = note.path.split('/').map(encodeURIComponent).join('/');
  const res  = await fetch('./' + path);
  const text = res.ok ? await res.text() : renderer.notFoundContent();
  cache.set(id, text);
  return text;
}

function renderBacklinks(panel, note) {
  const footer = panel.querySelector('.panel-backlinks');
  const items  = note.backlinks.map(id => {
    const t = index.getNote(id)?.title ?? id;
    return `<a href="${router.href(id)}" data-note="${id}" class="internal-link">${escapeHtml(t)}</a>`;
  }).join('');
  footer.innerHTML = '<p class="backlinks-label">Linked from</p>' + items;
  footer.hidden = false;
}

function updateLinkOpenState() {
  document.querySelectorAll('a[data-note]').forEach(el => {
    el.dataset.open = currentStack.includes(el.dataset.note) ? 'true' : 'false';
  });
}

// Breakpoint is read from the token, not duplicated as a JS literal.
const BREAKPOINT = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint'),
  10
);
const isMobile = () => window.innerWidth < BREAKPOINT;

// Single delegated handler covers in-content links, backlinks, bookmarks,
// and the site title — anything with `data-note`.
document.addEventListener('click', e => {
  const link = e.target.closest('a[data-note]');
  if (!link) return;
  e.preventDefault();
  const id = link.dataset.note;

  // Header clicks (site title, bookmarks) are top-level navigation per
  // SPEC.md §11: they always replace the stack with `[id]`, even if the
  // target is already open. Detected by absence of a parent `.panel`.
  const parentPanel = link.closest('.panel');
  if (!parentPanel || isMobile()) {
    router.pushStack([id]);
    return;
  }

  if (currentStack.includes(id)) {
    scroll.scrollToNote(id);
    return;
  }

  const parentId = parentPanel.dataset.noteId;
  const idx      = currentStack.indexOf(parentId);
  const trimmed  = idx >= 0
    ? currentStack.slice(0, idx + 1)
    : currentStack.slice(0, 1);

  router.pushStack([...trimmed, id]);
});

// Re-evaluate the small-screen branch when the viewport crosses the breakpoint.
let _lastMobile = isMobile();
window.addEventListener('resize', () => {
  const now = isMobile();
  if (now !== _lastMobile) {
    _lastMobile = now;
    // Re-render with the same stack so responsive.css can re-apply.
    renderStack(currentStack);
  }
});
```

**Loading sequence per panel.** `stampPanel` synchronously inserts the template-stamped DOM with `data-state="loading"`; `hydrate` resolves the markdown asynchronously, swaps in the rendered HTML, stamps backlinks (when present and the note exists), and flips `data-state` to `"ready"`. The CSS attribute selector on `[data-state]` reveals content with no class toggling.

---

## 8. Link Behavior

**HTML:**

Internal links carry `data-note="<id>"` and `class="internal-link"`. External links produced by the markdown renderer are emitted with `target="_blank" rel="noopener noreferrer"` (see §4 "Markdown links"). No post-processing scan is needed.

**CSS — `link.css`:**

```css
@layer link {
  .internal-link { color: var(--color-link); }

  .internal-link[data-open="true"] {
    color: var(--color-link-open);
    text-decoration-style: dotted;
  }

  a[target="_blank"]::after {
    content: var(--icon-external);
    font-size: 0.7em;
    opacity: 0.5;
  }
}
```

`data-open` is set/unset on every `a[data-note]` (in-content links, bookmarks, the site title, backlinks) by `panels.updateLinkOpenState()` — one `querySelectorAll` pass per `renderStack`, one attribute write per link. `data-open="true"` selects the styled state for notes already in the stack.

**Click handling.** The single delegated `click` listener is registered at the document level inside `panels.js` (see §7). It dispatches on `e.target.closest('a[data-note]')`, so it covers in-content wiki-links, backlinks, bookmarks, and the site title with one handler:

- **Header clicks** (the link has no parent `.panel` — i.e., it is the site title or a bookmark): the stack is replaced with `[id]` via `router.pushStack([id])` per SPEC.md §11. This branch fires unconditionally — even if the target is already open in the current stack — because the header is a top-level navigation surface and always resets the stack.
- On small screens (`window.innerWidth < --breakpoint`): the link replaces the entire stack via `router.pushStack([id])`.
- On large screens (in-content / backlinks / popover-source link), if the linked note is already in the stack: `scroll.scrollToNote(id)`, no URL change.
- Otherwise: trim the stack to the panel containing the link and push `[...trimmed, id]`.

`isMobile()` reads `--breakpoint` once at module load via `getComputedStyle`, so the JS branch stays in sync with the CSS responsive rules without duplicating the number.

---

## 9. Hover Popover Preview

**HTML — one global popover element:**

```html
<div id="popover" class="popover" role="tooltip" hidden>
  <div class="popover-content"></div>
</div>
```

One instance, repositioned and refilled on each trigger. Never cloned.

**CSS — `popover.css`:**

```css
@layer popover {
  .popover {
    position: fixed;
    width: var(--popover-width);
    max-height: var(--popover-max-height);
    overflow: hidden;
    background: var(--color-surface-raised);
    border-radius: var(--panel-radius);
    box-shadow: var(--shadow-popover);
    pointer-events: none;
    z-index: var(--z-popover);

    /* Fade-and-clip the bottom edge so long content does not appear
       hard-truncated. The popover is intentionally not scrollable —
       see SPEC.md §9. */
    mask-image: linear-gradient(
      to bottom,
      black 0,
      black calc(100% - var(--popover-fade)),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      black 0,
      black calc(100% - var(--popover-fade)),
      transparent 100%
    );
  }

  .popover[hidden] { display: none; }

  /* Inner content area: padded so prose does not bleed to the popover edge,
     and typographically smaller so the popover reads as secondary to the
     underlying note panels. */
  .popover-content {
    padding: var(--space-md);
    font-size: 0.8em;
  }
}
```

**JS — `scripts/popover.js`:**

Positioning is calculated in JS using `getBoundingClientRect()` on the hovered link. Prefers right; falls back to left if `link.right + popoverWidth > window.innerWidth`. Vertical position is centred on the link's vertical midpoint, clamped to keep the popover in the viewport.

```js
// scripts/popover.js
import * as index    from './index.js';
import * as cache    from './cache.js';
import * as renderer from './renderer.js';

const POPOVER_DELAY = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--popover-delay-ms'),
  10
);
const POPOVER_WIDTH = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--popover-width'),
  10
);

const el      = document.getElementById('popover');
const content = el.querySelector('.popover-content');

let hoverTimer  = null;
let currentLink = null;

export function wire(linkEl) {
  if (linkEl.dataset.popoverWired === 'true') return;
  linkEl.dataset.popoverWired = 'true';
  linkEl.addEventListener('mouseenter', () => {
    currentLink = linkEl;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => show(linkEl), POPOVER_DELAY);
  });
  linkEl.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    if (currentLink === linkEl) currentLink = null;
    hide();
  });
}

async function show(linkEl) {
  const id = linkEl.dataset.note;
  if (!id) return;

  // Position before fetching so the popover never flashes at (0,0).
  position(linkEl);
  content.innerHTML = '';
  el.hidden = false;

  const md = renderer.isNotFound(id)
    ? renderer.notFoundContent()
    : await loadContent(id);

  // The hover may have ended while we were fetching.
  if (currentLink !== linkEl) return;
  content.innerHTML = renderer.process(id, md);
}

function hide() {
  el.hidden = true;
  content.innerHTML = '';
}

function position(linkEl) {
  const r = linkEl.getBoundingClientRect();
  const fitsRight = r.right + POPOVER_WIDTH <= window.innerWidth;
  const x = fitsRight ? r.right : Math.max(0, r.left - POPOVER_WIDTH);
  const midY = r.top + r.height / 2;
  el.style.left = x + 'px';
  el.style.top  = midY + 'px';
  el.style.transform = 'translateY(-50%)';
}

async function loadContent(id) {
  if (cache.has(id)) return cache.get(id);
  const note = index.getNote(id);
  if (!note) return renderer.notFoundContent();
  const path = note.path.split('/').map(encodeURIComponent).join('/');
  const res  = await fetch('./' + path);
  const text = res.ok ? await res.text() : renderer.notFoundContent();
  cache.set(id, text);
  return text;
}
```

`POPOVER_DELAY` and `POPOVER_WIDTH` are read from tokens once at module init via `getComputedStyle` — the design file controls them, not JS constants. The popover never scrolls and never receives pointer events, so leaving the link unconditionally dismisses it; the mask-image fade signals to the reader that more content exists in the linked note.

`wire(linkEl)` is idempotent — the `data-popover-wired` flag prevents double-binding when the same link element is re-wired across renders.

Content is fetched and cached via `cache.js` and rendered through the same `renderer.process()` pipeline as main panels.

---

## 10. Panel Layout and Responsiveness

**HTML:**

```html
<main id="panels" role="main"></main>
```

A single flex container. Panels are direct children.

**CSS — `layout.css`:**

```css
@layer layout {
  #panels {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow-x: auto;
    overflow-y: hidden;
    height: calc(100dvh - var(--header-height));
    scroll-snap-type: x proximity;
    gap: 0;
    padding: var(--space-panel-gap);
  }

  .panel {
    scroll-snap-align: start;
    position: relative;
  }

  /* Frames overlap, content does not — SPEC.md §10. The pseudo-element
     paints the panel's frame leftward without shifting its content box. */
  .panel + .panel::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--panel-overlap) * -1);
    width: var(--panel-overlap);
    background: var(--color-surface);
    border-top-left-radius: var(--panel-radius);
    border-bottom-left-radius: var(--panel-radius);
    box-shadow: var(--shadow-panel-edge);
    pointer-events: none;
    z-index: -1;
  }
}
```

Overlap is implemented by a `::before` pseudo-element on every non-first panel, extending the painted frame leftward without shifting its content box. Panel depth is expressed via `z-index` incremented by JS on stamp: `panel.style.zIndex = stackIndex`.

**CSS — `collapse.css`:**

```css
@layer collapse {
  /* The panel-header is the collapsed-state title strip. While the panel
     is expanded, the in-content H1 (injected by `renderer.injectTitleHeading`)
     is the visible title, so the header element stays hidden to avoid
     duplicating it. */
  .panel:not([data-collapsed="true"]) .panel-header { display: none; }

  .panel[data-collapsed="true"] .panel-content,
  .panel[data-collapsed="true"] .panel-backlinks { display: none; }

  .panel[data-collapsed="true"] .panel-header {
    writing-mode: vertical-rl;
    height: 100%;
    padding: var(--space-sm);
  }
}
```

Collapse is driven by a `data-collapsed` attribute set by `scroll.js`. CSS container query conditions cannot read CSS custom properties, so the threshold lives in JS — read once at module init via `getComputedStyle` from the `--collapse-threshold` token — and the attribute is the bridge between the threshold check and the styling.

**JS — `scripts/scroll.js`:**

`scroll.js` owns horizontal scrolling, panel visibility tracking, and the browser tab title. Other modules call its exported helpers; they never read `scrollLeft` directly.

```js
// scripts/scroll.js
import * as index from './index.js';

const COLLAPSE_THRESHOLD = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--collapse-threshold'),
  10
);
const PANEL_WIDTH = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--panel-width'),
  10
);

const root = document.getElementById('panels');
let observer = null;
let siteTitle = '';

export function init(config) {
  siteTitle = config.title ?? '';
  observer = new IntersectionObserver(onIntersect, {
    root,
    threshold: [0, 0.5, 1],
  });
  root.addEventListener('scroll', () => {
    syncCollapse();
    updateTitle();
  }, { passive: true });
}

export function observe(panel) {
  observer?.observe(panel);
}

export function scrollToPanel(panel) {
  if (!panel) return;
  // Use the panel's offsetLeft so we land on a panel-aligned scroll position.
  root.scrollTo({ left: panel.offsetLeft, behavior: 'smooth' });
}

export function scrollToNote(id) {
  const panel = root.querySelector(`.panel[data-note-id="${cssEscape(id)}"]`);
  scrollToPanel(panel);
}

export function onStackChanged(stack) {
  // When the stack grows, focus the newly added (last) panel. When the stack
  // shrinks or a same-id update fires, keep the existing scroll position.
  const last = root.lastElementChild;
  if (last) scrollToPanel(last);
  syncCollapse();
  updateTitle();
}

function onIntersect(entries) {
  entries.forEach(entry => {
    entry.target.dataset.visible = String(entry.isIntersecting);
  });
  syncCollapse();
  updateTitle();
}

function syncCollapse() {
  [...root.children].forEach(panel => {
    const width = panel.getBoundingClientRect().width;
    panel.dataset.collapsed = String(width < COLLAPSE_THRESHOLD);
  });
}

function updateTitle() {
  const visibleTitles = [...root.children]
    .filter(p => p.dataset.visible !== 'false')
    .map(p => index.getNote(p.dataset.noteId)?.title)
    .filter(Boolean);
  document.title = visibleTitles.length
    ? visibleTitles.join(' | ')
    : siteTitle;
}

// CSS.escape is supported in all evergreen-target browsers. Fall back to
// a regex for older runtimes.
function cssEscape(s) {
  return typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(s)
    : s.replace(/[^a-zA-Z0-9_-]/g, m => '\\' + m);
}
```

`IntersectionObserver` reports panel visibility (used for `data-visible` and the page-title sync) without polling. The `scroll` event handler — installed on `#panels`, not `window` — keeps `data-collapsed` and the page title accurate during scroll-driven changes. New panels register via `scroll.observe(panel)` from `panels.stampPanel`.

**Responsive — `styles/responsive.css`:**

Small-screen layout per SPEC §10: only the last panel renders, the header collapses padding, and panel width fills the viewport. The stacked-panel system is preserved structurally in the DOM (so back/forward and `scrollToNote` keep working) but visually suppressed below the breakpoint.

```css
@layer responsive {
  @media (max-width: 799px) {
    #panels { padding: 0; }

    .panel { width: 100vw; }

    /* Hide every panel except the last (the most recently opened). */
    .panel:not(:last-child) { display: none; }

    /* Frame overlap is a desktop affordance only. */
    .panel + .panel::before { display: none; }

    #site-header { padding-inline: var(--space-md); }
  }
}
```

The breakpoint is `--breakpoint` (default `800px`). Implementers must keep the media-query value in sync with the token by reading the token at JS init (`panels.js`, `popover.js`) and by writing the same literal in `responsive.css`. If the token changes, both updates ship together.

**Page title.** `scroll.updateTitle()` (defined above) maintains `document.title` from the titles of currently visible panels, joined with ` | `. When no panels are visible (boot or panel removal), it falls back to the site title passed into `scroll.init(config)`. During boot (before `index.loadIndex` resolves), `document.title` is `Loading…`, set by `app.js`.

---

## 11. Global Header

**HTML:** see "App Shell" (§ index.html). The header lives in `<header id="site-header">` with a `<a class="site-title">` and `<nav class="bookmarks">`.

**CSS — `styles/header.css`:**

```css
@layer header {
  #site-header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding-inline: var(--space-lg);
    background: var(--color-header-bg);
    backdrop-filter: blur(var(--header-blur));
    color: var(--color-text);
    font-family: var(--font-body);
  }

  .site-title {
    font-size: var(--text-lg);
    font-weight: 600;
    text-decoration: none;
    color: inherit;
  }

  .bookmarks {
    display: flex;
    gap: var(--space-md);
  }

  .bookmark-link {
    color: var(--color-link);
    text-decoration: none;
  }
}
```

**JS.** `panels.renderHeader(config)` (defined in §7) writes the site title's text, `href`, and `data-note`, then stamps a `<a class="bookmark-link" data-note="...">` per bookmark into `.bookmarks`. The delegated click handler in `panels.js` covers bookmark and site-title clicks — no per-link wiring.

---

## 12. Footer (Backlinks)

**HTML.** The `<footer class="panel-backlinks">` is part of the panel `<template>` (see "App Shell"). `panels.renderBacklinks(panel, note)` populates and reveals it; the footer stays `hidden` when the note has no backlinks. Not-found panels never render the footer.

**CSS — `styles/panel.css` (backlinks block):**

```css
@layer panel {
  .panel-backlinks {
    border-top: 1px solid var(--color-border);
    padding: var(--space-md);
    margin-top: var(--space-xl);
    font-size: var(--text-sm);
  }

  .backlinks-label {
    color: var(--color-muted);
    margin-bottom: var(--space-sm);
  }
}
```

**JS.** `renderBacklinks(panel, note)` (defined in §7) writes a `Linked from` label followed by one `<a class="internal-link" data-note="...">` per backlink, then sets `footer.hidden = false`. Backlinks share every click, hover, and visual-state behaviour with in-content links — they go through the same delegated handler and the same `popover.wire`.

---

## 13. Not-Found Handling

**HTML:** None. The not-found note is a content fallback, not a structural special case.

**JS.** `NOT_FOUND_ID`, `NOT_FOUND_TITLE`, `isNotFound`, `notFoundContent`, and `resolveOrFallback` are defined in `scripts/renderer.js` (see §4 "Render pipeline"). The not-found note has no markdown file in `content/` and no entry in `notes.json`.

**Trigger paths.** All three paths route to the not-found note via `renderer.isNotFound(id)`:

1. `router.getStack()` returns `'__not_found__'` as the primary when the path contains segments that don't match any known identifier prefix.
2. `wikilinks.resolveTarget()` returns `'__not_found__'` when a `[[…]]` token resolves to neither an identifier nor a unique title.
3. `panels.loadContent()` falls back to `notFoundContent()` if a content fetch returns a non-OK response (e.g., the markdown file was deleted between index build and serve).

In every path, the not-found id flows through the same render pipeline as authored notes. `panels.hydrate` short-circuits the network fetch for `NOT_FOUND_ID` and skips backlink rendering. No special panel markup.

---

## 14. Deployment

**HTML — `404.html` (GitHub Pages SPA handshake, rafgraph convention):**

GitHub Pages serves `404.html` for any URL that does not map to an existing file. This handshake rewrites the original URL into a query-string form, then redirects to `index.html`. `router.js` decodes the query string on entry (`decodeSpaRedirect()` in §6).

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting…</title>
    <script>
      // Single Page Apps for GitHub Pages — MIT
      // https://github.com/rafgraph/spa-github-pages
      // Keep one path segment (the repo name); rewrite the rest into
      // a query-string form that `router.decodeSpaRedirect` reverses.
      var pathSegmentsToKeep = 1;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') +
        '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/')
          .replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
```

The handshake's `pathSegmentsToKeep = 1` matches the basename rule in §6: on `*.github.io`, the first path segment is the repository name. For root-domain deployments (a custom domain on Pages, S3, Netlify), the handshake remains correct because the repo segment is absent and the script simply joins the empty prefix.

**Indexer-first build order.**

Before serving locally:

```sh
node build/index.js --content ./content --out ./notes.json
```

Before deploying via GitHub Actions: the workflow runs the same command (see "GitHub Pages workflow" below). The app fetches `notes.json` at startup; if the file is missing, the fetch fails and `app.js` shows the not-found fallback.

**Local serving — `build/serve.js`.**

`python3 -m http.server` returns its own 404 page for unknown paths, which breaks the SPA on reload — e.g., reloading the browser at `/Home?stack=…` 404s instead of running the app. On GitHub Pages this is solved by `404.html` and the rafgraph handshake; locally we use a simpler equivalent: serve `index.html` for any path that doesn't map to a real file (the standard "SPA fallback" pattern). The router then reads the original URL from `location.pathname` and renders the right stack without needing the handshake.

`build/serve.js` implements that fallback using only the Node.js standard library (`http`, `fs`, `path`). It has no shared code with the app and adds no dependencies. Run it from the repository root:

```sh
node build/serve.js [port]        # default 8000
```

The script is local-dev tooling only — it is not part of the deployment artifact and is not invoked from the GitHub Actions workflow.

**GitHub Pages workflow — `.github/workflows/deploy.yml`:**

The workflow must not install third-party packages. Node.js comes from `actions/setup-node`; the indexer uses only the Node standard library. The repository contains no `package.json`.

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build note index
        run: node build/index.js --content ./content --out ./notes.json

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

The four `actions/*` actions are CI infrastructure and are explicitly permitted by `.claude/rules/dependency-free.md` "Exemptions". No `npm install`, `bun install`, `yarn install`, or equivalent is performed.

**Basename.** See §6. `router.computeBase(config)` detects `*.github.io` at runtime and uses the first path segment; on other hosts, it reads `config.basename ?? ''`. No `<base>` tag and no build-time rewrite.

---

## 15. Extension Points

Each extension maps to a single file swap or addition with no changes elsewhere.

| Extension | How |
|---|---|
| New markup-language subset | Replace `scripts/markdown.js` (keep `renderMarkdown` signature) |
| Additional index metadata | Add fields in `build/index.js`, expose in `scripts/index.js` |
| Richer navigation | Replace `<nav class="bookmarks">` stamping in `panels.renderHeader` |
| Persistent note cache | Replace `scripts/cache.js` with a `localStorage` or Cache API implementation |
| Multiple content roots | Extend `build/index.js` and `config.json`; `scripts/index.js` is unchanged |
| Touch popover | Add touch handlers in `scripts/popover.js`; CSS and HTML unchanged |
| New theme | Replace `design/tokens.css` only |
| New panel animation | Replace `design/animations/panel-open.css` only |
| Search | Add `scripts/search.js`; extend the header HTML; add a full-text field in the index |

---

## Animation Contract

Every animation file in `design/animations/` follows this contract:

1. It targets a single named transition (e.g. panel entrance, popover appearance).
2. It uses only `@keyframes` and `transition` declarations on existing selectors.
3. It reads timing and easing values from `design/tokens.css` custom properties only.
4. Removing the file must leave the app fully functional — instant state changes, no broken layout.
5. It declares its layer membership: `@layer animations { ... }`.

This makes every motion decision independently swappable without touching structure, logic, or other animations.
