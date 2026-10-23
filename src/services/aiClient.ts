import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getEnv } from "../config/env.js";

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

  private get client(): Anthropic {
    if (!this._client) {
      this._client = new Anthropic({
        apiKey: getEnv().ANTHROPIC_API_KEY,
      });
    }
    return this._client;
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
      console.warn(`${err.message}. Retrying via structured fallback...`);
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
      } else {
        console.warn(
          `${validated.error.message}. Triggering 1x repair retry...`,
        );
      }
    } catch (err: any) {
      console.warn(`${err.message}. Triggering 1x repair retry...`);
    }

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
      console.error(`Falling back to default.`);
    } catch (retryErr: any) {
      console.error(`${retryErr.message}. Falling back.`);
    }

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
