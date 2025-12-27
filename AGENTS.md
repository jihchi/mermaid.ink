# Agent Guide for mermaid.ink

## Commands

```bash
pnpm install          # Install dependencies (pnpm >= 10 required)
pnpm test             # Run all tests (Vitest)
pnpm test:watch       # Watch mode
pnpm format           # Prettier + sort-package-json
DEBUG=app:* pnpm start # Dev server
env PGIDLE_TIMEOUT=1 pnpm migrate  # DB migrations
```

## Overview

Node.js service rendering Mermaid diagrams to images/SVG/PDF via Puppeteer headless Chrome. Optional PostgreSQL caching.

**Stack:** Node 22 (ESM), Koa, Puppeteer, Vitest, PostgreSQL (optional), Docker

## Structure

```
src/
├── index.js       # Entry point
├── app.js         # Koa setup, routes, browser/queue init
├── views/         # Route handlers (home, img, svg, pdf)
├── helpers/       # Utils, cache, DB, rendering logic
└── static/        # HTML templates + mermaid.mjs
test/
├── global-setup.js    # Disables DEBUG/DB
├── kitchensink.test.js # Integration tests
└── *.test.js          # Unit tests
```

## Conventions

- **ESM only**, include `.js` in imports
- **Imports:** Use `#@/` alias for absolute paths
- **Naming:** camelCase vars/functions, PascalCase classes, UPPER_SNAKE_CASE constants
- **Style:** Prettier (single quotes, trailing commas ES5)
- **Errors:** `throw new Error('msg')`, validate params early
- **Logging:** `debug` package, `app:<module>` namespace, enable with `DEBUG=app:*`

## Patterns

**Route handlers** (`img.js`, `svg.js`, `pdf.js`): Export default wrapped in `renderImgOrSvg`, receive `(ctx, cacheKey, page, size)`, use Puppeteer API, update cache, set response.

**Higher-order functions:**

- `renderImgOrSvg(render)` - queue mgmt, page open, SVG render, timeout
- `readCacheFromDb(handler, assetType)` - cache check middleware

**Queue:** `p-queue`, concurrency 1 (env: `QUEUE_CONCURRENCY`), timeout 3s (env: `QUEUE_ADD_TIMEOUT`)

**Database** (optional, `ENABLE_DATABASE=true`): Pool max 1 for advisory locks, SHA256 cache keys, exports `connect/disconnect/readAsset/insertAsset/updateAsset/tryAcquireLock/releaseLock`

**Query params** (`utils.js`): `extractBgColor`, `extractDimension`, `extractTheme`, `extractPaper`, `extractImageType`, `validateQuery` (throws 400)

## Testing

Vitest. `global-setup.js` disables DEBUG/DB. `kitchensink.test.js` = integration tests. Snapshot tests in `test/__snapshots__/`. Update with `pnpm test -u`.

## Key Details

**Browser:** Puppeteer in `app.js`, relaunches on disconnect, viewport 1920x1080, CI adds `--no-sandbox`

**[Render flow](https://mermaid.ink/img/pako:eNpNUttum0AQ_ZXRvtamJvEF89CK-J7YbpSklVrww4odG2RgybIbxwX_e9cLVEZCYuacmTOcmZKEnCFxyT7hpzCiQsLbNMhAP57_wpVEiGjGEhQ76Ha_wUM5oWGEoN_weKmJD1ekWsaygon_glKJDMIriwEtCpS7W9omLooKpr4XvqtYIFD2ERdcnCHh4bFhTo3UrFzrFNCayL43ajPTZsuhC4PefQXzq6Sup3uJAuxid0v7jVps4XuMgeTwrlBhgy-MxtJ_VnmOEnVpTg8IXyBFkdKYWZFMk4a7NNyVf4ozxk-Wl-eWwIxpT2p8ZfDH0rv-Lchzjs2sj2aI11-LCp782acUNJSgw90tvNosvj5P5xWs_Td6RChCgZgVEW-NezLtN_7PnFG9D2NtA61rqA42JthqPxKkBd46ujXQj3Y7t2uZ13slHXIQMSOuFAo7pHFBH0Z5pQVERphiQFz9yXBPVSIDEmQXXZbT7A_naVspuDpExN3TpNCRMjNPY3oQNP2frd2bcJVJ4g5t04O4Jfkk7p1tW-PRYDS67w1sezQcdshZZ8eWY9_1x-O-7dhOv-9cOuSvEe1ZzmjQ6sxYLLloJ6FK8tdzFrYxGnRT37s5-8s_LGDtFw?type=png):** Route → cache check → advisory lock → queue → Puppeteer page + mermaid.html → `window.App.render()` → extract SVG/screenshot → update cache → release lock

**Cache key:** SHA256 of `assetType | encodedCode | queryKey` (bgColor, width, height, scale, theme, paper, landscape, fit, imageType)

**Supported:** Mermaid native (flowchart, sequence, class, state, ER, Gantt, pie), ELK/tidy-tree layouts, ZenUML

## Gotchas

- **DB pool max 1** for advisory locks — never change without understanding PostgreSQL locks
- **Queue concurrency 1** — CPU-intensive, increase carefully
- **Puppeteer args** in `app.js` are tuned for stability
- **503 = retry after 1s** (double-checked locking with advisory locks)
- **`--allow-file-access-from-files`** intentional but reduces security
- **4xx errors cached** when DB enabled
- **Scale param** (1-3) requires width/height, multiplies specified dims
- **Docker** needs `--cap-add=SYS_ADMIN` or custom seccomp
- **SVG `xmlns:xlink`** critical for clickable nodes
- **Puppeteer** is `onlyBuiltDependencies`, use `pnpm install`
- **JPEG quality=90**, PNG/WebP ignore quality param

## Deployment

**Docker:** `ghcr.io/puppeteer/puppeteer:24.34.0`, port 3000, user `pptruser`, multi-language fonts

**Migrations:** `env PGIDLE_TIMEOUT=1 pnpm migrate` in `db/migrations/`

**CI:** GitHub Actions Node 22.x, `browser-actions/setup-chrome`, tests required before Docker push to `ghcr.io/jihchi/mermaid.ink` (tags only)

## Adding Features

- **New output format:** Handler in `src/views/`, wrap with `renderImgOrSvg`, register in `app.js` with `readCacheFromDb`
- **New query param:** Extractor in `utils.js`, validate in `validateQuery()`, add to `createCacheKey.js`
- **DB schema change:** New migration in `db/migrations/`, increment dir number
- **Browser rendering:** Update `mermaid.html` or `mermaid.mjs`, test with snapshots
- **New diagram type:** Usually works if Mermaid.js supports it, test with `kitchensink.test.js`
- **Debug:** `DEBUG=app:*` for module-level logs (`app:views:svg`, `app:helpers:db`)
