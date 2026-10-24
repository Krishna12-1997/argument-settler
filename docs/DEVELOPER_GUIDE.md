# Developer Guide

This guide describes the current checkout. Commands shown below were run from the repository root in the available Windows/Node environment. The checked-out workspace already has its dependencies installed; `npm` and `npx` are unavailable here, so this guide does not claim a verified clean-install command.

## Five-minute quickstart

### Install

The current workspace has `node_modules` installed and uses `package-lock.json`. A fresh dependency install could not be verified in this environment because the npm executable is unavailable. The GitHub Actions workflow has an install step, but that does not substitute for running the install locally.

### Configure environment

The app reads these variables in `src/config/env.ts`:

| Variable | Default/allowed values | Use |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listening port. |
| `NODE_ENV` | `development`, `production`, or `test`; default `development` | Runtime mode. Production requires an API key. |
| `ANTHROPIC_API_KEY` | No production default | Anthropic credential used by the AI client. |

`.env.example` is a template; its `ANTHROPIC_API_KEY` value is a placeholder. In PowerShell, copy the template and replace the placeholder with your own key:

```powershell
Copy-Item .env.example .env
```

That copy command was verified in a temporary directory. `.env` is ignored by Git. Do not commit credentials. In production, missing or invalid configuration prevents startup. In development the code supplies a dummy key when configuration is invalid; that does not make live AI requests work without a real key.

### Build and run

Build the TypeScript server, then start the generated entry point:

```powershell
node node_modules/typescript/bin/tsc --pretty false
node dist/index.js
```

Both commands were run: compilation succeeded, the server started on port 3000, and `http://localhost:3000` returned HTTP 200 with the Argument Settler page. Stop the server with Ctrl+C.

### Run tests

```powershell
node node_modules/vitest/vitest.mjs run
```

Verified result in this checkout: 32 tests passed across 5 test files. The command uses the installed local dependency directly because npm is not available in this environment.

## Guided tour: if you want to change X, edit Y

| If you want to… | Start here | Also update/check |
| --- | --- | --- |
| Add or rename a judge persona | `src/schemas/court.schemas.ts` for the default `judge_name`; `public/index.html` for the value sent by the UI | `prompts/crossexam.v1.txt`, `prompts/judge.v1.txt`, and route system prompts in `src/routes/court.routes.ts`. Caller-provided names belong in user prompt data, not system instructions. |
| Add a judge language | `src/schemas/court.schemas.ts` (`CourtLanguageEnum`) | Add the choice and selected-language handling in `public/index.html`; make `prompts/judge.v1.txt` honor the language in both its rules and required-output example; update `tests/unit/schemas.test.ts`. |
| Create a new verdict prompt version | Add a versioned text file under `prompts/` | Change the filename in `buildVerdictPrompts()` in `src/routes/court.routes.ts`. The evaluation runner accepts a prompt filename, but its mock mode does not evaluate prompt content; see the evaluation notes below. |
| Add a guard category | `src/schemas/court.schemas.ts` (`GuardClassificationEnum` and `GuardOutputSchema`) | Add the category rules to `prompts/guardrail.v2.txt`, the response branch in `src/routes/court.routes.ts`, and the server enforcement behavior in `src/middleware/aiInputGuard.ts`. Add browser behavior in `public/index.html`, plus unit, integration, and evaluation cases. |
| Change a safety rule or safety response | `prompts/guardrail.v2.txt` | Check `src/services/guardService.ts`, `src/routes/court.routes.ts`, `src/middleware/aiInputGuard.ts`, and the corresponding guard tests. Keep the server-side gate in place; the browser's `/guard` calls are not an enforcement boundary. |
| Change cross-examination questions | `prompts/crossexam.v1.txt` | Keep the output shape in sync with `CrossExamOutputSchema` and `FallbackCrossExamOutput` in `src/schemas/court.schemas.ts`; update the route integration test. |
| Add or rename verdict fields | `src/schemas/court.schemas.ts` (`VerdictOutputSchema` and sentence schema) | Update the output contract in `prompts/judge.v1.txt`, `FallbackVerdictOutput`, `public/index.html` card rendering, and any evaluation/report consumers. |
| Change request size limits or defaults | `src/schemas/court.schemas.ts` | Check both the browser payload in `public/index.html` and the pre-route safety screening in `src/middleware/aiInputGuard.ts`. `express.json()` also has a whole-body limit in `src/app.ts`. |
| Change models, retry behavior, or streamed output | `src/routes/court.routes.ts` for route model selection; `src/services/aiClient.ts` for shared call/retry/stream behavior | Update `src/schemas/court.schemas.ts` only when the data contract changes; add focused client and route tests. The current suite does not have dedicated `AiClient` retry/fallback tests. |
| Change the user flow, share card, API wiring, or runtime middleware | `public/index.html` for browser stages/card; `src/routes/court.routes.ts` for endpoint behavior; `src/app.ts` for middleware/static hosting | Update `tests/integration/routes.test.ts`; for limits/timeouts see `src/middleware/rateLimiter.ts` and `src/middleware/timeout.ts`; for environment behavior see `src/config/env.ts`. |

## From prompt file to evaluation to deployment

1. Edit the versioned prompt under `prompts/`. For verdict behavior, the runtime currently loads `judge.v1.txt` from `buildVerdictPrompts()` in `src/routes/court.routes.ts`; adding a file alone does not make the app use it.
2. Check the prompt's placeholders against `PromptLoader.load()` call sites and keep witness text inside its intended prompt boundary. `PromptLoader` escapes `&`, `<`, and `>` before inserting values.
3. The evaluation harness is `evals/runEval.ts` and its dataset is `evals/dataset/cases.json`. The checked-in GitHub Actions workflow invokes a mock evaluation, but the mock branch hardcodes outcomes and simulated usage and does not load the prompt for scoring. It verifies harness mechanics, not prompt quality or live fairness.
4. The live evaluation path is currently inconsistent: it passes `GuardOutputSchema`, whose result uses `classification`, but reads `res.data.is_safe`; it also loads the older `guardrail.v1.txt`. A trustworthy live evaluation command cannot be recommended until that path is corrected. No eval command is included here because it could not be verified in this environment.
5. GitHub Actions runs tests, a TypeScript build, and the mock evaluation on pushes and pull requests to `main` or `master`. The workflow has no deployment job. The current checkout has no deployment guide or hosting configuration, so deployment steps depend on a platform that is not specified here; no deploy command is included.

## Glossary

| Term | Meaning in this project |
| --- | --- |
| Guard | The `/guard` safety triage that classifies one text as safe, serious harm, prompt injection, or gibberish. Generated-content routes also run server-side screening. |
| Cross-exam | The stage that asks each party a question based on both claims. It is generated by `/crossexam`. |
| Fault split | A verdict outcome where both parties share responsibility (`SPLIT_FAULT`). |
| Sentence | The verdict's playful consequence: a punishment and a non-negative fine in INR, defined by `VerdictSentenceSchema`. |

## Common errors and fixes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Production startup reports environment configuration error | `ANTHROPIC_API_KEY` is missing or empty, or `NODE_ENV`/`PORT` is invalid | Set the required production environment values in the hosting environment. Never put a real key in tracked files. |
| `Prompt file not found` | The process was started outside the repo root or a prompt filename does not match | Start from the repository root and confirm the filename exists under `prompts/`. `PromptLoader` resolves that directory from the current working directory. |
| HTTP 400 `Validation Error` | A request field is empty, too short, too long, or uses an unsupported language | Read the returned flattened details and compare the payload with the relevant request schema. Guard text is 1–2,000 characters; cross-exam claims are 3–2,000 characters. Verdict fields currently have no maximum length. |
| HTTP 422 safety action | The server classified an input as serious harm, prompt injection, or gibberish | Do not try to bypass the gate. For a harmless dispute, rewrite it as a clear, ordinary claim or answer. |
| HTTP 503 `GUARD_UNAVAILABLE` | Safety screening needed a fallback or could not produce a verified result | Check the configured Anthropic key and provider availability, then retry later. Generation is deliberately stopped when screening falls back. |
| HTTP 429 with `Retry-After` | The process-local limiter counted more than 30 requests from the same observed IP in 15 minutes | Wait for the indicated interval. Limits are not shared across server replicas. |
| A streamed verdict appears to stall | The timeout middleware cannot send its 504 after SSE headers have been sent, and it does not cancel provider work | Retry after the connection ends. This is a known reliability limitation; see `src/middleware/timeout.ts` and `PROGRESS.md`. |
| Evaluation output looks like model quality data | The mock runner writes simulated winners, latency, and token counts | Treat mock output as harness-only. Do not report it as a live-model result; the live evaluator also needs the schema mismatch corrected. |
