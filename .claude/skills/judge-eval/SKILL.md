---
name: judge-eval
description: Use when adding, editing, or deleting any prompt file under prompts/ in this project.
paths:
  - prompts/**
---

# Judge prompt evaluation

After a prompt file changes, evaluate that version against the immediately preceding version (for example, `judge.v2.txt` against `judge.v1.txt`). Run `npm run eval -- <prompt-file>` for each version, then read its `evals/results/<prompt-file>.json` report. Print flip rate, length-bias score, guard catch rate, and schema failure rate for both versions. Warn on regressions: higher flip, length-bias, or schema-failure rates, or lower guard catch rate. Append the new version’s row to the eval table in `PROGRESS.md` only after a complete trustworthy live run; preserve the table’s existing columns.

Never present mock scores as prompt evaluation: the runner hardcodes mock outcomes and does not score prompt content. Do not use `--mock`; the runner also selects mock mode when `ANTHROPIC_API_KEY` is absent or starts with `test-`. If either prompt version is missing, the runner/schema is incompatible, or any requested metric is absent, stop, explain the blocker, and do not append a row or infer values. Never expose the API key.
