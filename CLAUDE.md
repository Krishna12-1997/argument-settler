# Project Instructions

## Tools

- Use Node.js and TypeScript.
- Use Express for the server, Zod for validation, and Vitest for tests.

## Rules

- Check every AI response with a Zod schema. If it is invalid, retry once. If it is still invalid, use a safe fallback.
- Read API keys and other secrets from environment variables. Never put them in code.
- Keep prompts in versioned text files in the `prompts` folder. Do not put long prompts in the application code.
- Before adding a feature, explain the plan and wait for approval.
- Keep code changes small and focused.
- After every completed task, update PROGRESS.md before ending your turn.
