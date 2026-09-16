# SB-397, the e2e servers must not sit on ports another project is using

**Exit:** with another Vite app holding 5173, the full e2e suite still runs
against SkipBureau and passes, and starting it while its own port is taken fails
with a clear message instead of testing a different app.

## What happened, not what might

On 2026-09-16 `responsive.spec.ts` "Persian reads right to left at every width"
failed with a 30s timeout waiting for an `<h1>`. It reads as a product defect.
It was not one. The page snapshot in
`apps/web/test-results/responsive-Persian-reads-right-to-left-at-every-width-dev/error-context.md`
showed a login screen belonging to **KarNama**, a different project:

```yaml
- generic [ref=e7]: کارنما
- generic [ref=e9]: ورود به کارنما
```

`D:\Kar\Gandom\KarNama\node_modules\.bin\..\vite\bin\vite.js --host localhost`
had been listening on 5173 since **2026-09-14 11:15**, and
`playwright.config.ts`'s `reuseExistingServer: !process.env.CI` adopted it. Every
`dev` project test asserted against that app.

**The owner's ruling, 2026-09-16**, asked whether to stop that process:

> "Use another port what the hell?! Why it is port specific I am running
> multiple ports and stuff"

So this is never solved by killing their process. They run several projects at
once. A project that squats on a shared default port is the one at fault.

## The real cause, which is not the port

Playwright 1.62.1 and Vite 8.2.2 are what is installed, checked in
`node_modules` rather than assumed.

**Playwright decides to reuse a server from an HTTP readiness probe alone.** It
does not identify the process or the application: it follows redirects and
accepts a final status from 200 through 403, with a root-404 fallback check for
`/index.html`. Any Vite app answering on that address qualifies. So the port is
how the collision happened, and **`reuseExistingServer` is why it was adopted**.

An earlier draft of this plan moved the port and stopped there. That does not
meet the exit condition: it lowers the probability and leaves the mechanism.

**And `strictPort` cannot protect the e2e path at all.** Playwright probes the
address *before* it runs the command, so when something already answers, Vite
never starts and `strictPort` never fires. Believing otherwise is the mistake
this card is most likely to make.

## The second bug beside it

`apps/web/vite.config.ts` has **no `server` block**, so Vite uses its default,
5173, and when that is taken it **auto-increments**. A plain `npm run dev` while
KarNama holds 5173 quietly starts on 5174, and `apps/api/src/main.ts` line 15
allows only `http://localhost:5173`, so the API then refuses the app's requests.
That is a human-path failure the same default causes, and `strictPort` is
exactly what fixes it.

## The approach

**1. Stop reusing servers this repository owns.** All three `webServer` entries,
`playwright.config.ts` lines 48, 56 and 64, become `reuseExistingServer: false`.
Then anything answering on our port makes Playwright stop during web server
setup, before a single test runs, with its own "already used" error.

**2. Give the dev server this project's own port**, in `vite.config.ts`, so
there is one source of truth every way of starting it obeys:

```ts
server: { port: 5191, strictPort: true },
```

5191 because 5190 is already this project's pages server, so the two read as one
family and neither is a default another tool reaches for. `strictPort` for the
human path above.

**3. Follow that port** through `playwright.config.ts` (the `dev` project's
`baseURL`, the web server `url`, `E2E_WEB_PORT`), `e2e/api-server.mjs`'s CORS
fallback, `apps/api/src/main.ts`'s allowed origin, and `.claude/launch.json`.

`4500` and `5190` keep their numbers: neither is a default and both are already
overridable, and with reuse off they are now protected the same way.

## What this costs, said plainly

Every local e2e run now starts its own servers, so the pages entry rebuilds and
prerenders each time, roughly a minute. CI already ran this way, because
`!process.env.CI` was false there; this only makes a local run honest in the
same manner. A suite that quietly tests a different application is worth less
than a minute.

`vite preview` stays on 4173 and is untouched: it is not in this e2e path, which
serves its own build through `e2e/pages-server.mjs` on 5190. In Vite 8
`preview.strictPort` inherits `server.strictPort`, so it will fail rather than
increment, which is fine and incidental.

## Files

- `apps/web/playwright.config.ts`, three reuse flags and three port references.
- `apps/web/vite.config.ts`, the port and `strictPort`.
- `apps/web/e2e/api-server.mjs`, the CORS fallback.
- `apps/api/src/main.ts`, the allowed origin.
- `.claude/launch.json`, the browser pane's dev server.
- This plan.

## How it is proved, three runs

1. **KarNama is still on 5173**, so the condition that produced the bug is
   present and this is the real test rather than a mimic. **Run: the dev project
   now serves SkipBureau.** Its page snapshot is this app's own home page, "What
   do you need to do in Turkey?", with the country resolved, and the `pages`
   project is entirely green. At that first run the suite did **not** pass: seven
   dev tests failed for reasons that have nothing to do with ports, which is
   SB-400, and fixing the port is what made them visible. That is why this card
   waited on SB-400 rather than closing on a partial result.

   **Completed 2026-09-17, with that same server still sitting there.** `netstat`
   shows `[::1]:5173 LISTENING` under pid 47352 during the run, with an
   established connection to it, so the condition that caused the original bug
   was present throughout. The full suite is green: **49 passed across both
   projects, 18 of them the dev project's**, every one of them against
   SkipBureau. The exit's first half is therefore met under the original
   condition rather than in its absence, which is the only way it means anything.
   Had the foreign server been gone, this run would have proved nothing except
   that the suite passes when there is nothing to collide with.
2. **A squatter planted on 5191**, a bare server answering 200. **Run: proved.**
   `Error: http://localhost:5191 is already used, make sure that nothing is
   running on the port/url or set reuseExistingServer:true`, and **no test ran**.
3. **`npm run dev` with 5191 occupied.** **Run: proved.**
   `error when starting dev server: Error: Port 5191 is already in use`, exit 1.
   Without `strictPort` Vite would have taken 5192 and then fallen outside the
   API's allow-list with nothing saying why.

### The planted case took three attempts, and the first two proved nothing

Worth writing down, because it will cost someone else the same hour. A squatter
must hold **the address Vite actually wants**, which on Windows is `::1`:

- bound to `0.0.0.0`: Vite starts anyway and says so, "Port 5191 is in use on a
  wildcard address, but localhost:5191 is available";
- bound to `127.0.0.1`: Vite starts anyway and says **nothing**, because
  `localhost` resolves to `::1` first and IPv4 is not what it took;
- bound to `::1`: Vite refuses.

`netstat` confirms the shape: KarNama's own server listens on `[::1]:5173`. Both
early attempts ended with the `timeout` command killing a perfectly healthy Vite,
which looks like a failure in the exit code and is not one. Read what the tool
says, not whether it exited.

Playwright's proof is unaffected by any of this: its check is an HTTP GET to
`http://localhost:5191`, which a wildcard listener answers, and that is exactly
the mechanism the fix is about.

## What the plan check changed

Run 2026-09-16, accepted in full: the reuse flags are the fix and the port move
alone is not; `strictPort` covers only a Vite process that actually starts;
Playwright's reuse is a liveness probe with no identity; and the verification
above, including the planted squatter, comes from it. It also rejected a private
identity URL, because Vite's SPA fallback answers 200 for any path while
Playwright inspects only the status, and judged a `globalSetup` identity check
unjustified when turning reuse off is simpler.
