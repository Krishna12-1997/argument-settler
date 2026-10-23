import { Router, Request, Response, NextFunction } from 'express';
import { PromptLoader } from '../services/promptLoader.js';
import { aiClient } from '../services/aiClient.js';
import {
  GuardRequestSchema,
  GuardOutputSchema,
  FallbackGuardOutput,
  CrossExamRequestSchema,
  CrossExamOutputSchema,
  FallbackCrossExamOutput,
  VerdictRequestSchema,
  VerdictOutputSchema,
  FallbackVerdictOutput
} from '../schemas/court.schemas.js';

export const courtRouter = Router();

// 1. POST /guard - Pre-inference sanitization and safety check
courtRouter.post('/guard', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = GuardRequestSchema.parse(req.body);

    const prompt = PromptLoader.load('guardrail.v1.txt', {
      input_text: input.text
    });

    const result = await aiClient.callStructured({
      model: 'claude-3-5-haiku-latest',
      systemPrompt: 'You are an ultra-fast, objective content safety guardrail for a humorous courtroom game. Return strictly valid JSON.',
      userPrompt: prompt,
      schema: GuardOutputSchema,
      fallback: FallbackGuardOutput
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.telemetry
    });
  } catch (error: any) {
    next(error);
  }
});

// 2. POST /crossexam - Cross-examination questions generated via fast tier (Haiku)
courtRouter.post('/crossexam', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = CrossExamRequestSchema.parse(req.body);

    const prompt = PromptLoader.load('crossexam.v1.txt', {
      judge_name: input.judge_name,
      party_a_claim: input.party_a_claim,
      party_b_claim: input.party_b_claim
    });

    const result = await aiClient.callStructured({
      model: 'claude-3-5-haiku-latest',
      systemPrompt: `You are Justice ${input.judge_name}, an inquisitive, sharp, dramatic Hinglish judge. Return strictly valid JSON matching the schema.`,
      userPrompt: prompt,
      schema: CrossExamOutputSchema,
      fallback: FallbackCrossExamOutput
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.telemetry
    });
  } catch (error: any) {
    next(error);
  }
});

// 3. POST /verdict - Courtroom decree and funny sentence via high reasoning tier (Sonnet)
courtRouter.post('/verdict', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = VerdictRequestSchema.parse(req.body);

    const prompt = PromptLoader.load('judge.v1.txt', {
      judge_name: input.judge_name,
      party_a_claim: input.party_a_claim,
      party_a_answer: input.party_a_answer,
      party_b_claim: input.party_b_claim,
      party_b_answer: input.party_b_answer
    });

    const result = await aiClient.callStructured({
      model: 'claude-3-5-sonnet-latest',
      systemPrompt: `You are Justice ${input.judge_name}, the definitive presiding authority of the High Court of Pettiness. Bring full Bollywood courtroom drama and Hinglish humor. Return strictly valid JSON matching the schema.`,
      userPrompt: prompt,
      schema: VerdictOutputSchema,
      fallback: FallbackVerdictOutput
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.telemetry
    });
  } catch (error: any) {
    next(error);
  }
});
