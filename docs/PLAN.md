# Documentation Plan

This plan covers the architecture documentation requested for the current Argument Settler implementation. Each task has a concrete completion check; it does not include code changes.

1. **Confirm the implementation boundaries.** Read `CLAUDE.md`, all files under `src/`, and the browser flow in `public/index.html`. Verify the named API endpoints and which layer owns prompts, validation, model calls, and share-card generation.
   - **Verify:** Every statement in the architecture overview and diagrams maps to an inspected file or is clearly labeled as a recommendation.
2. **Write the one-minute system overview and user-flow diagram.** Describe the app at a high level and diagram Court open through share-card download, including the four guard classifications and blocking outcomes.
   - **Verify:** Overview is one paragraph; Mermaid flow includes both parties’ submissions, guard outcomes, cross-exam, answers, verdict, and share card.
3. **Write the API sequence diagram.** Show request validation, prompt loading, AI calls, Anthropic responses, output validation, retry, and fallback. Include the streaming verdict path and the regular JSON verdict endpoint in explanatory text.
   - **Verify:** Mermaid sequence covers browser through Express and all named service boundaries, and distinguishes streamed chunks from the validated final verdict.
4. **Map source folders and entry points.** Document each requested `src/` folder with its purpose and key files; note the root-level app and server entry files.
   - **Verify:** The table names `config`, `middleware`, `routes`, `schemas`, and `services`, with no implied folders that do not exist.
5. **Inventory runtime data contracts.** List each Zod schema and enum from environment and court schemas and state what each guards; distinguish inferred TypeScript types and fallback objects from schemas.
   - **Verify:** Contract inventory accounts for every Zod declaration in `src/` and notes defaults and meaningful size/range constraints.
6. **Document operational failure behavior.** Trace validation, prompt, provider, retry/fallback, rate-limit, timeout, SSE, and browser download failures to their current handlers.
   - **Verify:** Each failure entry identifies an observed handler or explicitly describes an unhandled gap; recommendations are not presented as current behavior.
7. **Record five design tradeoffs and scale options.** Explain the current decision, its consequence, and a plausible change if load or product needs grow.
   - **Verify:** There are exactly five tradeoffs and each scale change is clearly framed as a recommendation.
8. **Review the documentation against the repository.** Cross-check routes, schemas, prompts, browser behavior, and error handling for drift; ensure both documents are readable and Mermaid fences are intact.
   - **Verify:** No implementation claim conflicts with `src/` or `public/index.html`; documentation-only files are the only deliverables.
