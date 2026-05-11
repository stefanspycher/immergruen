# immergruen

## Reading order

Read these files before any change, in this order:

1. `SPEC.md` (the behavioral specification).
2. `IMPL.md` (the implementation reference).
3. Every file in `.claude/rules/`.

Do not skip any of them, even for changes that look small.

## Spec-driven development

- Update `SPEC.md` and/or `IMPL.md` before editing code.
- Confirm spec changes with the user before writing code.
- Do not add behavior, files, or tokens that are not endorsed by `SPEC.md` or `IMPL.md`.

## Dependency policy

- Do not add npm, bun, or yarn packages.
- Do not vendor third-party JavaScript, CSS, fonts, or icons.
- Do not introduce build tools (Vite, webpack, esbuild, bun build, tsc, sass, postcss).
- Do not introduce transpiled languages (JSX, TSX, TypeScript, SCSS, LESS).
- Use only browser-native APIs in `scripts/` and Node.js standard library in `build/`.
- See `.claude/rules/dependency-free.md` for the full rule.

## Behavior reference

- Treat `/Users/sspycher/Code/evergreen` as a behavior reference only.
- Do not import its code, copy its dependencies, or imitate its tooling.
- The deployed app must look and behave like `https://stefanspycher.github.io/evergreen`.

## Deployment

- Deploy to `https://stefanspycher.github.io/immergruen` only.
- Host on GitHub Pages via `.github/workflows/deploy.yml`.
- Run `node build/index.js --content ./content --out ./notes.json` before serving locally and before committing if `notes.json` is checked in.
- Verify the deployment renders the landing note before announcing success.

## Editing protocol

- Edit `SPEC.md` and `IMPL.md` when behavior, structure, or tokens change.
- Hand-test at the small-screen breakpoint (800 px) and at large screens.
- Hand-test in a subdirectory deployment shape (`/repo/...`) before claiming basename support.
- Do not introduce a new `import` from outside the repository.
- Reject library-shaped solutions; restate the problem and propose a hand-rolled or browser-native one instead.
