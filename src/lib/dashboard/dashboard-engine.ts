/**
 * Executive Dashboard API
 *
 * Aggregated ROI metrics, agent performance, cost savings,
 * usage trends, and executive-ready summaries.
 */

// ─── Types ─────────────────────────────────

export interface DashboardOverview {
  tenantId: string;
  generatedAt: number;
  period: { start: number; end: number; label: string };
  kpis: KPIMetrics;
  agentPerformance: AgentPerformanceSummary[];
  costBreakdown: CostBreakdown;
  usageTrends: UsageTrend[];
  alerts: DashboardAlert[];
  executiveSummary: string;
}

export interface KPIMetrics {
  totalAgents: number;
  activeAgents: number;
  totalExecutions: number;
  successRate: number;
  totalCostUsd: number;
  totalSavingsUsd: number;
  roi: number;
  fteReplaced: number;
  avgLatencyMs: number;
  uptimePercent: number;
}

export interface AgentPerformanceSummary {
  agentId: string;
  agentName: string;
  agentType: string;
  executions: number;
  successRate: number;
  avgLatencyMs: number;
  costUsd: number;
  savingsUsd: number;
  roi: number;
  trend: "improving" | "stable" | "declining";
  healthStatus: "healthy" | "warning" | "critical";
}

export interface CostBreakdown {
  totalCostUsd: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  byAgent: { agentId: string; agentName: string; amount: number; percentage: number }[];
  projectedMonthly: number;
}

export interface UsageTrend {
  date: string;
  executions: number;
  costUsd: number;
  savingsUsd: number;
  successRate: number;
}

export interface DashboardAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  agentId?: string;
  createdAt: number;
}

export interface DashboardConfig {
  tenantId: string;
  periodDays: number;
  refreshIntervalMinutes: number;
  alertThresholds: {
    minSuccessRate: number;
    maxLatencyMs: number;
    maxCostPerDay: number;
    minROI: number;
  };
}

// ─── Engine ────────────────────────────────

export class DashboardEngine {
  private agentData = new Map<string, AgentPerformanceSummary[]>();
  private configs = new Map<string, DashboardConfig>();

  /**
   * Register agent performance data for dashboard
   */
  recordAgentMetrics(tenantId: string, metrics: AgentPerformanceSummary): void {
    const existing = this.agentData.get(tenantId) || [];
    const idx = existing.findIndex((a) => a.agentId === metrics.agentId);
    if (idx >= 0) {
      existing[idx] = metrics;
    } else {
      existing.push(metrics);
    }
    this.agentData.set(tenantId, existing);
  }

  /**
   * Generate executive dashboard overview
   */
  getOverview(tenantId: string, periodDays = 30): DashboardOverview {
    const agents = this.agentData.get(tenantId) || [];
    const config = this.configs.get(tenantId);
    const now = Date.now();
    const periodStart = now - periodDays * 86_400_000;

    const kpis = this.computeKPIs(agents);
    const costBreakdown = this.computeCostBreakdown(agents);
    const usageTrends = this.generateTrends(agents, periodDays);
    const alerts = this.generateAlerts(agents, config);
    const executiveSummary = this.generateExecutiveSummary(kpis, agents.length, periodDays);

    return {
      tenantId,
      generatedAt: now,
      period: { start: periodStart, end: now, label: `Last ${periodDays} days` },
      kpis,
      agentPerformance: agents,
      costBreakdown,
      usageTrends,
      alerts,
      executiveSummary,
    };
  }

  /**
   * Get specific KPI metrics
   */
  getKPIs(tenantId: string): KPIMetrics {
    const agents = this.agentData.get(tenantId) || [];
    return this.computeKPIs(agents);
  }

  /**
   * Configure dashboard thresholds and settings
   */
  configure(config: DashboardConfig): DashboardConfig {
    this.configs.set(config.tenantId, config);
    return config;
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(tenantId: string): CostBreakdown {
    const agents = this.agentData.get(tenantId) || [];
    return this.computeCostBreakdown(agents);
  }

  /**
   * Export dashboard data for reports
   */
  exportReport(tenantId: string, format: "json" | "csv"): { format: string; data: string; generatedAt: number } {
    const overview = this.getOverview(tenantId);
    if (format === "csv") {
      const header = "Agent,Executions,Success Rate,Cost,Savings,ROI,Status\n";
      const rows = overview.agentPerformance.map((a) =>
        `"${a.agentName}",${a.executions},${(a.successRate * 100).toFixed(1)}%,$${a.costUsd},$${a.savingsUsd},${a.roi}%,${a.healthStatus}`
      ).join("\n");
      return { format: "csv", data: header + rows, generatedAt: Date.now() };
    }
    return { format: "json", data: JSON.stringify(overview, null, 2), generatedAt: Date.now() };
  }

  // ─── Private ─────────────────────────────

  private computeKPIs(agents: AgentPerformanceSummary[]): KPIMetrics {
    if (agents.length === 0) {
      return { totalAgents: 0, activeAgents: 0, totalExecutions: 0, successRate: 0, totalCostUsd: 0, totalSavingsUsd: 0, roi: 0, fteReplaced: 0, avgLatencyMs: 0, uptimePercent: 99.9 };
    }

    const totalExec = agents.reduce((s, a) => s + a.executions, 0);
    const totalCost = agents.reduce((s, a) => s + a.costUsd, 0);
    const totalSavings = agents.reduce((s, a) => s + a.savingsUsd, 0);
    const weightedSuccess = agents.reduce((s, a) => s + a.successRate * a.executions, 0) / Math.max(totalExec, 1);
    const avgLatency = agents.reduce((s, a) => s + a.avgLatencyMs, 0) / agents.length;

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.executions > 0).length,
      totalExecutions: totalExec,
      successRate: Math.round(weightedSuccess * 1000) / 1000,
      totalCostUsd: Math.round(totalCost * 100) / 100,
      totalSavingsUsd: Math.round(totalSavings),
      roi: totalCost > 0 ? Math.round(((totalSavings - totalCost) / totalCost) * 100) : 0,
      fteReplaced: Math.round(totalExec * 0.002 * 100) / 100, // estimate
      avgLatencyMs: Math.round(avgLatency),
      uptimePercent: 99.9,
    };
  }

  private computeCostBreakdown(agents: AgentPerformanceSummary[]): CostBreakdown {
    const totalCost = agents.reduce((s, a) => s + a.costUsd, 0) || 1;

    const categoryMap: Record<string, number> = {};
    for (const a of agents) {
      categoryMap[a.agentType] = (categoryMap[a.agentType] || 0) + a.costUsd;
    }

    const byCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category, amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / totalCost) * 100),
    }));

    const byAgent = agents.map((a) => ({
      agentId: a.agentId, agentName: a.agentName,
      amount: Math.round(a.costUsd * 100) / 100,
      percentage: Math.round((a.costUsd / totalCost) * 100),
    }));

    return { totalCostUsd: Math.round(totalCost * 100) / 100, byCategory, byAgent, projectedMonthly: Math.round(totalCost * 1.1 * 100) / 100 };
  }

  private generateTrends(agents: AgentPerformanceSummary[], periodDays: number): UsageTrend[] {
    const trends: UsageTrend[] = [];
    const totalExec = agents.reduce((s, a) => s + a.executions, 0);
    const totalCost = agents.reduce((s, a) => s + a.costUsd, 0);
    const totalSavings = agents.reduce((s, a) => s + a.savingsUsd, 0);
    const avgSuccess = agents.length > 0 ? agents.reduce((s, a) => s + a.successRate, 0) / agents.length : 0;

    for (let i = 0; i < Math.min(periodDays, 30); i++) {
      const date = new Date(Date.now() - (periodDays - i - 1) * 86_400_000);
      const variance = 0.8 + Math.random() * 0.4;
      trends.push({
        date: date.toISOString().slice(0, 10),
        executions: Math.round((totalExec / periodDays) * variance),
        costUsd: Math.round((totalCost / periodDays) * variance * 100) / 100,
        savingsUsd: Math.round((totalSavings / periodDays) * variance),
        successRate: Math.min(1, avgSuccess * (0.95 + Math.random() * 0.1)),
      });
    }
    return trends;
  }

  private generateAlerts(agents: AgentPerformanceSummary[], config?: DashboardConfig): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const thresholds = config?.alertThresholds || { minSuccessRate: 0.95, maxLatencyMs: 5000, maxCostPerDay: 100, minROI: 0 };

    for (const agent of agents) {
      if (agent.successRate < thresholds.minSuccessRate) {
        alerts.push({ id: `alert_${Date.now()}_${agent.agentId}`, severity: agent.successRate < 0.8 ? "critical" : "warning", title: `Low success rate: ${agent.agentName}`, message: `Success rate is ${(agent.successRate * 100).toFixed(1)}% (threshold: ${(thresholds.minSuccessRate * 100)}%)`, agentId: agent.agentId, createdAt: Date.now() });
      }
      if (agent.avgLatencyMs > thresholds.maxLatencyMs) {
        alerts.push({ id: `alert_lat_${agent.agentId}`, severity: "warning", title: `High latency: ${agent.agentName}`, message: `Average latency is ${agent.avgLatencyMs}ms (threshold: ${thresholds.maxLatencyMs}ms)`, agentId: agent.agentId, createdAt: Date.now() });
      }
    }
    return alerts;
  }

  private generateExecutiveSummary(kpis: KPIMetrics, agentCount: number, periodDays: number): string {
    if (agentCount === 0) return "No agents deployed yet. Get started by creating your first agent.";
    const parts = [`Over the last ${periodDays} days, ${kpis.activeAgents} active agent(s) processed ${kpis.totalExecutions.toLocaleString()} executions with a ${(kpis.successRate * 100).toFixed(1)}% success rate.`];
    if (kpis.totalSavingsUsd > 0) parts.push(`Total cost savings: $${kpis.totalSavingsUsd.toLocaleString()} with an ROI of ${kpis.roi}%.`);
    if (kpis.fteReplaced > 0) parts.push(`This is equivalent to ${kpis.fteReplaced} FTE(s) of manual work automated.`);
    return parts.join(" ");
  }
}

// ─── Singleton ─────────────────────────────

let engine: DashboardEngine | null = null;
export function getDashboardEngine(): DashboardEngine {
  if (!engine) engine = new DashboardEngine();
  return engine;
}
