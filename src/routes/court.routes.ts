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

// 1. POST /guard - Fast multi-category pre-inference triage (Haiku)
courtRouter.post('/guard', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = GuardRequestSchema.parse(req.body);

    const prompt = PromptLoader.load('guardrail.v2.txt', {
      input_text: input.text
    });

    const result = await aiClient.callStructured({
      model: 'claude-3-5-haiku-latest',
      systemPrompt: 'You are an ultra-fast, objective safety triaging system for a comedic dispute resolution game. Return strictly valid JSON.',
      userPrompt: prompt,
      schema: GuardOutputSchema,
      fallback: FallbackGuardOutput
    });

    const classification = result.data.classification;

    // Handle Category 1: Serious Harm -> Skip comedy judge, return empathetic support
    if (classification === 'serious_harm') {
      res.json({
        success: true,
        action: 'HALT_MEDIATION',
        classification: 'serious_harm',
        message: result.data.caring_response || 'It sounds like you or someone in your life is navigating a painful or unsafe situation. This courtroom game is designed for petty, harmless disputes, not genuine distress. Please reach out to someone who can support you.',
        helplines: [
          { name: 'Vandrevala Foundation Mental Health Support', contact: '9999 666 555' },
          { name: 'KIRAN National Mental Health Helpline', contact: '1800-599-0019' },
          { name: 'National Emergency Helpline', contact: '112' }
        ],
        data: result.data,
        meta: result.telemetry
      });
      return;
    }

    // Handle Category 2: Prompt Injection -> Sandbox as untrusted claim, judge still proceeds
    if (classification === 'prompt_injection') {
      res.json({
        success: true,
        action: 'PROCEED_AS_UNTRUSTED',
        classification: 'prompt_injection',
        warning: 'Mylord detected an adversarial prompt injection attempt. This claim will be strictly treated as untrusted witness testimony.',
        data: result.data,
        meta: result.telemetry
      });
      return;
    }

    // Handle Category 3: Gibberish -> Ask for human intelligible dispute
    if (classification === 'gibberish') {
      res.json({
        success: true,
        action: 'REJECT_GIBBERISH',
        classification: 'gibberish',
        message: 'The court cannot decipher this input. Please submit an intelligible grievance.',
        data: result.data,
        meta: result.telemetry
      });
      return;
    }

    // Handle Category 4: Safe -> Normal green light
    res.json({
      success: true,
      action: 'PROCEED',
      classification: 'safe',
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
