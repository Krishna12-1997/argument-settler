import { describe, it, expect } from "vitest";
import {
  GuardOutputSchema,
  CrossExamOutputSchema,
  VerdictOutputSchema,
  GuardRequestSchema,
  CrossExamRequestSchema,
  VerdictRequestSchema,
} from "../../src/schemas/court.schemas.js";

describe("Courtroom Zod Schemas Unit Tests", () => {
  describe("GuardOutputSchema", () => {
    it("accepts valid guardrail output for each of the 4 categories", () => {
      const safePayload = {
        classification: "safe",
        confidence: 0.98,
        reasoning: "Standard petty food dispute, no harm.",
      };
      const harmPayload = {
        classification: "serious_harm",
        confidence: 0.99,
        reasoning: "Threat of physical harm detected.",
        caring_response: "Please talk to someone who cares.",
      };
      const injectionPayload = {
        classification: "prompt_injection",
        confidence: 0.95,
        reasoning: "Attempted to override system prompt.",
      };
      const gibberishPayload = {
        classification: "gibberish",
        confidence: 0.91,
        reasoning: "Incomprehensible character smash.",
      };

      expect(GuardOutputSchema.safeParse(safePayload).success).toBe(true);
      expect(GuardOutputSchema.safeParse(harmPayload).success).toBe(true);
      expect(GuardOutputSchema.safeParse(injectionPayload).success).toBe(true);
      expect(GuardOutputSchema.safeParse(gibberishPayload).success).toBe(true);
    });

    it("rejects invalid classifications or non-number confidence", () => {
      const payload = {
        classification: "mildly_annoyed",
        confidence: "high",
        reasoning: "Invalid",
      };
      const result = GuardOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty object / missing required fields", () => {
      const result = GuardOutputSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("classification");
        expect(issues).toContain("reasoning");
      }
    });
  });

  describe("CrossExamOutputSchema", () => {
    it("accepts valid cross-examination output", () => {
      const payload = {
        party_a_question:
          "Party A, did you or did you not hoard the Maggi tastemaker?",
        party_b_question:
          "Party B, what is your scientific justification for calling Poha an emotion?",
        contested_issue_summary: "Breakfast sovereignty debate.",
      };
      const result = CrossExamOutputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contested_issue_summary).toBe(
          "Breakfast sovereignty debate.",
        );
      }
    });

    it("rejects invalid field types and too-short strings", () => {
      const payload = {
        party_a_question: "Why?",
        party_b_question: 12345,
        contested_issue_summary: false,
      };
      const result = CrossExamOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty object / missing fields", () => {
      const result = CrossExamOutputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("VerdictOutputSchema", () => {
    it("accepts a complete, valid verdict output", () => {
      const payload = {
        court_title: "In the High Court of Pettiness, New Delhi",
        winner: "PARTY_A",
        guilty_party: "PARTY_B",
        charges_proven: [
          "Culinary Treason",
          "First Degree Anniversary Negligence",
        ],
        dramatic_monologue:
          "Bhaisahab! Tareekh pe tareekh, lekin insaaf milke rahega. Making Poha on anniversary is criminal!",
        sentence: {
          punishment:
            "Party B must cook gourmet Maggi with cheese for 7 days consecutive.",
          fine_amount_inr: 250,
        },
      };
      const result = VerdictOutputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.winner).toBe("PARTY_A");
        expect(result.data.sentence.fine_amount_inr).toBe(250);
      }
    });

    it("rejects invalid winner enum values and negative fines", () => {
      const payload = {
        court_title: "Court of Pettiness",
        winner: "SUPERMAN",
        guilty_party: "PARTY_B",
        charges_proven: [],
        dramatic_monologue: "Short",
        sentence: {
          punishment: "Cook food",
          fine_amount_inr: -50,
        },
      };
      const result = VerdictOutputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = VerdictOutputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Request Schemas", () => {
    it("validates GuardRequestSchema constraints", () => {
      expect(
        GuardRequestSchema.safeParse({ text: "Valid dispute claim" }).success,
      ).toBe(true);
      expect(GuardRequestSchema.safeParse({ text: "" }).success).toBe(false);
      expect(GuardRequestSchema.safeParse({}).success).toBe(false);
    });

    it("validates CrossExamRequestSchema constraints", () => {
      const valid = {
        party_a_claim: "He took my chargers without permission.",
        party_b_claim: "She leaves the fan on all day long.",
      };
      const result = CrossExamRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.judge_name).toBe("Bhide");
      }

      expect(
        CrossExamRequestSchema.safeParse({
          party_a_claim: "a",
          party_b_claim: "b",
        }).success,
      ).toBe(false);
    });

    it("validates VerdictRequestSchema constraints", () => {
      const valid = {
        party_a_claim: "He took my chargers without permission.",
        party_b_claim: "She leaves the fan on all day long.",
        party_a_answer: "I only took it because mine was dead!",
        party_b_answer: "The fan keeps the room ventilated!",
      };
      expect(VerdictRequestSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        party_a_claim: "He took my chargers without permission.",
        party_b_claim: "She leaves the fan on all day long.",
      };
      expect(VerdictRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
