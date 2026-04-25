/**
 * Agent Behavioral Fingerprinting & Drift Detection
 *
 * Learns each agent's "normal" behavioral signature and detects drift
 * caused by prompt injection, model updates, data shifts, or degradation.
 * Tracks response patterns, tool usage, latency profiles, decision distributions.
 */

// ─── Types ─────────────────────────────────

export interface BehavioralFingerprint {
  agentId: string;
  tenantId: string;
  baselineWindow: number; // ms of baseline data collected
  sampleCount: number;
  metrics: FingerprintMetrics;
  createdAt: number;
  updatedAt: number;
}

export interface FingerprintMetrics {
  avgLatencyMs: number;
  latencyStdDev: number;
  avgTokenUsage: number;
  tokenStdDev: number;
  avgConfidence: number;
  confidenceStdDev: number;
  toolUsageDistribution: Record<string, number>; // tool → frequency %
  outcomeDistribution: Record<string, number>;   // outcome → frequency %
  avgReasoningSteps: number;
  errorRate: number;
  avgCostUsd: number;
}

export interface DriftEvent {
  id: string;
  agentId: string;
  tenantId: string;
  timestamp: number;
  driftType: DriftType;
  severity: "info" | "warning" | "critical";
  metric: string;
  baselineValue: number;
  currentValue: number;
  deviationSigma: number;
  description: string;
  possibleCauses: string[];
  recommendedActions: string[];
  acknowledged: boolean;
}

export type DriftType =
  | "latency_spike"
  | "accuracy_drop"
  | "cost_anomaly"
  | "tool_usage_shift"
  | "confidence_drop"
  | "output_pattern_change"
  | "error_rate_spike"
  | "token_usage_anomaly";

export interface ExecutionSample {
  agentId: string;
  tenantId: string;
  timestamp: number;
  latencyMs: number;
  tokenUsage: number;
  confidence: number;
  toolsUsed: string[];
  outcome: string;
  reasoningSteps: number;
  costUsd: number;
  success: boolean;
}

export interface DriftReport {
  agentId: string;
  tenantId: string;
  generatedAt: number;
  fingerprint: BehavioralFingerprint | null;
  recentDrifts: DriftEvent[];
  healthScore: number; // 0-100
  status: "healthy" | "drifting" | "degraded" | "critical";
  recommendations: string[];
}

// ─── Drift Detection Engine ────────────────

export class DriftDetector {
  private fingerprints = new Map<string, BehavioralFingerprint>();
  private samples = new Map<string, ExecutionSample[]>(); // agentId → samples
  private driftEvents: DriftEvent[] = [];
  private thresholdSigma: number;

  constructor(thresholdSigma = 2.5) {
    this.thresholdSigma = thresholdSigma;
  }

  /**
   * Record an execution sample for fingerprinting
   */
  recordSample(sample: ExecutionSample): DriftEvent[] {
    const key = sample.agentId;
    const existing = this.samples.get(key) || [];
    existing.push(sample);

    // Keep last 1000 samples per agent
    if (existing.length > 1000) existing.shift();
    this.samples.set(key, existing);

    // Auto-build baseline after 20 samples
    if (existing.length === 20 && !this.fingerprints.has(key)) {
      this.buildBaseline(sample.agentId, sample.tenantId);
    }

    // Check for drift if baseline exists
    const fingerprint = this.fingerprints.get(key);
    if (fingerprint && existing.length > 20) {
      return this.detectDrift(sample, fingerprint);
    }

    return [];
  }

  /**
   * Build a behavioral baseline from collected samples
   */
  buildBaseline(agentId: string, tenantId: string): BehavioralFingerprint | null {
    const samples = this.samples.get(agentId);
    if (!samples || samples.length < 10) return null;

    const latencies = samples.map((s) => s.latencyMs);
    const tokens = samples.map((s) => s.tokenUsage);
    const confidences = samples.map((s) => s.confidence);
    const costs = samples.map((s) => s.costUsd);
    const steps = samples.map((s) => s.reasoningSteps);
    const errors = samples.filter((s) => !s.success).length;

    // Tool usage distribution
    const toolCounts: Record<string, number> = {};
    let totalToolUses = 0;
    for (const s of samples) {
      for (const tool of s.toolsUsed) {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        totalToolUses++;
      }
    }
    const toolUsageDistribution: Record<string, number> = {};
    for (const [tool, count] of Object.entries(toolCounts)) {
      toolUsageDistribution[tool] = totalToolUses > 0 ? count / totalToolUses : 0;
    }

    // Outcome distribution
    const outcomeCounts: Record<string, number> = {};
    for (const s of samples) {
      outcomeCounts[s.outcome] = (outcomeCounts[s.outcome] || 0) + 1;
    }
    const outcomeDistribution: Record<string, number> = {};
    for (const [outcome, count] of Object.entries(outcomeCounts)) {
      outcomeDistribution[outcome] = count / samples.length;
    }

    const fingerprint: BehavioralFingerprint = {
      agentId,
      tenantId,
      baselineWindow: (samples[samples.length - 1].timestamp - samples[0].timestamp),
      sampleCount: samples.length,
      metrics: {
        avgLatencyMs: mean(latencies),
        latencyStdDev: stdDev(latencies),
        avgTokenUsage: mean(tokens),
        tokenStdDev: stdDev(tokens),
        avgConfidence: mean(confidences),
        confidenceStdDev: stdDev(confidences),
        toolUsageDistribution,
        outcomeDistribution,
        avgReasoningSteps: mean(steps),
        errorRate: errors / samples.length,
        avgCostUsd: mean(costs),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.fingerprints.set(agentId, fingerprint);
    return fingerprint;
  }

  /**
   * Detect drift in a new sample against baseline
   */
  private detectDrift(sample: ExecutionSample, baseline: BehavioralFingerprint): DriftEvent[] {
    const events: DriftEvent[] = [];
    const m = baseline.metrics;

    // Latency drift
    if (m.latencyStdDev > 0) {
      const sigma = Math.abs(sample.latencyMs - m.avgLatencyMs) / m.latencyStdDev;
      if (sigma > this.thresholdSigma) {
        events.push(this.createDriftEvent(sample, "latency_spike", "latencyMs",
          m.avgLatencyMs, sample.latencyMs, sigma,
          `Latency ${sample.latencyMs}ms is ${sigma.toFixed(1)}σ from baseline ${m.avgLatencyMs.toFixed(0)}ms`,
          ["Model provider degradation", "Increased input complexity", "Resource contention"],
          ["Monitor for sustained latency increase", "Check LLM provider status page", "Review input data distribution"]
        ));
      }
    }

    // Token usage drift
    if (m.tokenStdDev > 0) {
      const sigma = Math.abs(sample.tokenUsage - m.avgTokenUsage) / m.tokenStdDev;
      if (sigma > this.thresholdSigma) {
        events.push(this.createDriftEvent(sample, "token_usage_anomaly", "tokenUsage",
          m.avgTokenUsage, sample.tokenUsage, sigma,
          `Token usage ${sample.tokenUsage} is ${sigma.toFixed(1)}σ from baseline ${m.avgTokenUsage.toFixed(0)}`,
          ["Prompt injection attempt", "Input data change", "System prompt modification"],
          ["Review agent system prompt for modifications", "Check for prompt injection in inputs", "Audit recent configuration changes"]
        ));
      }
    }

    // Confidence drift
    if (m.confidenceStdDev > 0 && sample.confidence < m.avgConfidence) {
      const sigma = (m.avgConfidence - sample.confidence) / m.confidenceStdDev;
      if (sigma > this.thresholdSigma) {
        events.push(this.createDriftEvent(sample, "confidence_drop", "confidence",
          m.avgConfidence, sample.confidence, sigma,
          `Confidence ${(sample.confidence * 100).toFixed(1)}% dropped ${sigma.toFixed(1)}σ below baseline ${(m.avgConfidence * 100).toFixed(1)}%`,
          ["Data distribution shift", "Model degradation", "Insufficient context"],
          ["Review recent input patterns", "Consider model retraining or prompt tuning", "Enable human review for low-confidence outputs"]
        ));
      }
    }

    // Cost anomaly
    if (m.avgCostUsd > 0) {
      const costStdDev = m.avgCostUsd * 0.3; // estimate if not tracked
      const sigma = Math.abs(sample.costUsd - m.avgCostUsd) / (costStdDev || 1);
      if (sigma > this.thresholdSigma && sample.costUsd > m.avgCostUsd * 2) {
        events.push(this.createDriftEvent(sample, "cost_anomaly", "costUsd",
          m.avgCostUsd, sample.costUsd, sigma,
          `Cost $${sample.costUsd.toFixed(4)} is ${(sample.costUsd / m.avgCostUsd).toFixed(1)}x baseline $${m.avgCostUsd.toFixed(4)}`,
          ["Reasoning loop detected", "Excessive tool calling", "Model pricing change"],
          ["Set cost limits per execution", "Review reasoning step count", "Check for infinite tool-call loops"]
        ));
      }
    }

    // Error rate check (rolling window)
    const recentSamples = (this.samples.get(sample.agentId) || []).slice(-20);
    const recentErrorRate = recentSamples.filter((s) => !s.success).length / recentSamples.length;
    if (recentErrorRate > m.errorRate * 3 && recentErrorRate > 0.1) {
      events.push(this.createDriftEvent(sample, "error_rate_spike", "errorRate",
        m.errorRate, recentErrorRate, (recentErrorRate - m.errorRate) / (m.errorRate || 0.01),
        `Error rate ${(recentErrorRate * 100).toFixed(1)}% vs baseline ${(m.errorRate * 100).toFixed(1)}%`,
        ["Upstream API failures", "Data format change", "Permission issues"],
        ["Check external service health", "Review error logs for patterns", "Test agent with known-good inputs"]
      ));
    }

    return events;
  }

  private createDriftEvent(
    sample: ExecutionSample, driftType: DriftType, metric: string,
    baselineValue: number, currentValue: number, deviationSigma: number,
    description: string, possibleCauses: string[], recommendedActions: string[]
  ): DriftEvent {
    const severity: DriftEvent["severity"] =
      deviationSigma > 4 ? "critical" :
      deviationSigma > 3 ? "warning" : "info";

    const event: DriftEvent = {
      id: `drift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId: sample.agentId,
      tenantId: sample.tenantId,
      timestamp: Date.now(),
      driftType,
      severity,
      metric,
      baselineValue,
      currentValue,
      deviationSigma: Math.round(deviationSigma * 10) / 10,
      description,
      possibleCauses,
      recommendedActions,
      acknowledged: false,
    };

    this.driftEvents.push(event);
    return event;
  }

  /**
   * Get drift report for an agent
   */
  getDriftReport(agentId: string, tenantId: string): DriftReport {
    const fingerprint = this.fingerprints.get(agentId) || null;
    const recentDrifts = this.driftEvents
      .filter((d) => d.agentId === agentId && d.tenantId === tenantId)
      .slice(-20)
      .reverse();

    const criticalCount = recentDrifts.filter((d) => d.severity === "critical" && !d.acknowledged).length;
    const warningCount = recentDrifts.filter((d) => d.severity === "warning" && !d.acknowledged).length;

    const healthScore = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);
    const status: DriftReport["status"] =
      healthScore >= 80 ? "healthy" :
      healthScore >= 50 ? "drifting" :
      healthScore >= 20 ? "degraded" : "critical";

    const recommendations: string[] = [];
    if (!fingerprint) {
      recommendations.push("Collect at least 20 execution samples to establish behavioral baseline");
    }
    if (criticalCount > 0) {
      recommendations.push("Investigate critical drift events immediately — possible prompt injection or model failure");
    }
    if (warningCount > 2) {
      recommendations.push("Multiple warnings detected — consider rebuilding agent baseline after investigating root cause");
    }

    return { agentId, tenantId, generatedAt: Date.now(), fingerprint, recentDrifts, healthScore, status, recommendations };
  }

  /**
   * Acknowledge a drift event
   */
  acknowledgeDrift(driftId: string): boolean {
    const event = this.driftEvents.find((d) => d.id === driftId);
    if (!event) return false;
    event.acknowledged = true;
    return true;
  }

  /**
   * Get all drift events for a tenant
   */
  getDriftEvents(tenantId: string, limit = 50): DriftEvent[] {
    return this.driftEvents
      .filter((d) => d.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get fingerprint for an agent
   */
  getFingerprint(agentId: string): BehavioralFingerprint | null {
    return this.fingerprints.get(agentId) || null;
  }

  /**
   * Reset baseline (e.g., after acknowledged model change)
   */
  resetBaseline(agentId: string): boolean {
    return this.fingerprints.delete(agentId);
  }
}

// ─── Math Helpers ───────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

// ─── Singleton ──────────────────────────────

let detector: DriftDetector | null = null;

export function getDriftDetector(): DriftDetector {
  if (!detector) {
    detector = new DriftDetector();
  }
  return detector;
}
