/**
 * Predictive Insights API
 *
 * GET  /api/insights — Get predictions, anomalies, insights
 * POST /api/insights — Run what-if simulation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/rbac";
import {
  getAnalyzer,
  getSimulator,
  InsightGenerator,
  PredictiveModel,
  AnomalyDetector,
} from "@/lib/insights/predictive-engine";
import { WhatIfScenarioSchema, validationError } from "@/lib/validation/schemas";
import { ZodError } from "zod";

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, timestamp: new Date().toISOString() }, { status });
}

export const GET = withAuth("analytics:read", async (_req, { user }) => {
  const analyzer = getAnalyzer();
  const model = new PredictiveModel();
  const detector = new AnomalyDetector();
  const insightGen = new InsightGenerator(analyzer);

  // Generate trends
  const metrics = ["successRate", "latency", "cost", "volume"] as const;
  const trends = metrics.map((m) => analyzer.getTrend(m));

  // Generate predictions from trends
  const predictions = trends.flatMap((t) => model.generatePredictions(t));

  // Detect anomalies
  const latencyTrend = analyzer.getTrend("latency");
  const anomalies = detector.detectAnomalies(latencyTrend.values, latencyTrend.values.map((_, i) => `bucket_${i}`));

  // Generate insights
  const insights = insightGen.generateInsights(user.tenantId);

  // Forecast
  const volumeTrend = analyzer.getTrend("volume");
  const forecast = model.forecast(volumeTrend.values, 5);

  return apiResponse({ trends, predictions, anomalies, insights, forecast });
});

export const POST = withAuth("analytics:read", async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const parsed = WhatIfScenarioSchema.parse(body);

    const analyzer = getAnalyzer();
    const simulator = getSimulator();

    const baseMetrics: Record<string, number> = {
      successRate: analyzer.getSuccessRate(),
      avgLatency: analyzer.getAverageLatency(),
      throughput: analyzer.getDataPoints().length,
      cost: analyzer.getDataPoints().reduce((s, d) => s + d.costUsd, 0),
      errorRate: 1 - analyzer.getSuccessRate(),
    };

    const result = simulator.simulate(baseMetrics, {
      ...parsed.scenario,
      description: parsed.scenario.name,
    });

    return apiResponse({ simulation: result, baseMetrics, tenantId: user.tenantId });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Invalid request body");
  }
});
