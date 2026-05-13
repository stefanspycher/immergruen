# Evergreen Notes App — Technology-Independent Specification

## Purpose

Evergreen is a single-user, client-side digital garden for reading and navigating a collection of interconnected notes. It has no server, no database, and no authentication. All content is stored as plain markdown files and served statically. The app's defining interaction is the stacked-panel reader: clicking a link in a note opens the linked note beside it rather than replacing it, letting the reader traverse a graph of ideas without losing context.

This specification describes behavior, not implementation. Any technology stack that satisfies the behaviors described here produces a conforming implementation.

---

## 1. Application Configuration

The app reads a single static configuration file at startup. This file contains:

- **Site title:** A string displayed in the global header and as the browser tab title placeholder.
- **Index path:** A relative path from the app's root to the note index file.
- **Bookmarks:** An ordered list of note identifiers. The first entry is the default landing note. All entries appear as navigation links in the header.
- **Basename (optional):** A path prefix used when the app is hosted in a subdirectory under a non-`*.github.io` domain. Defaults to the empty string (root deployment). On `*.github.io` hosts this field is ignored — see §6 "Basename Detection".

The configuration file must be available before the app initializes. No configuration values may be changed at runtime.

If no bookmarks are provided or the list is empty, the app falls back to a system-defined fallback note (typically a 404/not-found placeholder).

---

## 2. Note Data Model

The app treats a note as a unit with the following properties (described behaviorally):

- **Identifier:** A unique string key for the note, derived from its file path relative to the content directory, without the file extension. Path separators in subdirectory notes become part of the identifier. Example: a file at `notes/systems/foundations.md` has identifier `systems/foundations`.
- **Title:** A human-readable display name for the note. Displayed in the header, panel labels, backlink lists, and the browser tab title.
- **Content:** The raw text of the note in markdown format. Fetched on demand; not stored in the index.
- **Backlinks:** The set of identifiers of other notes that contain a link pointing to this note. Computed at build time and stored in the index.

The app never writes notes. It only reads them.

---

## 3. Note Index

The index is a static file with two parts:

- A map from every note's identifier to its metadata: title, file path (used to fetch content), and backlinks list.
- A title-to-identifier resolution table used to resolve title-based wiki-links at runtime. Only titles that uniquely identify a single note are included; ambiguous titles are omitted, so authors must use the explicit identifier to disambiguate.

The app loads the index once at startup, before rendering any note. All subsequent note lookups resolve through the index. The index is treated as immutable during a session — the app does not poll for changes.

Once a note's content has been fetched, it is cached in memory for the duration of the session. A second request for the same note is served from the cache without a network fetch.

---

## 4. Content Authoring

### Markdown

Note content is written in markdown. The renderer must support the following constructs and no others; constructs outside this subset are rendered as literal text.

**Block constructs:**

- ATX headings: `# H1` through `###### H6`. The `#` characters must be followed by a space.
- Paragraphs (the default block when no other construct matches).
- Unordered lists with `-`, `*`, or `+` markers, including nested lists at two-space-indent boundaries.
- Ordered lists with `<digits>.` markers (e.g., `1.`, `2.`).
- Task list items: an unordered list item whose content begins with `[ ]` or `[x]` renders with a disabled checkbox.
- Fenced code blocks delimited by ` ``` `, with an optional language identifier on the opening line.
- Indented code blocks (four-space indent), provided they are not the continuation of a list item.
- Blockquotes prefixed with `> `, including multi-line continuations.
- Horizontal rules: `---`, `***`, or `___` on their own line.
- Tables: pipe-delimited (`| col | col |`) with a separator row of dashes (`| --- | --- |`).

**Inline constructs:**

- Bold: `**text**` or `__text__` → `<strong>`.
- Italic: `*text*` or `_text_` → `<em>`.
- Strikethrough: `~~text~~` → `<del>`.
- Inline code: `` `code` ``.
- Markdown links: `[text](url)`, with optional `"title"` attribute.
- Images: `![alt](url)`.
- Auto-links: `<http://...>` or `<email@example.com>` between angle brackets.
- Wiki-links: see "Wiki-Links" below.
- Hard line breaks: a paragraph line ending in two trailing spaces, or `\\` at end of line.

This is the entire markdown surface area of the app. The renderer must not interpret any other syntax.

### YAML Frontmatter

Notes may begin with a YAML frontmatter block delimited by `---`. The app strips this block before rendering; its contents are not displayed. Authors may use frontmatter for tooling outside the app (e.g., templating systems), but the app itself ignores it.

### Wiki-Links

Internal links between notes are authored using double-bracket syntax: `[[Note Identifier]]`. Optionally, a display label may differ from the identifier: `[[identifier|label]]`.

At render time, every wiki-link is resolved against the note index in this order:

1. Exact identifier match (e.g., `[[systems/foundations]]`).
2. Case-insensitive title match, if exactly one note in the index has that title.
3. Otherwise, the link resolves to the not-found note.

Authors may therefore write either the full identifier or the bare title (e.g., `[[Foundations]]`). When two or more notes share a title, the title is ambiguous and authors must use the explicit identifier to disambiguate. The original text (or label, when provided) becomes the visible anchor text. The same resolution order is used by the build-time indexer when computing backlinks, so backlinks and runtime navigation never disagree.

Authors do not write raw markdown hyperlinks for internal navigation. All internal links must use wiki-link syntax so that the backlink system can track them.

---

## 5. Build Pipeline

Before the app can be served, a pre-build step must generate the note index from the source content directory.

### Index Generation

The indexer:

1. Walks the content directory recursively, visiting all markdown files.
2. For each file, derives the note's identifier (file path relative to content root, without extension).
3. Strips the YAML frontmatter block (if present) from the file content before reading the title or scanning for wiki-links, so frontmatter content cannot leak into either step.
4. Extracts the note's title. If the (frontmatter-stripped) content contains a top-level heading (`# Heading`), that heading text is the title. Otherwise, the filename (without extension) is used as the title.
5. Scans the (frontmatter-stripped) content for all wiki-links and records which notes are referenced. Wiki-link targets are resolved using the same order as the runtime renderer (identifier match, then unique title match), so backlink computation matches what readers see.
6. After scanning all files, computes backlinks: for each note, the list of other notes whose content references it.
7. Builds the title-to-identifier resolution table, omitting any title that maps to more than one note.
8. Writes the index as a structured data file (e.g., JSON) at the path specified in the app configuration. The index file contains both the per-note metadata map and the title-to-identifier table.

### When to Rebuild

The index must be regenerated whenever:

- A note file is added, removed, or renamed.
- A wiki-link is added to or removed from any note's content.

Serving the app without rebuilding the index after content changes results in stale backlinks, missing notes, or broken navigation.

---

## 6. Routing and Navigation

### URL Structure

The app uses two URL states:

- **Root path** (`/`): Redirects immediately to the default landing note (the first bookmark). No content is displayed at the root.
- **Note path** (`/<identifier>`): Displays the note identified by the path, plus zero or more stacked notes encoded as repeated `stack` query parameters.

Because identifiers may contain `/` (subdirectory notes), the router resolves the primary identifier by greedy-matching path segments against the note index: it joins the path segments and selects the longest prefix that is a known identifier. Anything beyond that prefix is treated as malformed and resolves to the not-found note.

Stacked notes are encoded as repeated `stack` query parameters, in the order they were opened (e.g., `/systems/foundations?stack=ideas/north-star&stack=systems/principles`). Each `stack` value is URL-encoded individually, so commas, spaces, and other reserved characters in identifiers carry no encoding risk.

The URL is the single source of truth for which notes are open and in what order. Reloading the page must restore the exact same panel configuration.

### Basename Detection

The app's base path (basename) is detected at runtime — not hardcoded, not rewritten at build time, and not derived from a `<base>` HTML element:

- On `*.github.io` hosts, the basename is the first segment of the URL path (e.g., `/immergruen` for `https://stefanspycher.github.io/immergruen/`). This rule is independent of the `basename` config field.
- On all other hosts, the basename is the value of the optional `basename` field in `config.json`, or the empty string if that field is absent.

The same build artifact must function correctly when served from the root of a domain and from a subdirectory of `*.github.io`.

All app-generated URLs — anchor `href` values, fetch requests for content and the index, history-API URLs, and the `404.html` SPA redirect target — are prefixed with the detected basename.

### Stacked Panel State

The URL encodes an ordered list of open notes: one primary note (the path) and zero or more stacked notes (the repeated `stack` query parameters). The primary note is always the leftmost panel. Stacked notes appear to its right, in the order they were opened.

Navigating to a note URL with no `stack` parameters shows a single panel. Adding `stack` parameters opens additional panels to the right.

---

## 7. Note Rendering

### Loading Sequence

1. On app startup, the index is loaded. No notes are rendered until the index is fully available.
2. Once the index is ready, the current URL is parsed to determine which notes to display.
3. Each note in the active panel list is fetched (or served from cache) and rendered in its panel.

### Content Pre-Processing

Before rendering, note content is pre-processed:

1. YAML frontmatter is stripped.
2. If the content does not already begin with a top-level heading, a heading is prepended using the note's title from the index.
3. All wiki-links are converted to navigable internal links (see Section 4).

### Markdown Rendering

The pre-processed content is rendered as GitHub Flavored Markdown HTML. All standard GFM elements must be supported: headings, paragraphs, bold, italic, code blocks, blockquotes, tables, task lists, and images.

### Internal Link Override

Links generated from wiki-links are intercepted at render time and replaced with interactive link components (see Section 8). Plain markdown hyperlinks with external URLs are rendered as standard external links and open in a new browser tab.

---

## 8. Link Behavior

Every link in rendered note content is classified as either internal or external.

**External links:** Any link whose target origin differs from the app's origin. External links open in a new browser tab and are styled distinctly (e.g., with a visual indicator).

**Internal links:** Links whose target resolves to a note within the app. Internal links have three behavioral layers:

### 8.1 Click Behavior

**On small screens** (viewport width below the breakpoint): clicking an internal link navigates directly to the linked note, replacing all current panels. The stacked state is discarded.

**On large screens** (viewport width at or above the breakpoint):

- If the linked note is already open in the current panel stack, clicking scrolls the viewport to bring that panel into view. The URL does not change.
- If the linked note is not yet open, it is added to the panel stack. The stack is trimmed: panels opened after the parent note (the note containing the clicked link) are discarded before the new note is appended. This enforces a clean branching model — clicking a link in panel N removes panels N+1 and beyond, then opens the new note as the new last panel.

### 8.2 Visual State

An internal link is styled differently when its target note is already open in the current panel stack (the "already open" state). This gives the reader a visual indication that the linked note is visible without scrolling.

### 8.3 Hover Popover

Hovering over an internal link triggers a content preview (see Section 9).

---

## 9. Hover Popover Preview

Hovering over an internal link displays a floating panel showing a preview of the linked note's content.

**Positioning:** The popover appears adjacent to the hovered link. It prefers to appear to the right of the link. If there is insufficient space to the right (less than the popover's width), it appears to the left instead. It is vertically aligned with the midpoint of the hovered link element.

**Content:** The popover renders the linked note's content using the same markdown rendering pipeline as the main note view, capped at a fixed maximum height. Content beyond the maximum is faded and clipped — the popover is not scrollable. To read the full content, the user opens the note in a panel.

**Appearance animation:** The popover enters with a brief animation: it scales up from a slightly reduced size and fades in simultaneously. A subtle blur dissolves away during the same motion. The exit is instant — the popover is removed from display without a reverse animation.

**Dismissal:** The popover is dismissed when the cursor leaves the link element.

**Non-blocking:** The popover must not intercept clicks, scroll, or other interactions on the underlying content. Because the popover never receives pointer events, the cursor cannot enter it; this is intentional and the reason scrollability is not provided.

---

## 10. Panel Layout and Responsiveness

### Fixed Panel Width

All panels have the same fixed width. This width is the basis for all horizontal positioning and scroll calculations. The value is a product decision, not a spec constraint, but it must be a single constant applied uniformly.

### Horizontal Scrolling

All open panels are laid out horizontally. When more panels are open than fit in the viewport, the panel area scrolls horizontally. Panels do not wrap to a new row.

### Panel Scroll and Overlap

Panels overlap slightly along their left edges (not their content areas, only their frames) when multiple panels are open. This layering creates visual depth and allows the reader to see that more panels exist behind the current view.

### Panel Collapse Behavior

As the user scrolls horizontally, panels that have moved far out of view collapse to a title-only label strip. This label strip:

- Remains visible at the edge of the panel's position, indicating the note is still open in the stack.
- Shows the note's title vertically.
- Hides the note's full content (to avoid rendering overhead and visual clutter).

The same collapse behavior applies to the rightmost panel if the viewport is positioned such that it is not yet fully scrolled into view.

### Auto-Scroll on Panel Open

When a new panel is added to the stack, the viewport automatically scrolls horizontally to bring the newly opened panel into view.

### Scroll Tracking

Panel visibility — which drives the page title and collapse state — is tracked using the platform's intersection-observation primitives, kept in sync with horizontal scroll events. Observers and `scroll` events are preferred over polling; polling is permitted only as a fallback when the primitives are unavailable.

### Page Title

The browser tab title reflects the open panels:

- One panel open: the title is that note's title.
- Multiple panels open: the titles of all visible panels are joined with the separator ` | ` (e.g., `Note A | Note B`).
- While loading (before the index resolves): the placeholder string `Loading…` is shown.

### Responsiveness

**Large screen** (viewport width at or above the breakpoint, currently 800 px): all panels in the stack are rendered side-by-side.

**Small screen** (viewport width below the breakpoint): only the most recently opened note is shown. The stacked panel system is suppressed; clicking a link navigates to the linked note instead of opening a new panel.

The breakpoint is evaluated both on initial load and whenever the viewport is resized.

---

## 11. Global Header

The header is fixed at the top of the viewport, above the panel area.

**Site title:** Displayed as a primary heading, sourced from the configuration file. The site title is also a navigation control: clicking it navigates to the default landing note (the first bookmark) as the sole primary note, clearing all stacked panels — the same behavior as clicking the first bookmark link.

**Bookmark links:** One link per entry in the configuration's bookmark list, in order. Clicking a bookmark link navigates to that note as the sole primary note, clearing all stacked panels.

The "clear all stacked panels" behavior applies to every navigation control that lives in the global header (site title and bookmark links) and is independent of whether the target note is already open in the current stack. Header clicks are not subject to the in-content "if already open, scroll to it" rule from §8.1; the header is a top-level navigation surface and always resets the stack.

The header is always visible, regardless of horizontal scroll position.

---

## 12. Footer (Backlinks)

Each note panel includes a footer section at the bottom of its content area.

The footer displays the list of backlinks: notes that contain a wiki-link pointing to the current note. Each backlink is rendered as an internal link, with the same click, visual-state, and hover-popover behaviors as in-content links.

If a note has no backlinks, the footer is not rendered.

---

## 13. Not-Found Handling

When the app navigates to a note identifier that does not exist in the index, a fallback not-found note is displayed in that panel position. The not-found note's content is an app-defined static template, not an authored markdown file — it is not part of the content directory and does not appear in the index. It flows through the same render pipeline as authored notes, so it behaves as a normal note panel in all other respects (markdown rendering, wiki-link resolution where applicable, panel layout, hover preview behaviour). The not-found note has no backlinks; its footer is not rendered.

The identifier `__not_found__` is reserved for this fallback. The indexer must skip any source file whose computed identifier equals `__not_found__` and must not include it in the index. Authors must not create a note file with that name.

---

## 14. Deployment

### Static Hosting Requirement

The app and all its assets (HTML, JS, CSS, note markdown files, index file) must be served from a static file host. No server-side rendering, no API endpoints, and no dynamic routing at the server layer are required or expected.

### SPA Routing Requirement

Because the app handles all routing client-side, the hosting environment must serve the app's root HTML document for any URL path under the app's base path. This is the standard single-page application (SPA) hosting requirement.

Hosts that cannot be configured to do this natively (e.g., GitHub Pages) can work around the limitation by:

1. Providing a custom error document (e.g., a 404 page) that encodes the originally requested path as a query parameter and redirects to the app root.
2. Having the app detect this redirect on load, decode the original path, and restore it as the active URL.

Both the custom error document and the app itself must implement their respective halves of this handshake consistently.

### Basename Support

The app must function correctly when hosted in a subdirectory (e.g., `https://example.github.io/my-repo/`). All internal URLs, link `href` values, and API fetches must be prefixed with the detected base path. The base path must be detected at runtime, not hardcoded, so that the same build artifact can be served from both a root domain and a subdirectory.

### Build Artifacts

The deployment artifact is a directory of static files produced by the build toolchain. It must contain at minimum:

- The compiled and bundled app (HTML, JS, CSS).
- The content directory (all `.md` files).
- The generated note index file.
- The configuration file.
- The SPA routing error document (if required by the hosting environment).

### Build Order

The note index must be generated before the app is built or deployed. Serving or deploying the app before the index is ready produces a deployment with a stale or missing index.

### GitHub Pages Deployment

The repository must include a GitHub Actions workflow at `.github/workflows/deploy.yml` that:

1. Triggers on push to the `main` branch and on manual dispatch.
2. Checks out the repository.
3. Runs the indexer (`node build/index.js --content ./content --out ./notes.json`) using only the Node.js runtime provided by `actions/setup-node`.
4. Uploads the entire deployable directory as a Pages artifact (`actions/upload-pages-artifact`).
5. Deploys the artifact to the `github-pages` environment (`actions/deploy-pages`).

The workflow must not run `npm install`, `bun install`, `yarn install`, or any equivalent. The repository contains no `package.json` in the application root for the purpose of dependency installation.

The deployed URL must match the format `https://<owner>.github.io/<repo>/`. For this repository, the deployed URL is `https://stefanspycher.github.io/immergruen/`.

---

## 15. Extension Points

The following areas are natural seams for extending the app without restructuring its core behavior:

- **Markup language:** The note format is currently plain markdown. The content pre-processing step (frontmatter stripping, title injection, wiki-link resolution) is a pipeline that could be extended or replaced to support a different source format.
- **Index metadata:** The note index currently carries title, path, and backlinks. Additional metadata fields (tags, creation date, word count, last-modified date) could be added without changing the core navigation model.
- **Navigation structure:** The bookmark list is a flat array. A richer navigation structure (nested sections, topic clusters, a search index) could replace or supplement it without changing how individual notes are fetched or rendered.
- **Note cache persistence:** The in-memory note cache is session-scoped and lost on page reload. A persistent cache layer (e.g., the browser's storage APIs or a service worker) could reduce network fetches for returning visitors.
- **Multiple content roots:** The current model assumes a single content directory. The index and data model could be extended to support multiple vaults or remote content sources, provided each note still resolves to a unique identifier and fetchable path.
- **Popover interaction model:** The popover is currently triggered by mouse hover and dismissed on mouse leave. Touch devices, keyboard navigation (e.g., showing a preview on focus), and pinned previews are natural extensions of this behavior.
- **Theming:** The visual design (colors, typography, panel width, breakpoint) is currently a single implementation decision. These values could be exposed as configuration options.
