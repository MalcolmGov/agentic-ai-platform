/**
 * Agent Self-Improvement Engine
 *
 * Tracks agent performance, suggests prompt optimizations,
 * and enables A/B testing between agent versions.
 */

// ═══ Types ═══

export interface PerformanceMetrics {
  successRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgTokens: number;
  totalExecutions: number;
  errorPatterns: ErrorPattern[];
  periodStart: number;
  periodEnd: number;
}

export interface ErrorPattern {
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  agentType: string;
}

export interface ImprovementSuggestion {
  id: string;
  agentId: string;
  type: "prompt_tune" | "parameter_adjust" | "tool_swap" | "model_upgrade" | "schedule_optimize";
  title: string;
  description: string;
  currentValue: string;
  suggestedValue: string;
  expectedImprovement: number;
  confidence: number;
  createdAt: number;
  status: "pending" | "applied" | "dismissed";
}

export interface ABTest {
  id: string;
  name: string;
  agentIdA: string;
  agentIdB: string;
  status: "running" | "completed" | "cancelled";
  totalRuns: number;
  completedRuns: number;
  resultsA: ABTestMetrics;
  resultsB: ABTestMetrics;
  winner: "A" | "B" | "tie" | null;
  startedAt: number;
  completedAt: number | null;
}

export interface ABTestMetrics {
  successCount: number;
  failCount: number;
  totalLatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
}

export interface ExecutionRecord {
  agentId: string;
  agentType: string;
  success: boolean;
  durationMs: number;
  costUsd: number;
  tokenUsage: number;
  error?: string;
  timestamp: number;
  promptVersion?: string;
}

export interface ImprovementHistory {
  id: string;
  agentId: string;
  suggestion: ImprovementSuggestion;
  appliedAt: number;
  metricsBefore: PerformanceMetrics;
  metricsAfter?: PerformanceMetrics;
  outcome: "improved" | "degraded" | "neutral" | "pending";
}

// ═══ Performance Tracker ═══

export class AgentPerformanceTracker {
  private executions: Map<string, ExecutionRecord[]> = new Map();

  trackExecution(record: ExecutionRecord): void {
    const records = this.executions.get(record.agentId) || [];
    records.push(record);
    this.executions.set(record.agentId, records);
  }

  getMetrics(agentId: string, windowMs = 7 * 86400000): PerformanceMetrics {
    const cutoff = Date.now() - windowMs;
    const records = (this.executions.get(agentId) || []).filter((r) => r.timestamp >= cutoff);

    if (records.length === 0) {
      return {
        successRate: 0, avgLatencyMs: 0, avgCostUsd: 0, avgTokens: 0,
        totalExecutions: 0, errorPatterns: [], periodStart: cutoff, periodEnd: Date.now(),
      };
    }

    const successful = records.filter((r) => r.success);
    const errors = records.filter((r) => !r.success);

    // Group error patterns
    const errorMap: Record<string, ErrorPattern> = {};
    errors.forEach((e) => {
      const key = e.error || "Unknown error";
      if (!errorMap[key]) {
        errorMap[key] = { message: key, count: 0, firstSeen: e.timestamp, lastSeen: e.timestamp, agentType: e.agentType };
      }
      errorMap[key].count++;
      errorMap[key].lastSeen = Math.max(errorMap[key].lastSeen, e.timestamp);
    });

    return {
      successRate: successful.length / records.length,
      avgLatencyMs: records.reduce((s, r) => s + r.durationMs, 0) / records.length,
      avgCostUsd: records.reduce((s, r) => s + r.costUsd, 0) / records.length,
      avgTokens: records.reduce((s, r) => s + r.tokenUsage, 0) / records.length,
      totalExecutions: records.length,
      errorPatterns: Object.values(errorMap).sort((a, b) => b.count - a.count),
      periodStart: cutoff,
      periodEnd: Date.now(),
    };
  }

  getMetricsTrend(agentId: string, buckets = 7): PerformanceMetrics[] {
    const windowMs = 7 * 86400000;
    const bucketSize = windowMs / buckets;
    const now = Date.now();
    const trend: PerformanceMetrics[] = [];

    for (let i = buckets - 1; i >= 0; i--) {
      const end = now - i * bucketSize;
      const start = end - bucketSize;
      const records = (this.executions.get(agentId) || []).filter(
        (r) => r.timestamp >= start && r.timestamp < end
      );

      if (records.length === 0) {
        trend.push({
          successRate: 0, avgLatencyMs: 0, avgCostUsd: 0, avgTokens: 0,
          totalExecutions: 0, errorPatterns: [], periodStart: start, periodEnd: end,
        });
      } else {
        trend.push({
          successRate: records.filter((r) => r.success).length / records.length,
          avgLatencyMs: records.reduce((s, r) => s + r.durationMs, 0) / records.length,
          avgCostUsd: records.reduce((s, r) => s + r.costUsd, 0) / records.length,
          avgTokens: records.reduce((s, r) => s + r.tokenUsage, 0) / records.length,
          totalExecutions: records.length,
          errorPatterns: [],
          periodStart: start,
          periodEnd: end,
        });
      }
    }

    return trend;
  }

  getAllAgentIds(): string[] {
    return Array.from(this.executions.keys());
  }
}

// ═══ Prompt Optimizer ═══

export class PromptOptimizer {
  suggestImprovements(agentId: string, metrics: PerformanceMetrics): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Low success rate → prompt refinement
    if (metrics.successRate < 0.95 && metrics.totalExecutions > 10) {
      suggestions.push({
        id: `sug_${Date.now()}_prompt`,
        agentId,
        type: "prompt_tune",
        title: "Refine System Prompt for Higher Accuracy",
        description: `Success rate is ${(metrics.successRate * 100).toFixed(1)}%. Top error: "${metrics.errorPatterns[0]?.message || "Unknown"}". Adding explicit error handling instructions and output format constraints to the system prompt may improve reliability.`,
        currentValue: "Current system prompt",
        suggestedValue: "Add: 'If uncertain, request clarification rather than guessing. Always validate output format before responding.'",
        expectedImprovement: 8,
        confidence: 0.75,
        createdAt: Date.now(),
        status: "pending",
      });
    }

    // High latency → model downgrade for simple tasks
    if (metrics.avgLatencyMs > 10000) {
      suggestions.push({
        id: `sug_${Date.now()}_model`,
        agentId,
        type: "model_upgrade",
        title: "Optimize Model Selection for Speed",
        description: `Average latency is ${Math.round(metrics.avgLatencyMs)}ms. Consider using GPT-4o-mini for initial triage and only escalating complex cases to GPT-4o.`,
        currentValue: "gpt-4o (all tasks)",
        suggestedValue: "gpt-4o-mini (triage) → gpt-4o (complex only)",
        expectedImprovement: 40,
        confidence: 0.82,
        createdAt: Date.now(),
        status: "pending",
      });
    }

    // High cost → parameter tuning
    if (metrics.avgCostUsd > 0.05) {
      suggestions.push({
        id: `sug_${Date.now()}_param`,
        agentId,
        type: "parameter_adjust",
        title: "Reduce Token Usage with Tighter Constraints",
        description: `Average cost per execution is $${metrics.avgCostUsd.toFixed(3)} (${Math.round(metrics.avgTokens)} tokens). Reducing max_tokens and adding concise output instructions could cut costs by 25%.`,
        currentValue: `~${Math.round(metrics.avgTokens)} tokens/execution`,
        suggestedValue: `~${Math.round(metrics.avgTokens * 0.7)} tokens/execution`,
        expectedImprovement: 25,
        confidence: 0.7,
        createdAt: Date.now(),
        status: "pending",
      });
    }

    // Recurring errors → tool swap
    if (metrics.errorPatterns.length > 0 && metrics.errorPatterns[0].count > 5) {
      suggestions.push({
        id: `sug_${Date.now()}_tool`,
        agentId,
        type: "tool_swap",
        title: "Replace Failing Tool Integration",
        description: `Tool errors account for ${metrics.errorPatterns[0].count} failures: "${metrics.errorPatterns[0].message}". Consider switching to an alternative tool or adding retry logic.`,
        currentValue: "Current tool configuration",
        suggestedValue: "Add exponential backoff retry (3 attempts) or fallback tool",
        expectedImprovement: 15,
        confidence: 0.68,
        createdAt: Date.now(),
        status: "pending",
      });
    }

    return suggestions;
  }
}

// ═══ A/B Tester ═══

export class AgentABTester {
  private tests: Map<string, ABTest> = new Map();

  createTest(name: string, agentIdA: string, agentIdB: string, totalRuns = 100): ABTest {
    const test: ABTest = {
      id: `abtest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      agentIdA,
      agentIdB,
      status: "running",
      totalRuns,
      completedRuns: 0,
      resultsA: { successCount: 0, failCount: 0, totalLatencyMs: 0, totalCostUsd: 0, totalTokens: 0 },
      resultsB: { successCount: 0, failCount: 0, totalLatencyMs: 0, totalCostUsd: 0, totalTokens: 0 },
      winner: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    this.tests.set(test.id, test);
    return test;
  }

  recordResult(testId: string, variant: "A" | "B", result: { success: boolean; latencyMs: number; costUsd: number; tokens: number }): void {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") return;

    const metrics = variant === "A" ? test.resultsA : test.resultsB;
    if (result.success) metrics.successCount++;
    else metrics.failCount++;
    metrics.totalLatencyMs += result.latencyMs;
    metrics.totalCostUsd += result.costUsd;
    metrics.totalTokens += result.tokens;

    test.completedRuns++;

    if (test.completedRuns >= test.totalRuns) {
      this.finalizeTest(testId);
    }
  }

  private finalizeTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) return;

    test.status = "completed";
    test.completedAt = Date.now();

    const totalA = test.resultsA.successCount + test.resultsA.failCount;
    const totalB = test.resultsB.successCount + test.resultsB.failCount;
    const rateA = totalA > 0 ? test.resultsA.successCount / totalA : 0;
    const rateB = totalB > 0 ? test.resultsB.successCount / totalB : 0;

    if (Math.abs(rateA - rateB) < 0.02) test.winner = "tie";
    else test.winner = rateA > rateB ? "A" : "B";
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  listTests(): ABTest[] {
    return Array.from(this.tests.values()).sort((a, b) => b.startedAt - a.startedAt);
  }
}

// ═══ Singleton Instances ═══

let _tracker: AgentPerformanceTracker | null = null;
let _optimizer: PromptOptimizer | null = null;
let _abTester: AgentABTester | null = null;

export function getPerformanceTracker(): AgentPerformanceTracker {
  if (!_tracker) {
    _tracker = new AgentPerformanceTracker();
    seedPerformanceData(_tracker);
  }
  return _tracker;
}

export function getPromptOptimizer(): PromptOptimizer {
  if (!_optimizer) _optimizer = new PromptOptimizer();
  return _optimizer;
}

export function getABTester(): AgentABTester {
  if (!_abTester) _abTester = new AgentABTester();
  return _abTester;
}

function seedPerformanceData(tracker: AgentPerformanceTracker): void {
  const agents = [
    { id: "agent_fraud_001", type: "FRAUD_MONITORING", errorRate: 0.02 },
    { id: "agent_compliance_001", type: "COMPLIANCE", errorRate: 0.04 },
    { id: "agent_support_001", type: "CUSTOMER_SUPPORT", errorRate: 0.07 },
    { id: "agent_reporting_001", type: "REPORTING", errorRate: 0.01 },
  ];

  const errors = ["Tool timeout: db_query exceeded 30s", "LLM rate limit exceeded", "Invalid output format", "Memory recall returned empty"];
  const now = Date.now();

  for (const agent of agents) {
    for (let i = 0; i < 120; i++) {
      const hoursAgo = Math.random() * 168;
      const success = Math.random() > agent.errorRate;
      tracker.trackExecution({
        agentId: agent.id,
        agentType: agent.type,
        success,
        durationMs: 2000 + Math.random() * 12000 + (agent.type === "COMPLIANCE" ? 4000 : 0),
        costUsd: 0.01 + Math.random() * 0.06,
        tokenUsage: 800 + Math.random() * 2500,
        error: success ? undefined : errors[Math.floor(Math.random() * errors.length)],
        timestamp: now - hoursAgo * 3600000,
      });
    }
  }
}
