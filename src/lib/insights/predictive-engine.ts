/**
 * Predictive Insights Engine — "Crystal Ball"
 *
 * Analyzes agent execution patterns, detects anomalies,
 * forecasts trends, and generates actionable insights.
 */

// ═══ Types ═══

export interface ExecutionDataPoint {
  timestamp: number;
  agentId: string;
  agentType: string;
  success: boolean;
  durationMs: number;
  tokenUsage: number;
  costUsd: number;
  tenantId: string;
}

export interface TrendData {
  metric: string;
  values: number[];
  timestamps: number[];
  direction: "up" | "down" | "stable";
  changePercent: number;
}

export interface Anomaly {
  id: string;
  metric: string;
  agentId?: string;
  severity: "info" | "warning" | "critical";
  value: number;
  expected: number;
  deviation: number;
  detectedAt: number;
  description: string;
}

export interface Prediction {
  id: string;
  metric: string;
  agentId?: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  horizon: string;
  direction: "up" | "down" | "stable";
  description: string;
  generatedAt: number;
}

export interface Insight {
  id: string;
  type: "optimization" | "risk" | "opportunity" | "trend";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  generatedAt: number;
}

export interface ForecastResult {
  metric: string;
  historical: number[];
  forecasted: number[];
  upperBound: number[];
  lowerBound: number[];
  confidence: number;
}

export interface WhatIfScenario {
  name: string;
  modifications: Record<string, number>;
  description: string;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  projections: Record<string, { current: number; projected: number; change: number }>;
  risks: string[];
  opportunities: string[];
}

// ═══ Execution Pattern Analyzer ═══

export class ExecutionPatternAnalyzer {
  private dataPoints: ExecutionDataPoint[] = [];

  addDataPoint(point: ExecutionDataPoint): void {
    this.dataPoints.push(point);
  }

  addBatch(points: ExecutionDataPoint[]): void {
    this.dataPoints.push(...points);
  }

  getSuccessRate(agentId?: string, windowMs = 86400000): number {
    const cutoff = Date.now() - windowMs;
    const filtered = this.dataPoints.filter(
      (d) => d.timestamp >= cutoff && (!agentId || d.agentId === agentId)
    );
    if (filtered.length === 0) return 0;
    return filtered.filter((d) => d.success).length / filtered.length;
  }

  getAverageLatency(agentId?: string, windowMs = 86400000): number {
    const cutoff = Date.now() - windowMs;
    const filtered = this.dataPoints.filter(
      (d) => d.timestamp >= cutoff && (!agentId || d.agentId === agentId)
    );
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, d) => sum + d.durationMs, 0) / filtered.length;
  }

  getTrend(metric: "successRate" | "latency" | "cost" | "volume", agentId?: string, buckets = 12): TrendData {
    const now = Date.now();
    const bucketSize = (7 * 86400000) / buckets;
    const values: number[] = [];
    const timestamps: number[] = [];

    for (let i = buckets - 1; i >= 0; i--) {
      const start = now - (i + 1) * bucketSize;
      const end = now - i * bucketSize;
      const bucket = this.dataPoints.filter(
        (d) => d.timestamp >= start && d.timestamp < end && (!agentId || d.agentId === agentId)
      );
      timestamps.push(end);

      switch (metric) {
        case "successRate":
          values.push(bucket.length > 0 ? bucket.filter((d) => d.success).length / bucket.length : 0);
          break;
        case "latency":
          values.push(bucket.length > 0 ? bucket.reduce((s, d) => s + d.durationMs, 0) / bucket.length : 0);
          break;
        case "cost":
          values.push(bucket.reduce((s, d) => s + d.costUsd, 0));
          break;
        case "volume":
          values.push(bucket.length);
          break;
      }
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / (secondHalf.length || 1);
    const changePercent = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    return {
      metric,
      values,
      timestamps,
      direction: changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable",
      changePercent: Math.round(changePercent * 10) / 10,
    };
  }

  getDataPoints(): ExecutionDataPoint[] {
    return this.dataPoints;
  }
}

// ═══ Anomaly Detector ═══

export class AnomalyDetector {
  private threshold: number;

  constructor(threshold = 2.0) {
    this.threshold = threshold;
  }

  detectAnomalies(values: number[], labels?: string[]): Anomaly[] {
    if (values.length < 3) return [];

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    const anomalies: Anomaly[] = [];

    values.forEach((value, i) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > this.threshold) {
        const deviation = ((value - mean) / mean) * 100;
        anomalies.push({
          id: `anom_${Date.now()}_${i}`,
          metric: labels?.[i] || `index_${i}`,
          severity: zScore > 3 ? "critical" : zScore > 2.5 ? "warning" : "info",
          value,
          expected: Math.round(mean * 100) / 100,
          deviation: Math.round(deviation * 10) / 10,
          detectedAt: Date.now(),
          description: `Value ${value} deviates ${Math.round(zScore * 10) / 10} standard deviations from mean (${Math.round(mean * 100) / 100}). ${deviation > 0 ? "Spike" : "Drop"} of ${Math.abs(Math.round(deviation))}%.`,
        });
      }
    });

    return anomalies;
  }

  detectMetricAnomaly(
    current: number,
    historical: number[],
    metricName: string,
    agentId?: string
  ): Anomaly | null {
    if (historical.length < 3) return null;

    const mean = historical.reduce((s, v) => s + v, 0) / historical.length;
    const stdDev = Math.sqrt(
      historical.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / historical.length
    );

    if (stdDev === 0) return null;
    const zScore = Math.abs((current - mean) / stdDev);

    if (zScore > this.threshold) {
      const deviation = ((current - mean) / mean) * 100;
      return {
        id: `anom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        metric: metricName,
        agentId,
        severity: zScore > 3 ? "critical" : zScore > 2.5 ? "warning" : "info",
        value: current,
        expected: Math.round(mean * 100) / 100,
        deviation: Math.round(deviation * 10) / 10,
        detectedAt: Date.now(),
        description: `${metricName} is ${Math.round(zScore * 10) / 10}σ from normal. Current: ${current}, Expected: ~${Math.round(mean * 100) / 100}.`,
      };
    }

    return null;
  }
}

// ═══ Predictive Model ═══

export class PredictiveModel {
  /**
   * Simple linear regression forecast
   */
  forecast(data: number[], periods = 3): ForecastResult {
    const n = data.length;
    if (n < 2) {
      return {
        metric: "forecast",
        historical: data,
        forecasted: Array(periods).fill(data[0] || 0),
        upperBound: Array(periods).fill(data[0] || 0),
        lowerBound: Array(periods).fill(data[0] || 0),
        confidence: 0,
      };
    }

    // Linear regression: y = mx + b
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((s, v) => s + v, 0) / n;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R² for confidence
    const ssRes = data.reduce((s, v, i) => s + Math.pow(v - (slope * i + intercept), 2), 0);
    const ssTot = data.reduce((s, v) => s + Math.pow(v - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // Standard error for bounds
    const stdError = Math.sqrt(ssRes / Math.max(n - 2, 1));

    const forecasted: number[] = [];
    const upperBound: number[] = [];
    const lowerBound: number[] = [];

    for (let i = 0; i < periods; i++) {
      const x = n + i;
      const predicted = slope * x + intercept;
      const margin = stdError * (1.5 + i * 0.3); // Wider bounds further out
      forecasted.push(Math.round(predicted * 100) / 100);
      upperBound.push(Math.round((predicted + margin) * 100) / 100);
      lowerBound.push(Math.round(Math.max(0, predicted - margin) * 100) / 100);
    }

    return {
      metric: "forecast",
      historical: data,
      forecasted,
      upperBound,
      lowerBound,
      confidence: Math.round(Math.max(0, rSquared) * 100) / 100,
    };
  }

  /**
   * Moving average with configurable window
   */
  movingAverage(data: number[], window = 3): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      result.push(slice.reduce((s, v) => s + v, 0) / slice.length);
    }
    return result;
  }

  /**
   * Generate predictions for an agent
   */
  generatePredictions(trend: TrendData, agentId?: string): Prediction[] {
    const predictions: Prediction[] = [];
    const forecast = this.forecast(trend.values, 3);
    const currentValue = trend.values[trend.values.length - 1] || 0;
    const predictedValue = forecast.forecasted[forecast.forecasted.length - 1] || 0;

    if (forecast.confidence > 0.3 && Math.abs(predictedValue - currentValue) > currentValue * 0.05) {
      predictions.push({
        id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        metric: trend.metric,
        agentId,
        currentValue: Math.round(currentValue * 100) / 100,
        predictedValue: Math.round(predictedValue * 100) / 100,
        confidence: forecast.confidence,
        horizon: "7 days",
        direction: predictedValue > currentValue ? "up" : "down",
        description: `${trend.metric} is projected to ${predictedValue > currentValue ? "increase" : "decrease"} by ${Math.abs(Math.round(((predictedValue - currentValue) / (currentValue || 1)) * 100))}% over the next 7 days.`,
        generatedAt: Date.now(),
      });
    }

    return predictions;
  }
}

// ═══ What-If Simulator ═══

export class WhatIfSimulator {
  simulate(
    baseMetrics: Record<string, number>,
    scenario: WhatIfScenario
  ): WhatIfResult {
    const projections: Record<string, { current: number; projected: number; change: number }> = {};
    const risks: string[] = [];
    const opportunities: string[] = [];

    for (const [metric, currentValue] of Object.entries(baseMetrics)) {
      const modifier = scenario.modifications[metric];
      if (modifier !== undefined) {
        const projected = currentValue * (1 + modifier / 100);
        const change = ((projected - currentValue) / (currentValue || 1)) * 100;
        projections[metric] = {
          current: Math.round(currentValue * 100) / 100,
          projected: Math.round(projected * 100) / 100,
          change: Math.round(change * 10) / 10,
        };

        if (metric === "errorRate" && projected > currentValue) {
          risks.push(`Error rate increase of ${Math.round(change)}% may impact SLA compliance`);
        }
        if (metric === "cost" && projected > currentValue * 1.5) {
          risks.push(`Cost increase of ${Math.round(change)}% exceeds recommended threshold`);
        }
        if (metric === "throughput" && projected > currentValue) {
          opportunities.push(`Throughput increase of ${Math.round(change)}% could enable ${Math.round(projected - currentValue)} additional executions`);
        }
        if (metric === "successRate" && projected > currentValue) {
          opportunities.push(`Success rate improvement to ${Math.round(projected * 100) / 100}% reduces manual intervention`);
        }
      } else {
        projections[metric] = { current: currentValue, projected: currentValue, change: 0 };
      }
    }

    return { scenario, projections, risks, opportunities };
  }
}

// ═══ Insight Generator ═══

export class InsightGenerator {
  private analyzer: ExecutionPatternAnalyzer;
  private detector: AnomalyDetector;
  private model: PredictiveModel;

  constructor(analyzer: ExecutionPatternAnalyzer) {
    this.analyzer = analyzer;
    this.detector = new AnomalyDetector();
    this.model = new PredictiveModel();
  }

  generateInsights(tenantId: string): Insight[] {
    const insights: Insight[] = [];
    const data = this.analyzer.getDataPoints().filter((d) => d.tenantId === tenantId);
    if (data.length === 0) return insights;

    // Success rate insight
    const successRate = data.filter((d) => d.success).length / data.length;
    if (successRate < 0.95) {
      const failedByType: Record<string, number> = {};
      data.filter((d) => !d.success).forEach((d) => {
        failedByType[d.agentType] = (failedByType[d.agentType] || 0) + 1;
      });
      const worstType = Object.entries(failedByType).sort((a, b) => b[1] - a[1])[0];
      insights.push({
        id: `ins_${Date.now()}_sr`,
        type: "risk",
        title: "Success Rate Below Target",
        description: `Overall success rate is ${(successRate * 100).toFixed(1)}%, below the 95% target. ${worstType ? `${worstType[0]} agents account for ${worstType[1]} failures.` : ""}`,
        impact: successRate < 0.9 ? "high" : "medium",
        confidence: 0.92,
        actionable: true,
        suggestedAction: worstType ? `Review ${worstType[0]} agent configurations and error logs` : "Review recent execution logs for failure patterns",
        generatedAt: Date.now(),
      });
    }

    // Cost optimization insight
    const totalCost = data.reduce((s, d) => s + d.costUsd, 0);
    const avgCostPerExecution = totalCost / data.length;
    if (avgCostPerExecution > 0.05) {
      insights.push({
        id: `ins_${Date.now()}_cost`,
        type: "optimization",
        title: "Cost Optimization Opportunity",
        description: `Average execution cost is $${avgCostPerExecution.toFixed(3)}. Routing simple tasks to smaller models could reduce costs by 30-40%.`,
        impact: "medium",
        confidence: 0.78,
        actionable: true,
        suggestedAction: "Enable multi-model routing to use GPT-4o-mini for classification and extraction tasks",
        generatedAt: Date.now(),
      });
    }

    // Volume trend insight
    const volumeTrend = this.analyzer.getTrend("volume", undefined, 6);
    if (volumeTrend.direction === "up" && volumeTrend.changePercent > 20) {
      insights.push({
        id: `ins_${Date.now()}_vol`,
        type: "trend",
        title: "Execution Volume Growing Rapidly",
        description: `Agent execution volume has increased ${volumeTrend.changePercent}% recently. Current trajectory may exceed plan limits.`,
        impact: "medium",
        confidence: 0.85,
        actionable: true,
        suggestedAction: "Consider upgrading plan or optimizing agent execution frequency",
        generatedAt: Date.now(),
      });
    }

    // Latency insight
    const latencies = data.map((d) => d.durationMs);
    const avgLatency = latencies.reduce((s, v) => s + v, 0) / latencies.length;
    const anomalies = this.detector.detectAnomalies(latencies);
    if (anomalies.some((a) => a.severity === "critical")) {
      insights.push({
        id: `ins_${Date.now()}_lat`,
        type: "risk",
        title: "Latency Anomalies Detected",
        description: `${anomalies.filter((a) => a.severity === "critical").length} critical latency spikes detected. Average latency: ${Math.round(avgLatency)}ms with outliers exceeding ${Math.round(Math.max(...latencies))}ms.`,
        impact: "high",
        confidence: 0.9,
        actionable: true,
        suggestedAction: "Investigate slow agent executions — possible LLM provider latency or tool timeout issues",
        generatedAt: Date.now(),
      });
    }

    // Opportunity insight
    if (successRate > 0.98 && data.length > 100) {
      insights.push({
        id: `ins_${Date.now()}_opp`,
        type: "opportunity",
        title: "High Performance — Ready for Expansion",
        description: `Agents are performing at ${(successRate * 100).toFixed(1)}% success rate across ${data.length} executions. This is an excellent foundation to expand automation scope.`,
        impact: "high",
        confidence: 0.88,
        actionable: true,
        suggestedAction: "Consider deploying additional agent types or increasing automation coverage",
        generatedAt: Date.now(),
      });
    }

    return insights;
  }
}

// ═══ Singleton Instance ═══

let _analyzer: ExecutionPatternAnalyzer | null = null;
let _simulator: WhatIfSimulator | null = null;

export function getAnalyzer(): ExecutionPatternAnalyzer {
  if (!_analyzer) {
    _analyzer = new ExecutionPatternAnalyzer();
    // Seed with demo data
    seedDemoData(_analyzer);
  }
  return _analyzer;
}

export function getSimulator(): WhatIfSimulator {
  if (!_simulator) _simulator = new WhatIfSimulator();
  return _simulator;
}

function seedDemoData(analyzer: ExecutionPatternAnalyzer): void {
  const agentTypes = ["FRAUD_MONITORING", "COMPLIANCE", "REPORTING", "CUSTOMER_SUPPORT", "DATA_ANALYST"];
  const now = Date.now();

  for (let i = 0; i < 500; i++) {
    const agentType = agentTypes[i % agentTypes.length];
    const hoursAgo = Math.random() * 168; // Last 7 days
    analyzer.addDataPoint({
      timestamp: now - hoursAgo * 3600000,
      agentId: `agent_${agentType.toLowerCase()}_001`,
      agentType,
      success: Math.random() > (agentType === "CUSTOMER_SUPPORT" ? 0.08 : 0.03),
      durationMs: 1000 + Math.random() * 15000 + (agentType === "COMPLIANCE" ? 5000 : 0),
      tokenUsage: 500 + Math.random() * 3000,
      costUsd: 0.01 + Math.random() * 0.08,
      tenantId: "tenant_acme",
    });
  }
}
