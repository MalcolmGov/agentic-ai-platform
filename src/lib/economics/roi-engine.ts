/**
 * Agent Economics & ROI Engine
 *
 * Tracks and quantifies the business value each agent creates.
 * Generates auditable ROI reports showing FTE replacement, error reduction,
 * speed gains, and compliance savings with dollar amounts.
 */

// ─── Types ─────────────────────────────────

export interface AgentEconomics {
  agentId: string;
  agentName: string;
  agentType: string;
  tenantId: string;
  period: { start: number; end: number };
  laborSavings: LaborSavings;
  errorReduction: ErrorReduction;
  speedGains: SpeedGains;
  complianceSavings: ComplianceSavings;
  llmCost: LLMCost;
  totalSavings: number;
  totalCost: number;
  netValue: number;
  roi: number; // percentage
}

export interface LaborSavings {
  tasksAutomated: number;
  avgMinutesPerTask: number;
  totalHoursSaved: number;
  fteEquivalent: number;
  hourlyRate: number;
  dollarsSaved: number;
}

export interface ErrorReduction {
  manualErrorRate: number;       // historical human error rate
  automatedErrorRate: number;    // agent error rate
  errorsAvoided: number;
  avgCostPerError: number;
  dollarsSaved: number;
}

export interface SpeedGains {
  manualAvgMinutes: number;
  automatedAvgSeconds: number;
  speedMultiplier: number;
  totalTimeSavedHours: number;
  revenueFromFasterProcessing: number;
}

export interface ComplianceSavings {
  auditHoursReduced: number;
  penaltiesAvoided: number;
  insurancePremiumReduction: number;
  dollarsSaved: number;
}

export interface LLMCost {
  totalTokens: number;
  totalApiCalls: number;
  totalCostUsd: number;
  costPerExecution: number;
  costPerSavedDollar: number; // efficiency ratio
}

export interface ROIReport {
  id: string;
  tenantId: string;
  generatedAt: number;
  periodStart: number;
  periodEnd: number;
  agents: AgentEconomics[];
  totals: {
    totalSavings: number;
    totalCost: number;
    netValue: number;
    overallROI: number;
    fteReplaced: number;
    errorsAvoided: number;
    hoursReclaimed: number;
  };
  executiveSummary: string;
  recommendations: string[];
}

// ─── Industry Benchmarks ───────────────────

interface IndustryBenchmark {
  avgMinutesPerTask: number;
  manualErrorRate: number;
  avgCostPerError: number;
  hourlyLaborRate: number;
  complianceAuditHoursPerMonth: number;
  avgPenaltyRisk: number;
}

const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  FRAUD_MONITORING: {
    avgMinutesPerTask: 25,
    manualErrorRate: 0.08,
    avgCostPerError: 2500,
    hourlyLaborRate: 85,
    complianceAuditHoursPerMonth: 40,
    avgPenaltyRisk: 50000,
  },
  COMPLIANCE: {
    avgMinutesPerTask: 45,
    manualErrorRate: 0.12,
    avgCostPerError: 5000,
    hourlyLaborRate: 95,
    complianceAuditHoursPerMonth: 80,
    avgPenaltyRisk: 100000,
  },
  REPORTING: {
    avgMinutesPerTask: 60,
    manualErrorRate: 0.05,
    avgCostPerError: 500,
    hourlyLaborRate: 65,
    complianceAuditHoursPerMonth: 0,
    avgPenaltyRisk: 0,
  },
  FINANCE: {
    avgMinutesPerTask: 30,
    manualErrorRate: 0.06,
    avgCostPerError: 3000,
    hourlyLaborRate: 90,
    complianceAuditHoursPerMonth: 20,
    avgPenaltyRisk: 25000,
  },
  CUSTOMER_SUPPORT: {
    avgMinutesPerTask: 15,
    manualErrorRate: 0.10,
    avgCostPerError: 200,
    hourlyLaborRate: 45,
    complianceAuditHoursPerMonth: 0,
    avgPenaltyRisk: 0,
  },
  DATA_ANALYST: {
    avgMinutesPerTask: 120,
    manualErrorRate: 0.07,
    avgCostPerError: 1000,
    hourlyLaborRate: 75,
    complianceAuditHoursPerMonth: 0,
    avgPenaltyRisk: 0,
  },
  DOCUMENT_PROCESSING: {
    avgMinutesPerTask: 20,
    manualErrorRate: 0.15,
    avgCostPerError: 300,
    hourlyLaborRate: 40,
    complianceAuditHoursPerMonth: 0,
    avgPenaltyRisk: 0,
  },
  OPERATIONS: {
    avgMinutesPerTask: 10,
    manualErrorRate: 0.04,
    avgCostPerError: 5000,
    hourlyLaborRate: 70,
    complianceAuditHoursPerMonth: 10,
    avgPenaltyRisk: 10000,
  },
};

const DEFAULT_BENCHMARK: IndustryBenchmark = {
  avgMinutesPerTask: 30,
  manualErrorRate: 0.08,
  avgCostPerError: 1000,
  hourlyLaborRate: 65,
  complianceAuditHoursPerMonth: 0,
  avgPenaltyRisk: 0,
};

// ─── Economics Engine ──────────────────────

export interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  agentType: string;
  executions: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
  totalCostUsd: number;
}

export class EconomicsEngine {
  private reports: ROIReport[] = [];

  /**
   * Calculate economics for a single agent
   */
  calculateAgentEconomics(
    data: AgentPerformanceData,
    tenantId: string,
    periodDays = 30
  ): AgentEconomics {
    const benchmark = INDUSTRY_BENCHMARKS[data.agentType] || DEFAULT_BENCHMARK;

    // Labor savings
    const totalHoursSaved = (data.executions * benchmark.avgMinutesPerTask) / 60;
    const fteEquivalent = totalHoursSaved / (periodDays * 8); // 8hr workday
    const laborDollarsSaved = totalHoursSaved * benchmark.hourlyLaborRate;

    const laborSavings: LaborSavings = {
      tasksAutomated: data.executions,
      avgMinutesPerTask: benchmark.avgMinutesPerTask,
      totalHoursSaved: Math.round(totalHoursSaved * 10) / 10,
      fteEquivalent: Math.round(fteEquivalent * 100) / 100,
      hourlyRate: benchmark.hourlyLaborRate,
      dollarsSaved: Math.round(laborDollarsSaved),
    };

    // Error reduction
    const expectedManualErrors = Math.round(data.executions * benchmark.manualErrorRate);
    const actualErrors = Math.round(data.executions * (1 - data.successRate));
    const errorsAvoided = Math.max(0, expectedManualErrors - actualErrors);
    const errorDollarsSaved = errorsAvoided * benchmark.avgCostPerError;

    const errorReduction: ErrorReduction = {
      manualErrorRate: benchmark.manualErrorRate,
      automatedErrorRate: Math.round((1 - data.successRate) * 1000) / 1000,
      errorsAvoided,
      avgCostPerError: benchmark.avgCostPerError,
      dollarsSaved: Math.round(errorDollarsSaved),
    };

    // Speed gains
    const manualAvgMinutes = benchmark.avgMinutesPerTask;
    const automatedAvgSeconds = data.avgLatencyMs / 1000;
    const speedMultiplier = (manualAvgMinutes * 60) / Math.max(automatedAvgSeconds, 0.1);
    const totalTimeSavedHours = (data.executions * (manualAvgMinutes * 60 - automatedAvgSeconds)) / 3600;
    const revenueFromFasterProcessing = Math.round(totalTimeSavedHours * benchmark.hourlyLaborRate * 0.3); // 30% of time value

    const speedGains: SpeedGains = {
      manualAvgMinutes,
      automatedAvgSeconds: Math.round(automatedAvgSeconds * 10) / 10,
      speedMultiplier: Math.round(speedMultiplier),
      totalTimeSavedHours: Math.round(totalTimeSavedHours * 10) / 10,
      revenueFromFasterProcessing,
    };

    // Compliance savings
    const auditHoursReduced = benchmark.complianceAuditHoursPerMonth * 0.6; // 60% reduction
    const penaltiesAvoided = data.successRate > 0.95 ? benchmark.avgPenaltyRisk * 0.8 : 0;
    const insuranceReduction = penaltiesAvoided * 0.1; // 10% of penalty risk
    const complianceDollarsSaved = auditHoursReduced * benchmark.hourlyLaborRate + penaltiesAvoided + insuranceReduction;

    const complianceSavings: ComplianceSavings = {
      auditHoursReduced: Math.round(auditHoursReduced * 10) / 10,
      penaltiesAvoided: Math.round(penaltiesAvoided),
      insurancePremiumReduction: Math.round(insuranceReduction),
      dollarsSaved: Math.round(complianceDollarsSaved),
    };

    // LLM cost
    const llmCost: LLMCost = {
      totalTokens: data.totalTokens,
      totalApiCalls: data.executions,
      totalCostUsd: Math.round(data.totalCostUsd * 100) / 100,
      costPerExecution: data.executions > 0 ? Math.round((data.totalCostUsd / data.executions) * 10000) / 10000 : 0,
      costPerSavedDollar: 0,
    };

    // Totals
    const totalSavings = laborDollarsSaved + errorDollarsSaved + revenueFromFasterProcessing + complianceDollarsSaved;
    const totalCost = data.totalCostUsd;
    const netValue = totalSavings - totalCost;
    const roi = totalCost > 0 ? Math.round((netValue / totalCost) * 100) : 0;

    llmCost.costPerSavedDollar = totalSavings > 0 ? Math.round((totalCost / totalSavings) * 10000) / 10000 : 0;

    const now = Date.now();
    return {
      agentId: data.agentId,
      agentName: data.agentName,
      agentType: data.agentType,
      tenantId,
      period: { start: now - periodDays * 86_400_000, end: now },
      laborSavings,
      errorReduction,
      speedGains,
      complianceSavings,
      llmCost,
      totalSavings: Math.round(totalSavings),
      totalCost: Math.round(totalCost * 100) / 100,
      netValue: Math.round(netValue),
      roi,
    };
  }

  /**
   * Generate a comprehensive ROI report for all agents
   */
  generateROIReport(
    agentData: AgentPerformanceData[],
    tenantId: string,
    periodDays = 30
  ): ROIReport {
    const agents = agentData.map((d) => this.calculateAgentEconomics(d, tenantId, periodDays));

    const totals = {
      totalSavings: agents.reduce((s, a) => s + a.totalSavings, 0),
      totalCost: agents.reduce((s, a) => s + a.totalCost, 0),
      netValue: agents.reduce((s, a) => s + a.netValue, 0),
      overallROI: 0,
      fteReplaced: agents.reduce((s, a) => s + a.laborSavings.fteEquivalent, 0),
      errorsAvoided: agents.reduce((s, a) => s + a.errorReduction.errorsAvoided, 0),
      hoursReclaimed: agents.reduce((s, a) => s + a.laborSavings.totalHoursSaved, 0),
    };
    totals.overallROI = totals.totalCost > 0 ? Math.round((totals.netValue / totals.totalCost) * 100) : 0;
    totals.fteReplaced = Math.round(totals.fteReplaced * 100) / 100;
    totals.hoursReclaimed = Math.round(totals.hoursReclaimed);

    const executiveSummary = this.generateExecutiveSummary(agents, totals, periodDays);
    const recommendations = this.generateRecommendations(agents);

    const report: ROIReport = {
      id: `roi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      generatedAt: Date.now(),
      periodStart: Date.now() - periodDays * 86_400_000,
      periodEnd: Date.now(),
      agents,
      totals,
      executiveSummary,
      recommendations,
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Get past ROI reports
   */
  getReports(tenantId: string): ROIReport[] {
    return this.reports.filter((r) => r.tenantId === tenantId);
  }

  /**
   * Get industry benchmarks
   */
  getBenchmarks(): Record<string, IndustryBenchmark> {
    return { ...INDUSTRY_BENCHMARKS };
  }

  // ─── Private Helpers ─────────────────────

  private generateExecutiveSummary(
    agents: AgentEconomics[],
    totals: ROIReport["totals"],
    periodDays: number
  ): string {
    const topAgent = agents.sort((a, b) => b.netValue - a.netValue)[0];
    const monthLabel = periodDays <= 31 ? "this month" : `the past ${periodDays} days`;

    return [
      `Your ${agents.length} AI agents generated $${totals.totalSavings.toLocaleString()} in total value ${monthLabel}, `,
      `at an LLM cost of $${totals.totalCost.toLocaleString()} — a ${totals.overallROI}x return on investment. `,
      `The agents replaced ${totals.fteReplaced} full-time equivalent employees, `,
      `reclaimed ${totals.hoursReclaimed.toLocaleString()} hours of manual work, `,
      `and prevented ${totals.errorsAvoided.toLocaleString()} errors that would have cost `,
      `$${agents.reduce((s, a) => s + a.errorReduction.dollarsSaved, 0).toLocaleString()}. `,
      topAgent ? `Top performer: ${topAgent.agentName} ($${topAgent.netValue.toLocaleString()} net value, ${topAgent.roi}x ROI).` : "",
    ].join("");
  }

  private generateRecommendations(agents: AgentEconomics[]): string[] {
    const recs: string[] = [];

    // Find underperforming agents
    const lowROI = agents.filter((a) => a.roi < 100 && a.roi > 0);
    if (lowROI.length > 0) {
      recs.push(`Optimize ${lowROI.map((a) => a.agentName).join(", ")} — ROI below 100x may benefit from model downgrade or prompt tuning`);
    }

    // Find agents with high error reduction potential
    const highErrorAgents = agents.filter((a) => a.errorReduction.automatedErrorRate > 0.05);
    if (highErrorAgents.length > 0) {
      recs.push(`Improve accuracy for ${highErrorAgents.map((a) => a.agentName).join(", ")} — current error rate above 5% leaves savings on the table`);
    }

    // Suggest scaling successful agents
    const topAgents = agents.filter((a) => a.roi > 500);
    if (topAgents.length > 0) {
      recs.push(`Scale ${topAgents.map((a) => a.agentName).join(", ")} — exceptional ROI suggests increasing execution volume would multiply returns`);
    }

    // Cost optimization
    const expensiveAgents = agents.filter((a) => a.llmCost.costPerExecution > 0.05);
    if (expensiveAgents.length > 0) {
      recs.push(`Consider cheaper models for ${expensiveAgents.map((a) => a.agentName).join(", ")} — cost per execution above $0.05`);
    }

    if (recs.length === 0) {
      recs.push("All agents performing well — consider expanding to new use cases");
    }

    return recs;
  }
}

// ─── Singleton ──────────────────────────────

let economicsEngine: EconomicsEngine | null = null;

export function getEconomicsEngine(): EconomicsEngine {
  if (!economicsEngine) {
    economicsEngine = new EconomicsEngine();
  }
  return economicsEngine;
}
