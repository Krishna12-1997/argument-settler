# Argument Settler Progress

## Status summary

As of 2026-10-24: the browser courtroom, Express API, validation, model retry/fallback, streaming verdict, tests, and evaluation harness are present; no active implementation milestone is recorded.

## Milestones

| Phase | Status | Evidence (commit or file) |
| --- | --- | --- |
| Core app: schemas, prompt loader, Anthropic client, and routes | done | `5e41a0a`, `8af141a`, `94a396e` |
| Browser courtroom and downloadable verdict card | done | `d801d2d`, `cd79d0e`; `public/index.html` |
| Four-category guardrail and serious-harm response | done | `c52aa53`, `70f2655`; `src/routes/court.routes.ts` |
| Verdict streaming and language selection | done | `0975b7d`, `91741b8`, `4054500` |
| Rate limit, timeout, and CI workflow | done | `6d6b8cd`, `009cc23`; `.github/workflows/ci.yml` |
| 35-case evaluation harness and offline mock mode | done | `bae5d5b`, `16f0221`; `evals/runEval.ts` and `evals/dataset/cases.json` |
| Architecture documentation and task plan | done | `docs/ARCHITECTURE.md`, `docs/PLAN.md` |
| Live evaluation path consistency | todo | `evals/runEval.ts`, `src/schemas/court.schemas.ts` (see Known limitations) |

## Done

- Implemented the staged dispute flow, Zod contracts, Anthropic calls with one repair retry and typed fallbacks, guardrail handling, and SSE verdict path. Evidence: commits listed in Milestones and current `src/` files. **AI tool:** the app calls Anthropic Claude models; the submission write-up also records Codex review of the project.
- Added tests and a 35-case evaluation harness with mock/offline support. Evidence: `tests/`, `evals/`, and commits `ac603db`, `bae5d5b`, `16f0221`.
- Added the architecture guide and verifiable documentation plan. **AI tool:** OpenAI Codex assisted with repository inspection and documentation in this session. The named brainstorming and writing-plans skills were not available in this environment.
- Added the project rule requiring a `PROGRESS.md` update after completed tasks. Evidence: `CLAUDE.md`.
- Completed the approved cleanup: consolidated repeated mock-evaluation narrative, removed the unused share-card metadata argument, shared verdict prompt construction while preserving both routes, and restored concise local run instructions. **AI tool:** Codex conducted the audit and diff review; the user approved these items before changes.
- Closed the critical AI-input safety boundary: generation routes now screen all claims and answers server-side, fail closed if screening falls back, and reject prompt-injection classifications; prompt substitutions are escaped and caller-controlled judge names no longer enter system prompts. Added direct-route, fallback, and prompt-escaping tests. **AI tool:** Codex performed the skeptical review and implemented the approved critical fix. Commit: `133a947`.
- Added `docs/DEVELOPER_GUIDE.md` with a source-based tour, verified local run/test/build steps, prompt workflow caveats, glossary, and troubleshooting. **AI tool:** Codex. Verified environment copy, build, server HTTP 200, and all 32 tests. A fresh dependency install, evaluator run, and deployment command were omitted because they could not be executed here.
- Added the `.claude/skills/judge-eval/` project skill for prompt-file changes, with version comparison, regression warnings, and safeguards against mock or incomplete metrics. **AI tool/skill:** Codex used the `writing-skills` workflow and its pressure tests. The required `judge.v1` vs `judge.v2` evaluation could not be run because `judge.v2.txt` is absent and the available evaluation path is not trustworthy for live results.
- Installed the official Ponytail `ponytail-audit` and `ponytail-review` skills under `.agents/skills/` with their MIT license notices, from upstream revision `09c434ab73ca43761c5d8b0c5d341926c2fba710`. Applied both checklists to the whole repo and current working-tree changes; no application code was changed.

## In progress

No in-progress implementation milestone is stated in the current code or commit history.

## Next up (ordered)

These are recommendations inferred from current source, not a committed roadmap.

1. Reconcile the live guard-evaluation result shape (`is_safe` versus `classification`) before using the live evaluation mode.
2. Run and record a clearly labeled live-model evaluation for each prompt version intended for comparison; the current saved result is mock-generated.
3. Add explicit coverage for AI-client retry/fallback behavior and the guard fallback policy, which currently defaults to `safe`.
4. If deploying multiple server instances, replace process-local rate-limit storage with a shared limiter and define provider-call cancellation/deadlines.

## Decisions log

| Date | Decision | Why | Alternatives rejected |
| --- | --- | --- | --- |
| 2026-10-23 | Validate model responses with Zod, retry once, then return a typed fallback. | This rule is stated in `CLAUDE.md` and implemented in `src/services/aiClient.ts`; it keeps unvalidated model output from becoming the final structured result. | No rejected alternative is documented. |
| 2026-10-23 | Add an offline simulation path for evaluations without a paid API key. | The commit `16f0221` describes the goal as running without a paid API key; `evals/runEval.ts` selects mock behavior when no key is set. | No rejected alternative is documented. |
| 2026-10-23 | Stream verdict text to the browser using the `/verdict/stream` SSE route. | Commits `0975b7d` and `cd79d0e` add the streaming service/route and live browser display; the final structured verdict is still schema-validated. | No rejected alternative is documented. |
| 2026-10-24 | Treat saved `judge.v1.txt` metrics as mock results, not live-model evidence. | `evals/runEval.ts` hardcodes mock outcomes, latency, and token counts when mock mode is selected; the saved artifact contains those fixed values. The current submission write-up says Codex review prompted correction of model-performance claims. | No rejected alternative is documented. |

## AI failures and corrections

- The saved evaluation metrics could be mistaken for live Claude performance. The current submission write-up records that Codex review caught this; source inspection confirms the mock branch hardcodes outcomes, latency, and token counts. The write-up was revised to identify the artifact as mock evidence and avoid treating it as a live-model result.
- The saved `judge.v1.txt` artifact reports zero retries and zero fallbacks across its 35 entries. This describes that artifact only; it does not establish live-model reliability. No model-output retry or fallback failure is recorded in the saved artifact.
- During `judge-eval` skill pressure testing, agents proposed using mock scores under deadline pressure and inferring missing metrics. The skill was corrected to forbid mock results, inferred values, and table updates when a version or metric is missing; post-edit pressure tests confirmed those stop conditions.

## Eval scores per prompt version

The repository currently contains one saved result artifact. The runner's mock branch uses fixed simulated outcomes and token/latency values, so these are **mock scores**, not measured Anthropic performance.

| Prompt version | Cases | Swapped-pair flip rate | Party A win bias | Length bias | Guardrail catch rate | Schema failure/fallback rate | Avg latency | Avg input/output tokens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `judge.v1.txt` (mock; artifact timestamp 2026-10-23) | 35 | 0% (10 swapped pairs) | 56% | 20% | 100% | 0% | 218 ms | 160 / 84 |

Evidence: `evals/results/judge.v1.txt.json`. No other prompt-version score artifact is present in `evals/results/`.

## Known limitations

- The live evaluation path in `evals/runEval.ts` reads `res.data.is_safe`, but its supplied `GuardOutputSchema` defines `classification` and has no `is_safe` field. This source mismatch should be resolved before trusting live guard-evaluation results.
- The saved benchmark is mock-generated; no live-model score artifact is present in the repository.
- `FallbackGuardOutput` still contains a `safe` classification; route responses and generation middleware must continue checking `usedFallback` so that this value cannot be treated as a successful safety decision.
- Rate limiting uses an in-memory per-process map; limits are not shared between replicas.
- The request timeout sends a response when possible but does not cancel ongoing model work. Once SSE headers are sent, the timeout middleware does not send its 504 response.
- `DEPLOYMENT.md` is currently marked deleted in the Git working tree, so deployment instructions are not present in the current checkout.

### Code review findings (2026-10-24)

The following non-critical findings remain open:

- **Major — input and cost limits:** `VerdictRequestSchema` has no maximum length for claims, answers, or `judge_name`; the JSON parser permits bodies up to 1 MB. Add consistent per-field bounds to prevent oversized prompts and model cost spikes. Evidence: `src/schemas/court.schemas.ts`, `src/app.ts`.
- **Major — unvalidated streamed output:** `AiClient.streamStructured()` forwards model text chunks before JSON parsing and Zod validation completes. Invalid or unsafe text may already be visible even if the final result is rejected. Consider buffering or streaming only content that has passed a safety/structure policy. Evidence: `src/services/aiClient.ts`.
- **Major — timeout and provider work:** the 25-second middleware does not cancel the Anthropic request, and it cannot send a 504 after SSE headers are sent. Add provider cancellation/deadlines and an SSE-specific timeout event. Evidence: `src/middleware/timeout.ts`, `src/routes/court.routes.ts`.
- **Major — proxy and replica rate limits:** the limiter stores counts in a process-local `Map` using `req.ip`; replicas do not share limits, and reverse-proxy configuration may make unrelated users share an address. Use a shared limiter and explicitly configure trusted proxies at deployment. Evidence: `src/middleware/rateLimiter.ts`, `src/app.ts`.
- **Major — screening cost:** the browser calls `/guard` for both claims, and the server now independently rechecks two claims for cross-exam and all four claims/answers for verdict. This is safer but adds eight guard-model calls per full trial. Consider short-lived server-issued attestations for previously screened claims while retaining server-side checks for answers. Evidence: `public/index.html`, `src/middleware/aiInputGuard.ts`.
- **Major — fairness evidence:** the saved 0% swapped-pair flip rate, 56% Party A win bias, and 20% length bias come from the mock evaluation path, whose outcomes and token/latency values are simulated. They do not establish live model fairness. The live guard-eval path also reads `is_safe` although `GuardOutputSchema` returns `classification`. Repair the evaluator and record live results before using it as a fairness gate. Evidence: `evals/runEval.ts`, `evals/results/judge.v1.txt.json`, `src/schemas/court.schemas.ts`.
- **Major — regression coverage:** no focused tests cover `AiClient` JSON/schema retry and fallback behavior, streaming failure/validation behavior, or the non-stream `/verdict` route. Add those cases before relying on the recovery and parity guarantees. Evidence: `tests/`.
- **Minor — malformed JSON status:** JSON parser syntax errors reach the generic error handler and return 500 rather than a client error. Map parser syntax failures to 400 without exposing internal details. Evidence: `src/app.ts`.
- **Minor — language prompt conflict:** the verdict prompt accepts `hindi` and `english` but its required-output example still mandates a Hinglish monologue. Align that instruction with the selected language. Evidence: `prompts/judge.v1.txt`.
- **Minor — public API abuse surface:** CORS is open and the model endpoints have no user identity or quota; the IP limiter is only a coarse public-service cost control. Add deployment-level quotas or abuse controls if the app is exposed beyond a small demo. Evidence: `src/app.ts`, `src/middleware/rateLimiter.ts`.
- **Major — probabilistic prompt-injection detection:** XML-like boundary breakout is escaped and detected classifications are rejected, but a novel natural-language injection can still be misclassified by the model guard. Keep model instructions explicit about treating submitted text as data and add adversarial live-model cases. Evidence: `src/services/guardService.ts`, `src/middleware/aiInputGuard.ts`.
- The current environment has Node and installed dependencies but no `npm`/`npx`; the evaluator invocation through `tsx` also failed in this host at `os.userInfo()`. `docs/DEVELOPER_GUIDE.md` therefore omits unverified install/eval/deploy commands and explains those gaps.
- The `judge-eval` skill has not been exercised with a real `judge.v1`/`judge.v2` comparison: `prompts/judge.v2.txt` is absent, the saved v1 result is mock-generated, and the live guard evaluation has a schema mismatch. No comparison row was added.
- The generic Express 500 handler and streamed-verdict error event return `err.message` to callers; provider or filesystem failures can expose internal implementation details. Evidence: `src/app.ts`, `src/routes/court.routes.ts`.
