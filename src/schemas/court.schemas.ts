import { z } from 'zod';

// ==========================
// 1. Request Input Schemas
// ==========================

export const GuardRequestSchema = z.object({
  text: z.string().trim().min(1, 'Text cannot be empty').max(2000, 'Text exceeds 2000 characters')
});
export type GuardRequest = z.infer<typeof GuardRequestSchema>;

export const CrossExamRequestSchema = z.object({
  judge_name: z.string().trim().default('Bhide'),
  party_a_claim: z.string().trim().min(3, 'Party A claim too short').max(2000),
  party_b_claim: z.string().trim().min(3, 'Party B claim too short').max(2000)
});
export type CrossExamRequest = z.infer<typeof CrossExamRequestSchema>;

export const CourtLanguageEnum = z.enum(['hinglish', 'hindi', 'english']);
export type CourtLanguage = z.infer<typeof CourtLanguageEnum>;

export const VerdictRequestSchema = z.object({
  judge_name: z.string().trim().default('Bhide'),
  language: CourtLanguageEnum.default('hinglish'),
  party_a_claim: z.string().trim().min(3),
  party_b_claim: z.string().trim().min(3),
  party_a_answer: z.string().trim().min(1, 'Party A answer required'),
  party_b_answer: z.string().trim().min(1, 'Party B answer required')
});
export type VerdictRequest = z.infer<typeof VerdictRequestSchema>;

// ==========================
// 2. AI Output Zod Schemas
// ==========================

export const GuardClassificationEnum = z.enum(['safe', 'serious_harm', 'prompt_injection', 'gibberish']);
export type GuardClassification = z.infer<typeof GuardClassificationEnum>;

export const GuardOutputSchema = z.object({
  classification: GuardClassificationEnum,
  confidence: z.number().min(0).max(1).default(1.0),
  reasoning: z.string().min(1),
  caring_response: z.string().nullable().optional()
});
export type GuardOutput = z.infer<typeof GuardOutputSchema>;

export const CrossExamOutputSchema = z.object({
  party_a_question: z.string().min(5),
  party_b_question: z.string().min(5),
  contested_issue_summary: z.string().min(5)
});
export type CrossExamOutput = z.infer<typeof CrossExamOutputSchema>;

export const WinnerEnum = z.enum(['PARTY_A', 'PARTY_B', 'SPLIT_FAULT', 'MUTUAL_CONTEMPT']);

export const VerdictSentenceSchema = z.object({
  punishment: z.string().min(5),
  fine_amount_inr: z.number().int().nonnegative()
});

export const VerdictOutputSchema = z.object({
  court_title: z.string().min(3),
  winner: WinnerEnum,
  guilty_party: z.enum(['PARTY_A', 'PARTY_B', 'BOTH', 'NEITHER']),
  charges_proven: z.array(z.string()).min(1),
  dramatic_monologue: z.string().min(10),
  sentence: VerdictSentenceSchema
});
export type VerdictOutput = z.infer<typeof VerdictOutputSchema>;

// ==========================
// 3. Fallback Objects
// ==========================

export const FallbackGuardOutput: GuardOutput = {
  classification: 'safe',
  confidence: 0.5,
  reasoning: 'Fallback: Guardrail passed by default resilience policy.',
  caring_response: null
};

export const FallbackCrossExamOutput: CrossExamOutput = {
  party_a_question: 'Party A, are you truly innocent, or is this just pure drama for the court?',
  party_b_question: 'Party B, kitna sach bol rahe ho aur kitna masala laga rahe ho?',
  contested_issue_summary: 'Unresolved petty domestic dispute.'
};

export const FallbackVerdictOutput: VerdictOutput = {
  court_title: 'In the High Court of Pettiness, Emergency Bench',
  winner: 'SPLIT_FAULT',
  guilty_party: 'BOTH',
  charges_proven: ['Mutual Obstinacy under Section 420 of Ego'],
  dramatic_monologue: 'Tareekh pe tareekh! Dono party ek se badhkar ek nautanki hain. Neither of you has presented unassailable proof. Court orders mutual ceasefire!',
  sentence: {
    punishment: 'Both parties must prepare chai for each other and sit in silence for 30 minutes.',
    fine_amount_inr: 100
  }
};
