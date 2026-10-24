# Argument Settler

## What I built and why

Argument Settler is a playful courtroom for settling small arguments between friends, roommates, or partners. Each person shares their side, answers a question from the judge, and gets a funny verdict. I chose this idea because everyday disagreements are easy to recognize, and humor can make them easier to talk about.

## How I used AI

The app uses Anthropic’s Claude models: Haiku for the safety check and cross-examination questions, and Sonnet for the final verdict. The responses are checked against schemas before the app uses them, with a retry and a fallback when a response does not fit.

I also used OpenAI Codex to review the project and help make this submission write-up clearer. In that review, Codex pointed out that the saved evaluation uses mock results, so it would be misleading to present those results as proof of how the live models behave.

## How AI shaped the project

The app is split into three steps: check the submissions, ask each person a question, then give a verdict. Its prompts are kept in separate files so the judge’s voice can be changed without editing application code.

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to your own key.
3. Start the app with `npm run dev`, then open `http://localhost:3000`.
4. Run the checks with `npm test`; build with `npm run build`.
