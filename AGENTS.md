<!-- office-crew-developer-conventions: v9 -->
<!-- office-crew-developer-md: full -->
# Workspace conventions for AI developers

You are a developer in a team working on a single ticket. Read `SPEC.md` for
the full sprint scope, then implement YOUR ticket.

## Hard rules

0. **Act, don't announce.** Never end a turn with only a sentence like
   "Let me read SPEC.md" or "I'll create the file" and then stop. If you say you
   will do something, your VERY NEXT step MUST be the actual tool call
   (Read/Write/Edit/Bash) — in the same turn. A turn that contains only prose
   and no tool call counts as zero work done and wastes a round.

1. **Do NOT overwrite existing files from scratch.** Always Read first, then
   add to / modify them. This is especially important for `app/main.py`,
   `requirements.txt`, `pyproject.toml`, `README.md` — other tickets may have
   added content there that you must preserve.

2. **Module naming is fixed.** Use the names that already exist in the repo.
   If you see `app/db.py`, do not create `app/database.py`. If unsure, grep
   for usages first.

3. **Never commit generated files.** The `.gitignore` already excludes
   `__pycache__/`, `*.pyc`, `*.db`, `.venv/`. Don't `git add -A` if you have
   such files in the working tree — use explicit paths.

4. **Tests are part of done.** Every ticket includes writing tests AND making
   them pass. `python -m pytest` must exit 0 before you stop.

5. **Stay within your ticket.** No drive-by refactors of unrelated code, even
   if it looks improvable. Note observations in the commit message instead.

6. **Do NOT create branches or push.** The orchestrator handles all git
   operations after you. Just commit-worthy state in the working tree is
   enough — actually, don't even commit; the orchestrator does that too.

6b. **Never run a command that does not return on its own.** A dev server,
   a watcher or a REPL keeps running until it is killed, so the shell call
   never comes back — you sit there producing no output and the run is
   eventually cut off, mid-ticket, with the last step unfinished. This is the
   single most common way a ticket is lost.

   To check that a server really starts, bound it and read the result — never
   just launch it. EVERY step of the probe needs its own hard time limit;
   "it returns eventually" is not a bound, and a probe that hangs costs the
   ticket exactly as much as the server would have:

   ```bash
   # Backend: start it, KEEP ITS PID, probe with a hard limit, always stop it.
   uvicorn app.main:app --port 8099 & server=$!
   sleep 3
   curl -fsS --max-time 5 http://127.0.0.1:8099/health && echo "health OK"
   kill "$server" 2>/dev/null || true
   ```

   Three details that are the difference between a probe and a lost ticket:
   `--max-time` on every `curl` (without it a server that accepts the
   connection but never answers hangs you forever), `$!` to stop exactly the
   process you started (`pkill -f <pattern>` may not exist on the host and can
   match the wrong process), and NO `( … &)` subshell — that detaches the
   server so you can no longer stop it.

   Prefer a check that needs no server at all — for FastAPI, `TestClient`
   answers "does the health endpoint work?" inside the normal test run:

   ```python
   from fastapi.testclient import TestClient
   def test_health():
       assert TestClient(app).get("/health").status_code == 200
   ```

   Same rule for the frontend: `npm run build` tells you it compiles;
   `npm run dev` never finishes. And if a port is already taken, do NOT wait
   or retry in a loop — pick another port or drop the probe and rely on the
   test.

7. **Ask questions when stuck — DON'T guess.** If the ticket or SPEC is
   ambiguous on a decision that affects the result (e.g. "should pagination
   default to 20 or 50?", "sync or async client?", "what behavior on duplicate
   input?"), do this instead of inventing an answer:

   - Write a file `QUESTION.md` in the repo root with:
     ```
     # Question to Tech Lead

     **Context**: <which file / which spec point is unclear>

     **Question**: <your specific question, with options if any>

     **Why it matters**: <how the choice changes the implementation>
     ```
   - Then STOP working. Do NOT write code that depends on the unknown choice.
     Do NOT commit anything. Exit cleanly.
   - The Tech Lead (or the architect) will answer in `ANSWER.md`, then you'll
     be re-spawned to continue. You'll find `ANSWER.md` in the repo root.
   - When you read `ANSWER.md`: act on the answer immediately, then DELETE
     `QUESTION.md` and `ANSWER.md` (no clutter in the MR).

   Limit: max 3 questions per ticket. Use this for real decisions, not for
   trivial style choices — for those, make a reasonable choice and document it
   in a code comment as before.

<!-- office-crew-developer-subagents: verifier -->
## Subagents: pre-push self-review (MANDATORY)

Before you consider your work done: delegate ONE task-tool call to the
`pre-push-reviewer` subagent — hand it a one-line ticket summary and ask it to
check the current worktree state against the ticket and to run the lint/test
commands from this file. Address its FINDINGS (fix real ones; briefly justify a
false positive in your final message), then finish. Skip the delegation ONLY
for a trivially small change (a one-line fix).

## CI/CD is active (GitHub Actions with Quality Pack)

The repo has a `.github/workflows/ci.yml`. On every `git push` the following runs automatically:
- **test** (pytest with coverage gate >=80%) — BLOCKING
- **lint** (`ruff format --check` + `ruff check`) — BLOCKING
- **types** (mypy with `--ignore-missing-imports`) — warning, not blocking
- **security** (pip-audit + bandit) — warning, not blocking

Important consequences for you:
1. **`pytest` must be green locally AND have coverage >=80%.** Otherwise the CI dies.
   If your ticket introduces new functions — write tests for them, otherwise coverage
   drops and all MRs get blocked.
2. **Run `ruff format .` locally** before you finish. CI checks that
   everything is formatted.
3. **`ruff check .` must be green** — fix all violations. See `ruff.toml` in the
   repo root for the configuration.
4. **Type hints are expected** (even though the types stage is not blocking):
   every public function needs argument types + a return type.
5. **No hardcoded secrets/keys/URLs** — bandit catches that. Use env vars.
6. **`requirements.txt` must be up to date.** New libs → add them.

## Documentation requirement

The repo MUST ship with a REAL `README.md` at the root — never just the repo
name or the GitHub auto-init stub. It MUST contain:
- a one-paragraph project description;
- the tech stack;
- install steps;
- how to RUN in dev AND (if there is a build) how to BUILD for production;
- HOW TO USE IT — describe whatever actually fits THIS product: controls/key
  bindings for a game, the main screens and actions for an app, the public
  API (endpoints/functions) for a service or library, the commands and flags
  for a CLI. Not every project has "controls" — document what this one has;
- the feature list.
Keep it in sync with your ticket — new endpoints / functions / config / controls
get reflected here. For REST APIs also give, per endpoint: method, body schema,
response example. For a CLI, show example invocations; for a library, a minimal
usage snippet. If the project has a `docs/` structure, deep docs go there but
the README stays the entry point.

The reviewer REJECTS an MR whose product ships without this README.

## Design tokens (UI projects only — when DESIGN.md is in the repo)

If the file `DESIGN.md` exists in the repo root, **IT IS BINDING** for all
visual decisions:

1. **Do not improvise your own hex colors.** When you need a color, use exactly
   one from the `## Colors` section of DESIGN.md. Ideally as a CSS
   custom property: `:root { --color-bg: #...; }` (from the tokens), then in the
   code just use `var(--color-bg)`.
2. **Spacing comes from the scale.** No random `padding: 13px` — if the
   scale has 4/8/12/16/24, take a value from it. Also think in custom properties:
   `--space-0`, `--space-1`, etc.
3. **Border radii from DESIGN.md** — do not guess them yourself.
4. **Follow the component specs.** If DESIGN.md says "Button: padding 12/24,
   radius md, min-height 44px" — implement it exactly that way, not "approximately".
5. **If DESIGN.md does not specify a component** that your ticket needs:
   improvise GENTLY in the same style (same tokens, same logic
   as the other components). Note it in the commit message: "new component X
   improvised without a spec — the designer can align it later".
6. **Never touch DESIGN.md** — it is maintained by the designer (Luna).

The reviewer checks token consistency on UI MRs.

## UI/UX Pro Max Skill (use on UI/frontend tickets)

On this system the Claude Code skill **`ui-ux-pro-max`** is installed globally
(67 styles, 96 palettes, font pairings, UX guidelines, stack best practices).
If your ticket builds visible UI (pages, components, styling, landing,
dashboard), use it BEFORE and DURING the implementation:

1. **Pull the design system** (pattern, style, colors, typography, effects,
   anti-patterns for the project type):
   ```
   py "C:/Users/Anwender/.claude/skills/ui-ux-pro-max/scripts/search.py" "<product type industry keywords>" --design-system -f markdown
   ```
2. **Get the stack guidelines** (default stack `html-tailwind`):
   ```
   py "C:/Users/Anwender/.claude/skills/ui-ux-pro-max/scripts/search.py" "<topic>" --stack html-tailwind
   ```
3. **Invocation rule (IMPORTANT):** always use `py` + the ABSOLUTE path exactly as above.
   `python` / `python3` are broken Store stubs on this system and will
   fail.
4. **Priority on UI projects:** if a `DESIGN.md` is in the repo, its tokens
   ALWAYS win (colors/spacing/radii — maintained by Luna). The skill
   only fills in where DESIGN.md is silent: UX patterns, accessibility,
   hover/transitions, stack idioms and the pre-delivery checks.

## Project layout (fullstack)

This is a fullstack project. **All Python backend code, tests AND
`requirements.txt` live in `backend/`** (`backend/app.py`, `backend/tests/`,
`backend/requirements.txt`). **All frontend files live in `frontend/`.** Put
nothing Python at the repo root — the CI runs the backend test suite from inside
`backend/` and the frontend checks from inside `frontend/`.

## Quick context

- Stack: depends on project — read existing files first to find out
- For Python/FastAPI projects: DB usually in `app/db.py`, tests via pytest
- For frontend projects: see "Browser frontends" section below

## Browser frontends (HTML/CSS/JS for direct browser use)

If your ticket produces files that are meant to be opened in a browser:

1. **The README MUST contain a "How to run" section**, because `file://` URLs
   break ES-Modules, fetch(), and most modern web APIs (CORS blocks them).
2. Minimum acceptable instructions:
   - Static files only: `py -m http.server 8000`, then open `http://localhost:8000`
   - Or: use VS Code Live Server extension
   - If a build tool is involved (Vite, Webpack, etc.): the exact build + serve commands
3. If you write a small launcher script (e.g. `start.bat` on Windows, `start.sh` on Unix), even better.
4. Do NOT assume the user knows to start an HTTP server. State it explicitly.

This applies regardless of whether tests are required for the ticket.

## Separate Frontend + Backend (cross-origin) — CORS is mandatory

If your ticket creates a Frontend that talks to a separate Backend (Vite + FastAPI,
React + Flask, etc.), CORS MUST be configured from the start:

- **FastAPI:** add `CORSMiddleware` for the dev-server origins:
  ```python
  from fastapi.middleware.cors import CORSMiddleware

  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "http://localhost:5173",   # Vite default
          "http://localhost:5174",   # Vite fallback
          "http://localhost:3000",   # CRA / Next.js
      ],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Flask:** `from flask_cors import CORS; CORS(app, origins=[...])`
- The default behavior without CORS is: the browser blocks — the user sees
  `Access-Control-Allow-Origin` missing errors, the app is unusable.

If you don't know the exact frontend port: include common dev-server ports as above.
If a user-given config indicates production, use the proper production origin instead.
