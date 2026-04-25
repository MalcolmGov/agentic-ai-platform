/**
 * Multi-Model Router
 *
 * Routes agent tasks to the optimal LLM based on task type,
 * cost constraints, and performance requirements.
 */

// ═══ Types ═══

export type TaskType = "analysis" | "writing" | "code" | "classification" | "extraction" | "summarization" | "reasoning" | "conversation";

export interface ModelRoute {
  taskType: TaskType;
  model: string;
  provider: string;
  costPer1kTokens: number;
  qualityScore: number;
  avgLatencyMs: number;
  maxTokens: number;
}

export interface RoutingDecision {
  taskType: TaskType;
  selectedModel: string;
  selectedProvider: string;
  reason: string;
  estimatedCost: number;
  estimatedLatencyMs: number;
}

export interface ModelPerformance {
  model: string;
  provider: string;
  taskType: TaskType;
  successRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  totalExecutions: number;
}

export interface CostComparison {
  taskType: TaskType;
  models: {
    model: string;
    provider: string;
    estimatedCost: number;
    qualityScore: number;
    costEfficiency: number;
  }[];
  recommendation: string;
}

// ═══ Multi-Model Router ═══

export class MultiModelRouter {
  private routes: Map<TaskType, ModelRoute> = new Map();
  private performanceHistory: ModelPerformance[] = [];

  constructor() {
    this.loadDefaultRoutes();
  }

  private loadDefaultRoutes(): void {
    const defaults: ModelRoute[] = [
      { taskType: "analysis", model: "gpt-4o", provider: "openai", costPer1kTokens: 0.0025, qualityScore: 0.95, avgLatencyMs: 3000, maxTokens: 4096 },
      { taskType: "writing", model: "claude-sonnet-4-6", provider: "anthropic", costPer1kTokens: 0.003, qualityScore: 0.97, avgLatencyMs: 2500, maxTokens: 4096 },
      { taskType: "code", model: "claude-sonnet-4-6", provider: "anthropic", costPer1kTokens: 0.003, qualityScore: 0.96, avgLatencyMs: 2800, maxTokens: 4096 },
      { taskType: "classification", model: "gpt-4o-mini", provider: "openai", costPer1kTokens: 0.00015, qualityScore: 0.88, avgLatencyMs: 800, maxTokens: 1024 },
      { taskType: "extraction", model: "gpt-4o-mini", provider: "openai", costPer1kTokens: 0.00015, qualityScore: 0.90, avgLatencyMs: 900, maxTokens: 2048 },
      { taskType: "summarization", model: "gpt-4o-mini", provider: "openai", costPer1kTokens: 0.00015, qualityScore: 0.87, avgLatencyMs: 1000, maxTokens: 2048 },
      { taskType: "reasoning", model: "claude-opus-4-6", provider: "anthropic", costPer1kTokens: 0.015, qualityScore: 0.99, avgLatencyMs: 8000, maxTokens: 4096 },
      { taskType: "conversation", model: "gpt-4o", provider: "openai", costPer1kTokens: 0.0025, qualityScore: 0.93, avgLatencyMs: 1500, maxTokens: 4096 },
    ];

    defaults.forEach((r) => this.routes.set(r.taskType, r));
  }

  /**
   * Route a task to the best model
   */
  routeTask(taskType: TaskType, options?: { preferCost?: boolean; preferQuality?: boolean; preferSpeed?: boolean }): RoutingDecision {
    const route = this.routes.get(taskType);
    if (!route) {
      // Default to GPT-4o
      return {
        taskType,
        selectedModel: "gpt-4o",
        selectedProvider: "openai",
        reason: "Default route — no specific routing rule configured",
        estimatedCost: 0.0025,
        estimatedLatencyMs: 3000,
      };
    }

    let reason = `Optimized for ${taskType}`;
    if (options?.preferCost) reason += " (cost-optimized)";
    if (options?.preferQuality) reason += " (quality-optimized)";
    if (options?.preferSpeed) reason += " (speed-optimized)";

    return {
      taskType,
      selectedModel: route.model,
      selectedProvider: route.provider,
      reason,
      estimatedCost: route.costPer1kTokens,
      estimatedLatencyMs: route.avgLatencyMs,
    };
  }

  /**
   * Add or update a routing rule
   */
  addRoute(route: ModelRoute): void {
    this.routes.set(route.taskType, route);
  }

  /**
   * Remove a routing rule
   */
  removeRoute(taskType: TaskType): boolean {
    return this.routes.delete(taskType);
  }

  /**
   * Get all routing rules
   */
  getRoutes(): ModelRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Estimate cost for a task
   */
  estimateCost(taskType: TaskType, estimatedTokens: number): { model: string; estimatedCost: number; perToken: number } {
    const route = this.routes.get(taskType);
    if (!route) return { model: "gpt-4o", estimatedCost: (estimatedTokens / 1000) * 0.0025, perToken: 0.0000025 };

    return {
      model: route.model,
      estimatedCost: (estimatedTokens / 1000) * route.costPer1kTokens,
      perToken: route.costPer1kTokens / 1000,
    };
  }

  /**
   * Compare costs across all configured models for a task type
   */
  compareCosts(taskType: TaskType, estimatedTokens = 1000): CostComparison {
    const allModels = Array.from(this.routes.values());
    const models = allModels.map((r) => ({
      model: r.model,
      provider: r.provider,
      estimatedCost: (estimatedTokens / 1000) * r.costPer1kTokens,
      qualityScore: r.qualityScore,
      costEfficiency: r.qualityScore / r.costPer1kTokens,
    }));

    const sorted = [...models].sort((a, b) => b.costEfficiency - a.costEfficiency);
    const recommendation = sorted[0]
      ? `${sorted[0].model} offers the best quality-to-cost ratio for ${taskType}`
      : "No models configured";

    return { taskType, models, recommendation };
  }

  /**
   * Record performance for auto-optimization
   */
  recordPerformance(perf: ModelPerformance): void {
    this.performanceHistory.push(perf);
  }

  /**
   * Auto-optimize routes based on performance history
   */
  optimizeRoutes(): { changes: string[] } {
    const changes: string[] = [];

    this.routes.forEach((route, taskType) => {
      const history = this.performanceHistory.filter(
        (p) => p.taskType === taskType && p.totalExecutions > 10
      );

      if (history.length === 0) return;

      const currentPerf = history.find((p) => p.model === route.model);
      const better = history.find(
        (p) => p.model !== route.model && p.successRate > (currentPerf?.successRate || 0) * 1.05
      );

      if (better) {
        changes.push(`${taskType}: Consider switching from ${route.model} to ${better.model} (${(better.successRate * 100).toFixed(1)}% vs ${((currentPerf?.successRate || 0) * 100).toFixed(1)}% success rate)`);
      }
    });

    return { changes };
  }
}

// ═══ Singleton ═══

let _router: MultiModelRouter | null = null;

export function getModelRouter(): MultiModelRouter {
  if (!_router) _router = new MultiModelRouter();
  return _router;
}
