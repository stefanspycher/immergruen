# Dependency-Free Constraint

## Rule

**Do not add or import third-party JavaScript, CSS, fonts, icons, or build tools to this repository.**

This rule binds every code change. Spec endorsement does not waive it: a section of `SPEC.md` or `IMPL.md` that names a library is itself out of compliance and must be revised.

---

## Permitted code sources

1. Browser-native APIs (`document`, `fetch`, `URL`, `URLSearchParams`, `IntersectionObserver`, `history`, `getComputedStyle`, …).
2. Node.js standard library (`fs`, `path`, `url`) for files under `build/`.
3. Code authored within this repository.

---

## Prohibited

- npm, bun, or yarn packages, including dev-dependencies.
- CDN imports (`import x from 'https://...'`, `<script src="https://...">`, `@import url("https://...")`).
- Vendored third-party files (e.g., `vendor/marked.js`, `vendor/react.js`, downloaded font files).
- Build tools that transform code (Vite, webpack, esbuild, Rollup, Parcel, bun build, tsc, sass, postcss, autoprefixer).
- Transpiled languages: JSX, TSX, TypeScript, SCSS, LESS, Stylus, CoffeeScript.
- Polyfills downloaded from third parties.
- Web fonts loaded from third-party hosts (Google Fonts, Adobe Fonts, …). Use the system font stack defined in `design/tokens.css`.

---

## Permitted ad-hoc tooling

- Plain `node` invocations (`node build/index.js`).
- Plain `python3 -m http.server` for local serving.
- Static hosts that serve files unmodified (GitHub Pages, S3, Vercel static, Netlify static).
- GitHub Actions actions that orchestrate CI: `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, `actions/deploy-pages`. These are CI infrastructure, not application dependencies.

---

## Markdown rendering

- Markdown is rendered by the hand-rolled parser at `scripts/markdown.js`.
- The parser implements only the subset documented in `SPEC.md` §4.
- Do not vendor `marked`, `markdown-it`, `remark`, `commonmark`, or any other parser, even partially.

---

## When tempted to add a dependency

1. Restate the problem the dependency would solve.
2. Identify the minimum hand-rolled or browser-native solution.
3. If the user must approve, surface the trade-off and wait for an explicit instruction; do not silently take the dependency.
4. If the spec mandates a feature that genuinely cannot be built without a library, surface that conflict — do not add the library.

---

## Exemptions

- Markdown content files (`content/*.md`) are not code and are exempt.
- The four GitHub Actions named above are exempt.
- No other exemptions exist. If you believe one is warranted, raise it before acting.

---

## Constraints

- This rule applies to all files except those listed under "Exemptions".
- The rule applies equally to `scripts/`, `styles/`, `design/`, `build/`, `index.html`, `404.html`, `config.json`, and CI workflow files.
- A change that introduces a `package.json` (other than for documentation) violates this rule.
