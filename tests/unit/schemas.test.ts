import { describe, it, expect } from 'vitest';
import {
  GuardOutputSchema,
  CrossExamOutputSchema,
  VerdictOutputSchema,
  GuardRequestSchema,
  CrossExamRequestSchema,
  VerdictRequestSchema
} from '../../src/schemas/court.schemas.js';

describe('Courtroom Zod Schemas Unit Tests', () => {

  // 1. Guard Output Schema
  describe('GuardOutputSchema', () => {
    it('accepts valid guardrail output', () => {
      const payload = {
        is_safe: true,
        flagged_categories: [],
        reasoning: 'Standard petty domestic disagreement, no violence.'
      };
      const result = GuardOutputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_safe).toBe(true);
      }
    });

    it('rejects invalid data types', () => {
      const payload = {
        is_safe: 'yes', // should be boolean
        flagged_categories: 'harassment', // should be array
        reasoning: 404
      };
      const result = GuardOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty object / missing required fields', () => {
      const result = GuardOutputSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain('is_safe');
        expect(issues).toContain('flagged_categories');
        expect(issues).toContain('reasoning');
      }
    });
  });

  // 2. Cross-Exam Output Schema
  describe('CrossExamOutputSchema', () => {
    it('accepts valid cross-examination output', () => {
      const payload = {
        party_a_question: 'Party A, did you or did you not hoard the Maggi tastemaker?',
        party_b_question: 'Party B, what is your scientific justification for calling Poha an emotion?',
        contested_issue_summary: 'Breakfast sovereignty debate.'
      };
      const result = CrossExamOutputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contested_issue_summary).toBe('Breakfast sovereignty debate.');
      }
    });

    it('rejects invalid field types and too-short strings', () => {
      const payload = {
        party_a_question: 'Why?', // too short (< 5 chars)
        party_b_question: 12345, // invalid type
        contested_issue_summary: false
      };
      const result = CrossExamOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty object / missing fields', () => {
      const result = CrossExamOutputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // 3. Verdict Output Schema
  describe('VerdictOutputSchema', () => {
    it('accepts a complete, valid verdict output', () => {
      const payload = {
        court_title: 'In the High Court of Pettiness, New Delhi',
        winner: 'PARTY_A',
        guilty_party: 'PARTY_B',
        charges_proven: ['Culinary Treason', 'First Degree Anniversary Negligence'],
        dramatic_monologue: 'Bhaisahab! Tareekh pe tareekh, lekin insaaf milke rahega. Making Poha on anniversary is criminal!',
        sentence: {
          punishment: 'Party B must cook gourmet Maggi with cheese for 7 days consecutive.',
          fine_amount_inr: 250
        }
      };
      const result = VerdictOutputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.winner).toBe('PARTY_A');
        expect(result.data.sentence.fine_amount_inr).toBe(250);
      }
    });

    it('rejects invalid winner enum values and negative fines', () => {
      const payload = {
        court_title: 'Court of Pettiness',
        winner: 'SUPERMAN', // not in enum
        guilty_party: 'PARTY_B',
        charges_proven: [], // requires at least 1
        dramatic_monologue: 'Short', // requires min 10 chars
        sentence: {
          punishment: 'Cook food',
          fine_amount_inr: -50 // non-negative required
        }
      };
      const result = VerdictOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty object', () => {
      const result = VerdictOutputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // 4. Request Validation Schemas
  describe('Request Schemas', () => {
    it('validates GuardRequestSchema constraints', () => {
      expect(GuardRequestSchema.safeParse({ text: 'Valid dispute claim' }).success).toBe(true);
      expect(GuardRequestSchema.safeParse({ text: '' }).success).toBe(false);
      expect(GuardRequestSchema.safeParse({}).success).toBe(false);
    });

    it('validates CrossExamRequestSchema constraints', () => {
      const valid = {
        party_a_claim: 'He took my chargers without permission.',
        party_b_claim: 'She leaves the fan on all day long.'
      };
      const result = CrossExamRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.judge_name).toBe('Bhide'); // default applied
      }

      // claim too short
      expect(CrossExamRequestSchema.safeParse({ party_a_claim: 'a', party_b_claim: 'b' }).success).toBe(false);
    });

    it('validates VerdictRequestSchema constraints', () => {
      const valid = {
        party_a_claim: 'He took my chargers without permission.',
        party_b_claim: 'She leaves the fan on all day long.',
        party_a_answer: 'I only took it because mine was dead!',
        party_b_answer: 'The fan keeps the room ventilated!'
      };
      expect(VerdictRequestSchema.safeParse(valid).success).toBe(true);

      // missing answers
      const invalid = {
        party_a_claim: 'He took my chargers without permission.',
        party_b_claim: 'She leaves the fan on all day long.'
      };
      expect(VerdictRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
