/**
 * LLM Gateway — Unified interface for language model calls
 * 
 * Supports OpenAI-compatible APIs (OpenAI, Azure, local models).
 * Features: streaming, retries, token tracking, cost estimation.
 */

import OpenAI from "openai";
import { env } from "@/lib/config/env";

// ─── Types ─────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface LLMToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMCompletionRequest {
  model?: string;
  messages: LLMMessage[];
  tools?: LLMToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface LLMCompletionResponse {
  content: string | null;
  toolCalls: LLMToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  model: string;
  finishReason: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: string;
}

// ─── Pricing (per 1M tokens) ──────────────

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o":       { input: 2.50, output: 10.00 },
  "gpt-4o-mini":  { input: 0.15, output: 0.60 },
  "gpt-4-turbo":  { input: 10.00, output: 30.00 },
  "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  "o1":           { input: 15.00, output: 60.00 },
  "o1-mini":      { input: 3.00, output: 12.00 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o-mini"];
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
}

// ─── Client Management ────────────────────

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new LLMError("OPENAI_API_KEY not configured");
    }
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ─── Main Completion Function ─────────────

export async function complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
  const client = getClient();
  const model = request.model || "gpt-4o-mini";

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: request.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 2048,
  };

  if (request.tools && request.tools.length > 0) {
    params.tools = request.tools as OpenAI.Chat.ChatCompletionTool[];
    params.tool_choice = "auto";
  }

  if (request.responseFormat === "json") {
    params.response_format = { type: "json_object" };
  }

  // Retry logic
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create(params);

      const choice = response.choices[0];
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      return {
        content: choice.message.content,
        toolCalls: (choice.message.tool_calls || []).map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        })),
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        costUsd: estimateCost(model, usage.prompt_tokens, usage.completion_tokens),
        model,
        finishReason: choice.finish_reason || "stop",
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[LLM] Attempt ${attempt + 1} failed:`, (error as Error).message);

      // Retry on rate limits and server errors
      if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.InternalServerError) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new LLMError("Max retries exceeded");
}

// ─── Agent ReAct Loop ─────────────────────

/**
 * Execute a ReAct-style reasoning loop:
 * Think → Act (tool call) → Observe → Repeat
 */
export async function reasonAndAct(
  systemPrompt: string,
  userMessage: string,
  tools: LLMToolDefinition[],
  toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  options: { model?: string; maxIterations?: number } = {}
): Promise<{
  finalResponse: string;
  steps: Array<{ type: "thought" | "tool_call" | "observation"; content: string }>;
  totalTokens: number;
  totalCost: number;
}> {
  const maxIterations = options.maxIterations || 5;
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
  const steps: Array<{ type: "thought" | "tool_call" | "observation"; content: string }> = [];
  let totalTokens = 0;
  let totalCost = 0;

  for (let i = 0; i < maxIterations; i++) {
    const response = await complete({
      model: options.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    totalTokens += response.usage.totalTokens;
    totalCost += response.costUsd;

    // No tool calls → final answer
    if (response.toolCalls.length === 0 || response.finishReason === "stop") {
      const finalContent = response.content || "No response generated";
      steps.push({ type: "thought", content: finalContent });
      return { finalResponse: finalContent, steps, totalTokens, totalCost };
    }

    // Process tool calls
    if (response.content) {
      steps.push({ type: "thought", content: response.content });
      messages.push({ role: "assistant", content: response.content });
    }

    for (const toolCall of response.toolCalls) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(toolCall.arguments);
      } catch {
        args = {};
      }

      steps.push({
        type: "tool_call",
        content: `${toolCall.name}(${JSON.stringify(args)})`,
      });

      // Execute the tool
      let result: unknown;
      try {
        result = await toolExecutor(toolCall.name, args);
      } catch (error) {
        result = { error: (error as Error).message };
      }

      const observation = typeof result === "string" ? result : JSON.stringify(result);
      steps.push({ type: "observation", content: observation });

      messages.push({
        role: "tool",
        content: observation,
        tool_call_id: toolCall.id,
      });
    }
  }

  // Max iterations reached
  const fallback = await complete({ model: options.model, messages });
  totalTokens += fallback.usage.totalTokens;
  totalCost += fallback.costUsd;

  return {
    finalResponse: fallback.content || "Agent reached max reasoning iterations",
    steps,
    totalTokens,
    totalCost,
  };
}

// ─── Error Class ──────────────────────────

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}
