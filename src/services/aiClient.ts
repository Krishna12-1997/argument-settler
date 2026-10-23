import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getEnv } from "../config/env.js";
import {
  GuardOutput,
  CrossExamOutput,
  VerdictOutput
} from "../schemas/court.schemas.js";

export interface CallTelemetry {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  retried: boolean;
  usedFallback: boolean;
}

export interface AiResponse<T> {
  data: T;
  telemetry: CallTelemetry;
}

function cleanJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.substring(7);
  } else if (text.startsWith("```")) {
    text = text.substring(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

export class AiClient {
  private _client: Anthropic | null = null;

  private isDemoMode(): boolean {
    const key = getEnv().ANTHROPIC_API_KEY;
    return (
      !key ||
      key.startsWith("demo_") ||
      key.startsWith("mock") ||
      key.startsWith("test-")
    );
  }

  private get client(): Anthropic {
    if (!this._client) {
      this._client = new Anthropic({
        apiKey: getEnv().ANTHROPIC_API_KEY,
      });
    }
    return this._client;
  }

  // ==========================================
  // Simulated Offline Engine (Demo / No-Key Mode)
  // ==========================================
  private getSimulatedOutput(userPrompt: string): any {
    const lower = userPrompt.toLowerCase();

    // 1. Guardrail Simulation
    if (lower.includes("submission_text") || lower.includes("input_text")) {
      if (
        lower.includes("beat") ||
        lower.includes("kill") ||
        lower.includes("wrist") ||
        lower.includes("suicide") ||
        lower.includes("bleed") ||
        lower.includes("cleansed") ||
        lower.includes("slap")
      ) {
        const out: GuardOutput = {
          classification: "serious_harm",
          confidence: 0.99,
          reasoning: "Potential self-harm or violence threat detected.",
          caring_response:
            "It sounds like you or someone in your life is in pain. This courtroom game is meant for lighthearted petty jokes, not real distress. Please know you are not alone, and help is available.",
        };
        return out;
      }

      if (
        lower.includes("system") ||
        lower.includes("override") ||
        lower.includes("ignore") ||
        lower.includes("disregard") ||
        lower.includes("jailbreak")
      ) {
        const out: GuardOutput = {
          classification: "prompt_injection",
          confidence: 0.95,
          reasoning: "Adversarial instruction override attempt detected.",
          caring_response: null,
        };
        return out;
      }

      if (
        lower.includes("asdf") ||
        lower.includes("qwer") ||
        lower.includes("zxcv")
      ) {
        const out: GuardOutput = {
          classification: "gibberish",
          confidence: 0.92,
          reasoning: "Incomprehensible input characters.",
          caring_response: null,
        };
        return out;
      }

      const out: GuardOutput = {
        classification: "safe",
        confidence: 0.98,
        reasoning: "Everyday petty dispute, safe to proceed.",
        caring_response: null,
      };
      return out;
    }

    if (lower.includes("cross-examination") || lower.includes("party_b_claim")) {
      if (!lower.includes("party_a_cross_exam_answer")) {
        const out: CrossExamOutput = {
          party_a_question:
            "Party A, are you truly the victim of this dispute, or is this 90% emotional melodrama for the court?",
          party_b_question:
            "Party B, who appointed you the supreme culinary judge of this household?",
          contested_issue_summary:
            "Culinary sovereignty & unaddressed domestic grievances",
        };
        return out;
      }
    }

    const isHindi = lower.includes('"hindi"') || lower.includes("hindi courtroom");
    const isEnglish = lower.includes('"english"') || lower.includes("victorian");

    let monologue =
      "Bhaisahab! Tareekh pe tareekh, tareekh pe tareekh! Neither party has presented clean evidence. Making unilateral food decisions on an anniversary is an act of sheer domestic defiance. However, throwing a 3-day tantrum over Poha is equally unconstitutional! The bench decrees mutual ceasefire.";

    if (isHindi) {
      monologue =
        "मुल्जिम और शिकायतकर्ता दोनों की दलीलें बिल्कुल खोखली हैं! न्यायालय दोनों पक्षों की नौटंकी देखकर स्तब्ध है। पोहा और मैगी का यह झगड़ा सिर्फ अहम की लड़ाई है। अदालत दोनों पक्षों को शांति बनाए रखने का आदेश देती है!";
    } else if (isEnglish) {
      monologue =
        "Oyez, oyez! By the solemn majesty of this domestic tribunal, let it be known that unilateral breakfast imposition shall not stand unpunished! Both parties have displayed extraordinary stubbornness unworthy of civilized partnership.";
    }

    const out: VerdictOutput = {
      court_title: "In the High Court of Pettiness, Bench of Justice Bhide",
      winner: "SPLIT_FAULT",
      guilty_party: "BOTH",
      charges_proven: [
        "First-Degree Culinary Treason under Section 144 of Breakfast",
        "Premeditated Anniversary Amnesia",
      ],
      dramatic_monologue: monologue,
      sentence: {
        punishment:
          "Party B must prepare midnight Maggi with extra cheese for 3 nights, while Party A must say 'Dhanyavaad' with folded hands after every bite.",
        fine_amount_inr: 200,
      },
    };
    return out;
  }

  public async streamStructured<T>(options: {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    schema: z.ZodSchema<T>;
    fallback: T;
    onChunk: (delta: string) => void;
  }): Promise<AiResponse<T>> {
    const { model, systemPrompt, userPrompt, schema, fallback, onChunk } =
      options;
    const startTime = performance.now();

    // Offline Simulation Engine (Activates automatically when no paid API key is present)
    if (this.isDemoMode()) {
      const simulated = this.getSimulatedOutput(userPrompt);
      const validated = schema.safeParse(simulated);
      const data = validated.success ? validated.data : fallback;

      // Realistic typing stream simulation
      const textToStream =
        (data as any).dramatic_monologue || JSON.stringify(data);
      const words = textToStream.split(" ");
      for (const word of words) {
        onChunk(word + " ");
        await new Promise((r) => setTimeout(r, 25));
      }

      return {
        data,
        telemetry: {
          latencyMs: Math.round(performance.now() - startTime),
          inputTokens: 140,
          outputTokens: 85,
          model: "claude-3-5-sonnet (simulation)",
          retried: false,
          usedFallback: false,
        },
      };
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let accumulated = "";

    try {
      const stream = this.client.messages.stream({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          accumulated += event.delta.text;
          onChunk(event.delta.text);
        }
      }

      const finalMsg = await stream.finalMessage();
      totalInputTokens = finalMsg.usage?.input_tokens ?? 0;
      totalOutputTokens = finalMsg.usage?.output_tokens ?? 0;

      const parsedJson = JSON.parse(cleanJsonString(accumulated));
      const validated = schema.safeParse(parsedJson);

      if (validated.success) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          data: validated.data,
          telemetry: {
            latencyMs,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            model,
            retried: false,
            usedFallback: false,
          },
        };
      }
    } catch (err: any) {
      console.warn(
        `[AI Stream Validation Failed] ${err.message}. Retrying via structured fallback...`
      );
    }

    return this.callStructured(options);
  }

  public async callStructured<T>(options: {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    schema: z.ZodSchema<T>;
    fallback: T;
  }): Promise<AiResponse<T>> {
    const { model, systemPrompt, userPrompt, schema, fallback } = options;
    const startTime = performance.now();

    // Offline Simulation Engine (Activates automatically when no paid API key is present)
    if (this.isDemoMode()) {
      const simulated = this.getSimulatedOutput(userPrompt);
      const validated = schema.safeParse(simulated);
      const data = validated.success ? validated.data : fallback;
      return {
        data,
        telemetry: {
          latencyMs: 95,
          inputTokens: 110,
          outputTokens: 45,
          model: `${model} (simulation)`,
          retried: false,
          usedFallback: false,
        },
      };
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let retried = false;
    let usedFallback = false;

    const callModel = async (prompt: string, sys?: string) => {
      const resp = await this.client.messages.create({
        model,
        max_tokens: 1500,
        system: sys,
        messages: [{ role: "user", content: prompt }],
      });

      const inputTokens = resp.usage?.input_tokens ?? 0;
      const outputTokens = resp.usage?.output_tokens ?? 0;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;

      const firstBlock = resp.content[0];
      const text =
        firstBlock && firstBlock.type === "text" ? firstBlock.text : "";
      return text;
    };

    let rawText = "";
    try {
      rawText = await callModel(userPrompt, systemPrompt);
      const parsedJson = JSON.parse(cleanJsonString(rawText));
      const validated = schema.safeParse(parsedJson);

      if (validated.success) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          data: validated.data,
          telemetry: {
            latencyMs,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            model,
            retried: false,
            usedFallback: false,
          },
        };
      }
    } catch (err: any) {
      console.warn(`[AI Raw Parsing Failed] Error: ${err.message}. Retrying...`);
    }

    // 1x Repair Retry
    retried = true;
    try {
      const repairPrompt = `Your previous output did not conform to the expected JSON schema.
Please correct it and output strictly the valid raw JSON object without markdown or commentary.

Previous output:
${rawText}

Make sure all required fields are present and valid.`;

      const repairRaw = await callModel(repairPrompt, systemPrompt);
      const repairParsed = JSON.parse(cleanJsonString(repairRaw));
      const repairValidated = schema.safeParse(repairParsed);

      if (repairValidated.success) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          data: repairValidated.data,
          telemetry: {
            latencyMs,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            model,
            retried: true,
            usedFallback: false,
          },
        };
      }
    } catch (retryErr: any) {
      console.error(`[AI Retry Exception] ${retryErr.message}. Falling back.`);
    }

    // Graceful Fallback
    usedFallback = true;
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data: fallback,
      telemetry: {
        latencyMs,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        model,
        retried: true,
        usedFallback: true,
      },
    };
  }
}

export const aiClient = new AiClient();
