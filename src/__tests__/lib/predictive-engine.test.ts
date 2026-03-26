import { describe, it, expect } from "vitest";
import {
  ExecutionPatternAnalyzer,
  AnomalyDetector,
  PredictiveModel,
  InsightGenerator,
  ExecutionDataPoint,
} from "@/lib/insights/predictive-engine";

function makeDataPoint(overrides: Partial<ExecutionDataPoint> = {}): ExecutionDataPoint {
  return {
    timestamp: Date.now(),
    agentId: "agent_1",
    agentType: "FRAUD_MONITORING",
    success: true,
    durationMs: 500,
    tokenUsage: 100,
    costUsd: 0.01,
    tenantId: "tenant_1",
    ...overrides,
  };
}

describe("ExecutionPatternAnalyzer", () => {
  it("calculates success rate", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    analyzer.addBatch([
      makeDataPoint({ success: true }),
      makeDataPoint({ success: true }),
      makeDataPoint({ success: false }),
    ]);
    expect(analyzer.getSuccessRate()).toBeCloseTo(2 / 3, 1);
  });

  it("returns 0 success rate for empty data", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    expect(analyzer.getSuccessRate()).toBe(0);
  });

  it("calculates average latency", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    analyzer.addBatch([
      makeDataPoint({ durationMs: 100 }),
      makeDataPoint({ durationMs: 300 }),
    ]);
    expect(analyzer.getAverageLatency()).toBe(200);
  });

  it("generates trend data with direction", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    const now = Date.now();
    // Add data across the trend window
    for (let i = 0; i < 20; i++) {
      analyzer.addDataPoint(makeDataPoint({
        timestamp: now - (7 * 86400000) + (i * 86400000 / 3),
        durationMs: 100 + i * 10,
      }));
    }
    const trend = analyzer.getTrend("volume");
    expect(trend.metric).toBe("volume");
    expect(trend.values).toHaveLength(12);
    expect(["up", "down", "stable"]).toContain(trend.direction);
  });

  it("filters by agentId", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    analyzer.addBatch([
      makeDataPoint({ agentId: "a1", success: true }),
      makeDataPoint({ agentId: "a2", success: false }),
    ]);
    expect(analyzer.getSuccessRate("a1")).toBe(1);
    expect(analyzer.getSuccessRate("a2")).toBe(0);
  });
});

describe("AnomalyDetector", () => {
  it("detects anomalous values using z-score", () => {
    const detector = new AnomalyDetector(2.0);
    const values = [10, 11, 10, 12, 10, 11, 50]; // 50 is anomalous
    const anomalies = detector.detectAnomalies(values);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);
    expect(anomalies[0].value).toBe(50);
  });

  it("returns empty for uniform data", () => {
    const detector = new AnomalyDetector();
    expect(detector.detectAnomalies([5, 5, 5, 5])).toEqual([]);
  });

  it("returns empty for too few data points", () => {
    const detector = new AnomalyDetector();
    expect(detector.detectAnomalies([1, 2])).toEqual([]);
  });
});

describe("PredictiveModel", () => {
  it("generates predictions from trend data", () => {
    const model = new PredictiveModel();
    const trend = {
      metric: "volume",
      values: [10, 20, 30, 40, 50],
      timestamps: [1, 2, 3, 4, 5],
      direction: "up" as const,
      changePercent: 50,
    };
    const predictions = model.generatePredictions(trend);
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].metric).toBe("volume");
    expect(predictions[0].predictedValue).toBeGreaterThan(0);
  });

  it("forecasts future values with confidence intervals", () => {
    const model = new PredictiveModel();
    const values = [100, 110, 120, 130, 140];
    const forecast = model.forecast(values, 3);
    expect(forecast.forecasted).toHaveLength(3);
    expect(forecast.upperBound).toHaveLength(3);
    expect(forecast.lowerBound).toHaveLength(3);
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.confidence).toBeLessThanOrEqual(1);
  });
});

describe("InsightGenerator", () => {
  it("generates insights from analyzer data", () => {
    const analyzer = new ExecutionPatternAnalyzer();
    for (let i = 0; i < 10; i++) {
      analyzer.addDataPoint(makeDataPoint({ success: i > 1, durationMs: 500 + i * 50 }));
    }
    const generator = new InsightGenerator(analyzer);
    const insights = generator.generateInsights("tenant_1");
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]).toHaveProperty("title");
    expect(insights[0]).toHaveProperty("confidence");
  });
});
