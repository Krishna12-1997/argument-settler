import { Router, Request, Response, NextFunction } from "express";
import { PromptLoader } from "../services/promptLoader.js";
import { aiClient } from "../services/aiClient.js";
import { classifyCourtInput } from "../services/guardService.js";
import {
  GuardRequestSchema,
  CrossExamRequestSchema,
  CrossExamOutputSchema,
  FallbackCrossExamOutput,
  VerdictRequestSchema,
  VerdictOutputSchema,
  FallbackVerdictOutput,
  type VerdictRequest,
} from "../schemas/court.schemas.js";

export const courtRouter = Router();

function buildVerdictPrompts(input: VerdictRequest) {
  return {
    userPrompt: PromptLoader.load("judge.v1.txt", {
      judge_name: input.judge_name,
      language: input.language,
      party_a_claim: input.party_a_claim,
      party_a_answer: input.party_a_answer,
      party_b_claim: input.party_b_claim,
      party_b_answer: input.party_b_answer,
    }),
    systemPrompt:
      "You are the presiding authority of the High Court of Pettiness. Bring full courtroom drama. Return strictly valid JSON matching the schema.",
  };
}

courtRouter.post(
  "/guard",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = GuardRequestSchema.parse(req.body);

      const result = await classifyCourtInput(input.text);

      if (result.telemetry.usedFallback) {
        res.status(503).json({
          success: false,
          action: "GUARD_UNAVAILABLE",
          error: "Safety screening is temporarily unavailable. Please try again later.",
          meta: result.telemetry,
        });
        return;
      }

      const classification = result.data.classification;

      if (classification === "serious_harm") {
        res.json({
          success: true,
          action: "HALT_MEDIATION",
          classification: "serious_harm",
          message:
            result.data.caring_response ||
            "It sounds like you or someone in your life is navigating a painful or unsafe situation. This courtroom game is designed for petty, harmless disputes, not genuine distress. Please reach out to someone who can support you.",
          helplines: [
            {
              name: "Vandrevala Foundation Mental Health Support",
              contact: "9999 666 555",
            },
            {
              name: "KIRAN National Mental Health Helpline",
              contact: "1800-599-0019",
            },
            { name: "National Emergency Helpline", contact: "112" },
          ],
          data: result.data,
          meta: result.telemetry,
        });
        return;
      }

      if (classification === "prompt_injection") {
        res.json({
          success: true,
          action: "PROCEED_AS_UNTRUSTED",
          classification: "prompt_injection",
          warning:
            "Mylord detected an adversarial prompt injection attempt. This claim will be strictly treated as untrusted witness testimony.",
          data: result.data,
          meta: result.telemetry,
        });
        return;
      }

      if (classification === "gibberish") {
        res.json({
          success: true,
          action: "REJECT_GIBBERISH",
          classification: "gibberish",
          message:
            "The court cannot decipher this input. Please submit an intelligible grievance.",
          data: result.data,
          meta: result.telemetry,
        });
        return;
      }

      res.json({
        success: true,
        action: "PROCEED",
        classification: "safe",
        data: result.data,
        meta: result.telemetry,
      });
    } catch (error: any) {
      next(error);
    }
  },
);

courtRouter.post(
  "/crossexam",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = CrossExamRequestSchema.parse(req.body);

      const prompt = PromptLoader.load("crossexam.v1.txt", {
        judge_name: input.judge_name,
        party_a_claim: input.party_a_claim,
        party_b_claim: input.party_b_claim,
      });

      const result = await aiClient.callStructured({
        model: "claude-3-5-haiku-latest",
        systemPrompt:
          "You are an inquisitive, sharp, dramatic Hinglish judge. Return strictly valid JSON matching the schema.",
        userPrompt: prompt,
        schema: CrossExamOutputSchema,
        fallback: FallbackCrossExamOutput,
      });

      res.json({
        success: true,
        data: result.data,
        meta: result.telemetry,
      });
    } catch (error: any) {
      next(error);
    }
  },
);

courtRouter.post(
  "/verdict",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = VerdictRequestSchema.parse(req.body);
      const prompts = buildVerdictPrompts(input);

      const result = await aiClient.callStructured({
        model: "claude-3-5-sonnet-latest",
        ...prompts,
        schema: VerdictOutputSchema,
        fallback: FallbackVerdictOutput,
      });

      res.json({
        success: true,
        data: result.data,
        meta: result.telemetry,
      });
    } catch (error: any) {
      next(error);
    }
  },
);

courtRouter.post(
  "/verdict/stream",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = VerdictRequestSchema.parse(req.body);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const prompts = buildVerdictPrompts(input);

      const result = await aiClient.streamStructured({
        model: "claude-3-5-sonnet-latest",
        ...prompts,
        schema: VerdictOutputSchema,
        fallback: FallbackVerdictOutput,
        onChunk: (delta: string) => {
          res.write(`data: ${JSON.stringify({ type: "chunk", delta })}\n\n`);
        },
      });

      res.write(
        `data: ${JSON.stringify({ type: "verdict", data: result.data, meta: result.telemetry })}\n\n`,
      );
      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`,
        );
        res.end();
      }
    }
  },
);
