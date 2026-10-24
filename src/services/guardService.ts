import { PromptLoader } from "./promptLoader.js";
import { aiClient } from "./aiClient.js";
import {
  FallbackGuardOutput,
  GuardOutputSchema,
} from "../schemas/court.schemas.js";

export function classifyCourtInput(text: string) {
  const prompt = PromptLoader.load("guardrail.v2.txt", {
    input_text: text,
  });

  return aiClient.callStructured({
    model: "claude-3-5-haiku-latest",
    systemPrompt:
      "You are an ultra-fast, objective safety triaging system for a comedic dispute resolution game. Return strictly valid JSON.",
    userPrompt: prompt,
    schema: GuardOutputSchema,
    fallback: FallbackGuardOutput,
  });
}
