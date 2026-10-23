# CLAUDE.md - Argument Settler Project Guidelines

## Tech Stack
- **Runtime & Language**: Node.js + TypeScript (Strict mode)
- **Web Framework**: Express
- **Schema & Validation**: Zod
- **Testing**: Vitest

## Core Engineering Rules
1. **Never Trust Raw Model Output**:
   - Every AI response must be validated and parsed using a Zod schema.
   - If parsing fails, retry once with a correction prompt.
   - If retry fails, degrade gracefully using a deterministic fallback response.
2. **Environment & Secrets**:
   - API keys and sensitive credentials must only be accessed via environment variables (`process.env`).
   - Never hardcode or commit keys or secrets.
3. **Prompt Management**:
   - Prompts must live in `/prompts` as versioned plain text or template files (e.g., `prompts/judge.v1.txt`, `prompts/crossexam.v1.txt`).
   - Never embed multi-line prompt strings directly inside application code.
4. **Git Workflow**:
   - Small, atomic commits addressing one concern at a time.
5. **Planning & Approvals**:
   - Before writing code for any feature, present a concise implementation plan and wait for user approval before proceeding.
