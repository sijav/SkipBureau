# SB-132, serve Storybook on GitHub Pages beside the app

**Exit condition:** `https://sijav.github.io/SkipBureau/storybook/` loads
Storybook and a story renders, while the app at `/SkipBureau/` still loads.

The owner, 2026-09-10: *"also serve storybook on github pages as well"*.

## Why it is worth the two points

Every component here is built story-first. The measured contrast palette, the
four combinations of language and colour scheme, the states a component has:
all of that is visible in Storybook and **nowhere else**. Right now it exists on
my machine only, so the owner cannot look at a component without running a dev
server. This is the only way anyone but me sees the component work.

## The approach

Pages serves one site per repository, so Storybook goes at a **subpath**.

- **`viteFinal` in `.storybook/main.ts`** sets `base` to
  `/SkipBureau/storybook/` from an environment variable, defaulting to `/` so a
  local `storybook dev` is untouched. Storybook 10's react-vite builder takes
  Vite config through `viteFinal`; there is no `--base` flag.
- **The `pages` job assembles one artifact**: `apps/web/dist` at the root and
  `storybook-static` under `storybook/`.

## The bug I found before writing anything

`package.json` has `prestorybook` running `i18n:compile`, and **no
`prebuild-storybook`**. That is exactly the defect CI caught in SB-031, where
`pretest` existed and `test:unit`, `test:storybook` and `test:coverage` had
none, so they only worked where an earlier run had left the compiled catalogs
lying around. A published Storybook built in CI would have **no catalogs at
all**, and every story would fall back to English while `I18nProvider` reported
the Persian catalog missing.

So `prebuild-storybook` gets added in the same change, and the story that
asserts a Persian catalog loads is what would have caught it.

## Files

| file | change |
|---|---|
| `apps/web/.storybook/main.ts` | `viteFinal` setting `base` |
| `apps/web/package.json` | `prebuild-storybook` |
| `.github/workflows/ci.yml` | build Storybook, assemble one artifact |

## How it meets the exit condition

`curl` the published Storybook URL for a 200, then open it in a browser and
watch a story render, because a 200 on an HTML shell is exactly the kind of
half-proof this project keeps catching. The app at `/SkipBureau/` is checked in
the same pass, since a wrong `base` or a clobbered artifact would break it.

## The step I am least sure of

**Whether a built Storybook carries `public/mockServiceWorker.js`.** Every
story's `beforeEach` starts MSW, which fetches that file, and if it is absent
every story dies with "Failed to register a ServiceWorker" rather than
rendering. `.storybook/main.ts` sets **no `staticDirs`**. In dev the Vite
builder serves `public/` anyway, which I established earlier today. Whether
`storybook build` COPIES it into `storybook-static` is a different question and
I do not know the answer.

If it does not, the published Storybook is a page of error boxes: a perfect
200, and useless. That failure is also invisible to `curl`, which is why the
exit condition insists on a browser.
