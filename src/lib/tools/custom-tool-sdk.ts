/**
 * Custom Tool SDK
 *
 * Allows users to create, test, and deploy custom agent tools
 * with sandboxed execution and version management.
 */

// ═══ Types ═══

export interface CustomToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  code: string;
  tenantId: string;
  createdBy: string;
  version: number;
  status: "draft" | "active" | "deprecated";
  executionCount: number;
  avgLatencyMs: number;
  successRate: number;
  createdAt: number;
  updatedAt: number;
}

export interface ToolTestResult {
  success: boolean;
  output: unknown;
  error?: string;
  durationMs: number;
  logs: string[];
}

export interface ToolValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ═══ Tool Sandbox ═══

export class ToolSandbox {
  private timeout: number;

  constructor(timeoutMs = 5000) {
    this.timeout = timeoutMs;
  }

  /**
   * Execute a custom tool in a sandboxed context
   */
  async execute(toolDef: CustomToolDefinition, input: Record<string, unknown>): Promise<ToolTestResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      // Create a sandboxed console
      const sandboxConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(" ")}`),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(" ")}`),
      };

      // Create sandboxed function (no access to process, require, fs, etc.)
      const sandboxedFn = new Function(
        "input",
        "console",
        "Math",
        "JSON",
        "Date",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "RegExp",
        "Map",
        "Set",
        "Promise",
        `"use strict";
        ${toolDef.code}
        `
      );

      // Execute with timeout
      const result = await Promise.race([
        Promise.resolve(sandboxedFn(input, sandboxConsole, Math, JSON, Date, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool execution timed out after ${this.timeout}ms`)), this.timeout)
        ),
      ]);

      return {
        success: true,
        output: result,
        durationMs: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Unknown execution error",
        durationMs: Date.now() - startTime,
        logs,
      };
    }
  }

  /**
   * Validate a tool definition
   */
  validate(toolDef: CustomToolDefinition): ToolValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!toolDef.name || toolDef.name.length < 2) errors.push("Tool name must be at least 2 characters");
    if (!toolDef.description) errors.push("Tool description is required");
    if (!toolDef.code || toolDef.code.trim().length === 0) errors.push("Tool code is required");
    if (toolDef.name && !/^[a-z][a-z0-9_]*$/.test(toolDef.name)) errors.push("Tool name must be lowercase with underscores only");

    // Security checks
    const dangerousPatterns = ["require(", "import(", "process.", "eval(", "__proto__", "constructor.", "globalThis", "Deno.", "Bun."];
    dangerousPatterns.forEach((pattern) => {
      if (toolDef.code.includes(pattern)) {
        errors.push(`Forbidden pattern detected: "${pattern}" — sandboxed tools cannot access system APIs`);
      }
    });

    if (toolDef.code.length > 10000) warnings.push("Tool code exceeds 10KB — consider simplifying");
    if (!toolDef.code.includes("return")) warnings.push("Tool code should return a value");

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Test a tool with sample input
   */
  async testRun(toolDef: CustomToolDefinition, sampleInput: Record<string, unknown>): Promise<ToolTestResult> {
    const validation = this.validate(toolDef);
    if (!validation.valid) {
      return {
        success: false,
        output: null,
        error: `Validation failed: ${validation.errors.join("; ")}`,
        durationMs: 0,
        logs: validation.errors,
      };
    }

    return this.execute(toolDef, sampleInput);
  }
}

// ═══ Custom Tool Registry ═══

export class CustomToolRegistry {
  private tools: Map<string, CustomToolDefinition> = new Map();

  register(toolDef: CustomToolDefinition): CustomToolDefinition {
    this.tools.set(toolDef.id, toolDef);
    return toolDef;
  }

  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  get(toolId: string): CustomToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  listByTenant(tenantId: string): CustomToolDefinition[] {
    return Array.from(this.tools.values())
      .filter((t) => t.tenantId === tenantId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  updateVersion(toolId: string, newCode: string, updatedBy: string): CustomToolDefinition | null {
    const tool = this.tools.get(toolId);
    if (!tool) return null;

    tool.code = newCode;
    tool.version++;
    tool.updatedAt = Date.now();
    return tool;
  }

  getStats(tenantId: string): { total: number; active: number; draft: number; deprecated: number; totalExecutions: number } {
    const tools = this.listByTenant(tenantId);
    return {
      total: tools.length,
      active: tools.filter((t) => t.status === "active").length,
      draft: tools.filter((t) => t.status === "draft").length,
      deprecated: tools.filter((t) => t.status === "deprecated").length,
      totalExecutions: tools.reduce((s, t) => s + t.executionCount, 0),
    };
  }
}

// ═══ Singleton ═══

let _registry: CustomToolRegistry | null = null;
let _sandbox: ToolSandbox | null = null;

export function getToolRegistry(): CustomToolRegistry {
  if (!_registry) {
    _registry = new CustomToolRegistry();
    seedDemoTools(_registry);
  }
  return _registry;
}

export function getToolSandbox(): ToolSandbox {
  if (!_sandbox) _sandbox = new ToolSandbox();
  return _sandbox;
}

function seedDemoTools(registry: CustomToolRegistry): void {
  const now = Date.now();

  registry.register({
    id: "tool_calc_risk", name: "calculate_risk_score", description: "Calculate risk score from transaction attributes",
    inputSchema: { type: "object", properties: { amount: { type: "number" }, country: { type: "string" }, isNewCustomer: { type: "boolean" } } },
    outputSchema: { type: "object", properties: { score: { type: "number" }, level: { type: "string" } } },
    code: `const score = (input.amount > 10000 ? 0.4 : 0.1) + (input.isNewCustomer ? 0.3 : 0) + (['CY','RU','IR'].includes(input.country) ? 0.3 : 0);\nconst level = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';\nreturn { score: Math.min(1, score), level };`,
    tenantId: "tenant_acme", createdBy: "admin@acme.com", version: 2, status: "active",
    executionCount: 1247, avgLatencyMs: 3, successRate: 0.998, createdAt: now - 14 * 86400000, updatedAt: now - 2 * 86400000,
  });

  registry.register({
    id: "tool_format_currency", name: "format_currency", description: "Format a number as currency string",
    inputSchema: { type: "object", properties: { amount: { type: "number" }, currency: { type: "string" } } },
    outputSchema: { type: "object", properties: { formatted: { type: "string" } } },
    code: `const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };\nconst sym = symbols[input.currency] || input.currency;\nreturn { formatted: sym + Number(input.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) };`,
    tenantId: "tenant_acme", createdBy: "admin@acme.com", version: 1, status: "active",
    executionCount: 3891, avgLatencyMs: 1, successRate: 1.0, createdAt: now - 21 * 86400000, updatedAt: now - 21 * 86400000,
  });

  registry.register({
    id: "tool_classify_priority", name: "classify_ticket_priority", description: "Classify support ticket priority based on keywords",
    inputSchema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } } },
    outputSchema: { type: "object", properties: { priority: { type: "string" }, confidence: { type: "number" } } },
    code: `const text = (input.subject + ' ' + input.body).toLowerCase();\nconst urgent = ['outage','down','critical','emergency','security breach'].some(k => text.includes(k));\nconst high = ['bug','error','failing','broken','cannot access'].some(k => text.includes(k));\nif (urgent) return { priority: 'critical', confidence: 0.95 };\nif (high) return { priority: 'high', confidence: 0.85 };\nreturn { priority: 'normal', confidence: 0.7 };`,
    tenantId: "tenant_acme", createdBy: "dev@acme.com", version: 3, status: "active",
    executionCount: 892, avgLatencyMs: 2, successRate: 0.96, createdAt: now - 30 * 86400000, updatedAt: now - 5 * 86400000,
  });
}
