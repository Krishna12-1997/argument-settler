import { describe, it, expect } from "vitest";
import {
  GuardOutputSchema,
  GuardClassificationEnum,
} from "../../src/schemas/court.schemas.js";

describe("Guardrail 4-Category Multi-Label Triage", () => {
  it("validates all four allowed classification enum values", () => {
    expect(GuardClassificationEnum.options).toEqual([
      "safe",
      "serious_harm",
      "prompt_injection",
      "gibberish",
    ]);
  });

  describe("Category 1: safe", () => {
    it("accepts humorous food and domestic squabbles", () => {
      const output = {
        classification: "safe",
        confidence: 0.99,
        reasoning: "Everyday petty argument about Maggi vs Poha.",
      };
      const parsed = GuardOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.classification).toBe("safe");
      }
    });
  });

  describe("Category 2: serious_harm", () => {
    it("accepts abuse/harm classification with a compassionate caring response", () => {
      const output = {
        classification: "serious_harm",
        confidence: 0.98,
        reasoning: "Explicit threat of physical battery detected.",
        caring_response:
          "We noticed signs of genuine distress. Please speak with a trusted friend or helpline.",
      };
      const parsed = GuardOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.classification).toBe("serious_harm");
        expect(parsed.data.caring_response).toContain("helpline");
      }
    });
  });

  describe("Category 3: prompt_injection", () => {
    it("accepts prompt injection classification without crashing", () => {
      const output = {
        classification: "prompt_injection",
        confidence: 0.94,
        reasoning: "Input attempts to inject system delimiter instructions.",
      };
      const parsed = GuardOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.classification).toBe("prompt_injection");
      }
    });
  });

  describe("Category 4: gibberish", () => {
    it("accepts gibberish classification for keyboard smashes", () => {
      const output = {
        classification: "gibberish",
        confidence: 0.97,
        reasoning: "String has zero intelligible words or claims.",
      };
      const parsed = GuardOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.classification).toBe("gibberish");
      }
    });
  });

  describe("Invalid cases", () => {
    it("rejects unrecognized categories", () => {
      const output = {
        classification: "mildly_annoyed",
        confidence: 0.8,
        reasoning: "Not a real category",
      };
      expect(GuardOutputSchema.safeParse(output).success).toBe(false);
    });

    it("rejects out of bounds confidence scores", () => {
      expect(
        GuardOutputSchema.safeParse({
          classification: "safe",
          confidence: 1.5,
          reasoning: "Invalid confidence",
        }).success,
      ).toBe(false);

      expect(
        GuardOutputSchema.safeParse({
          classification: "safe",
          confidence: -0.2,
          reasoning: "Invalid confidence",
        }).success,
      ).toBe(false);
    });
  });
});
