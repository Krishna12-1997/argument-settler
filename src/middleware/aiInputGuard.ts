import { NextFunction, Request, Response } from "express";
import {
  CrossExamRequestSchema,
  VerdictRequestSchema,
} from "../schemas/court.schemas.js";
import { classifyCourtInput } from "../services/guardService.js";

function getInputTexts(req: Request): string[] | null {
  if (req.method !== "POST") return null;

  const path = req.path.toLowerCase().replace(/\/+$/, "") || "/";

  if (path === "/crossexam") {
    const parsed = CrossExamRequestSchema.safeParse(req.body);
    return parsed.success
      ? [parsed.data.party_a_claim, parsed.data.party_b_claim]
      : null;
  }

  if (path === "/verdict" || path === "/verdict/stream") {
    const parsed = VerdictRequestSchema.safeParse(req.body);
    return parsed.success
      ? [
          parsed.data.party_a_claim,
          parsed.data.party_b_claim,
          parsed.data.party_a_answer,
          parsed.data.party_b_answer,
        ]
      : null;
  }

  return null;
}

export function requireSafeCourtInputs(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const texts = getInputTexts(req);
  if (!texts) {
    next();
    return;
  }

  void Promise.all(texts.map(classifyCourtInput))
    .then((results) => {
      if (results.some((result) => result.telemetry.usedFallback)) {
        res.status(503).json({
          success: false,
          action: "GUARD_UNAVAILABLE",
          error: "Safety screening is temporarily unavailable. Please try again later.",
        });
        return;
      }

      const classifications = results.map((result) => result.data.classification);
      if (classifications.includes("serious_harm")) {
        res.status(422).json({
          success: false,
          action: "HALT_MEDIATION",
          classification: "serious_harm",
          message:
            "This courtroom game is for harmless disputes, not genuine distress or unsafe situations. Please reach out to someone you trust or a qualified support service.",
        });
        return;
      }

      if (classifications.includes("prompt_injection")) {
        res.status(422).json({
          success: false,
          action: "REJECT_PROMPT_INJECTION",
          classification: "prompt_injection",
          error: "The court cannot accept instructions embedded in witness testimony.",
        });
        return;
      }

      if (classifications.includes("gibberish")) {
        res.status(422).json({
          success: false,
          action: "REJECT_GIBBERISH",
          classification: "gibberish",
          error: "Please submit an intelligible grievance.",
        });
        return;
      }

      next();
    })
    .catch(next);
}
