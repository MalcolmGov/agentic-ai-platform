/**
 * Fraud Monitoring Agent — First Agent Example
 * 
 * Demonstrates the full agent lifecycle:
 * 1. Initializes with fraud detection rules
 * 2. Plans analysis based on transaction data
 * 3. Executes risk scoring and anomaly detection
 * 4. Reports findings with alerts
 */

import { BaseAgent, AgentContext } from "../base-agent";
import { AgentRegistry } from "../agent-registry";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  merchantCategory: string;
  country: string;
  timestamp: string;
  customerId: string;
  paymentMethod: string;
  isInternational: boolean;
}

interface FraudRule {
  id: string;
  name: string;
  condition: (tx: Transaction) => boolean;
  riskWeight: number;
  severity: "low" | "medium" | "high" | "critical";
}

interface FraudAlert {
  transactionId: string;
  riskScore: number;
  triggeredRules: string[];
  severity: string;
  recommendation: string;
}

// Configurable fraud detection rules
const FRAUD_RULES: FraudRule[] = [
  {
    id: "R001",
    name: "High-value transaction",
    condition: (tx) => tx.amount > 10000,
    riskWeight: 0.3,
    severity: "high",
  },
  {
    id: "R002",
    name: "International transfer to high-risk country",
    condition: (tx) =>
      tx.isInternational &&
      ["NG", "KE", "PH", "UA", "RO"].includes(tx.country),
    riskWeight: 0.4,
    severity: "critical",
  },
  {
    id: "R003",
    name: "Unusual merchant category",
    condition: (tx) =>
      ["gambling", "crypto_exchange", "money_transfer"].includes(
        tx.merchantCategory
      ),
    riskWeight: 0.25,
    severity: "medium",
  },
  {
    id: "R004",
    name: "Late-night transaction",
    condition: (tx) => {
      const hour = new Date(tx.timestamp).getHours();
      return hour >= 1 && hour <= 5;
    },
    riskWeight: 0.15,
    severity: "low",
  },
  {
    id: "R005",
    name: "Round amount transfer",
    condition: (tx) => tx.amount % 1000 === 0 && tx.amount >= 5000,
    riskWeight: 0.2,
    severity: "medium",
  },
];

export class FraudMonitoringAgent extends BaseAgent {
  private rules: FraudRule[] = [];
  private alerts: FraudAlert[] = [];
  private processedCount = 0;

  protected async init(context: AgentContext): Promise<void> {
    // Load fraud detection rules (could come from config or database)
    this.rules = FRAUD_RULES;
    this.alerts = [];
    this.processedCount = 0;

    // Check for previous fraud patterns in memory
    const recentPatterns = await context.memory.search("fraud_pattern", 5);
    if (recentPatterns.length > 0) {
      this.log("thought", `Loaded ${recentPatterns.length} previous fraud patterns from memory`);
    }

    this.log("thought", `Initialized with ${this.rules.length} fraud detection rules`);
  }

  protected async plan(context: AgentContext): Promise<{
    description: string;
    steps: string[];
  }> {
    const transactions = (context.input.transactions || []) as Transaction[];

    return {
      description: `Analyze ${transactions.length} transactions for fraud indicators`,
      steps: [
        "validate_input",
        "score_transactions",
        "detect_anomalies",
        "generate_alerts",
        "update_memory",
      ],
    };
  }

  protected async executeStep(
    step: string,
    context: AgentContext
  ): Promise<{ toolCalls?: number; tokenUsage?: number }> {
    const transactions = (context.input.transactions || []) as Transaction[];

    switch (step) {
      case "validate_input": {
        if (transactions.length === 0) {
          this.log("thought", "No transactions to process");
          return {};
        }
        this.log(
          "thought",
          `Validated ${transactions.length} transactions for processing`
        );
        return {};
      }

      case "score_transactions": {
        for (const tx of transactions) {
          const triggeredRules: string[] = [];
          let riskScore = 0;

          for (const rule of this.rules) {
            if (rule.condition(tx)) {
              triggeredRules.push(rule.id);
              riskScore += rule.riskWeight;
            }
          }

          // Normalize risk score to 0-1 range
          riskScore = Math.min(riskScore, 1);
          this.processedCount++;

          // Flag transactions with risk score > 0.5
          if (riskScore > 0.5) {
            const maxSeverity = triggeredRules
              .map((id) => this.rules.find((r) => r.id === id)!)
              .reduce((max, rule) => {
                const order = { low: 0, medium: 1, high: 2, critical: 3 };
                return order[rule.severity] > order[max.severity] ? rule : max;
              });

            this.alerts.push({
              transactionId: tx.id,
              riskScore,
              triggeredRules,
              severity: maxSeverity.severity,
              recommendation:
                riskScore > 0.8
                  ? "BLOCK: Highly suspicious transaction — hold for manual review"
                  : "FLAG: Elevated risk — monitor closely",
            });
          }
        }

        this.log(
          "thought",
          `Scored ${this.processedCount} transactions, flagged ${this.alerts.length}`
        );
        return { tokenUsage: transactions.length * 2 };
      }

      case "detect_anomalies": {
        // Velocity check — multiple transactions from same customer
        const customerTxCounts = new Map<string, number>();
        for (const tx of transactions) {
          customerTxCounts.set(
            tx.customerId,
            (customerTxCounts.get(tx.customerId) || 0) + 1
          );
        }

        for (const [customerId, count] of customerTxCounts) {
          if (count > 5) {
            this.log(
              "decision",
              `Velocity anomaly: Customer ${customerId} has ${count} transactions in this batch`
            );
          }
        }

        return {};
      }

      case "generate_alerts": {
        let toolCalls = 0;

        for (const alert of this.alerts) {
          if (alert.severity === "critical" || alert.severity === "high") {
            // Send immediate alert
            await context.tools.call("send_alert", {
              severity: alert.severity,
              message: `Fraud alert: Transaction ${alert.transactionId} (risk: ${alert.riskScore.toFixed(2)})`,
              rules: alert.triggeredRules,
            });
            toolCalls++;
          }
        }

        this.log(
          "thought",
          `Generated ${this.alerts.length} alerts, sent ${toolCalls} immediate notifications`
        );
        return { toolCalls };
      }

      case "update_memory": {
        // Store fraud patterns for future reference
        await context.memory.set(
          `fraud_pattern_${Date.now()}`,
          {
            totalProcessed: this.processedCount,
            alertsGenerated: this.alerts.length,
            timestamp: new Date().toISOString(),
          },
          86400 // 24 hour TTL
        );
        return {};
      }

      default:
        this.log("thought", `Unknown step: ${step}`);
        return {};
    }
  }

  protected async report(context: AgentContext): Promise<unknown> {
    const transactions = (context.input.transactions || []) as Transaction[];

    const summary = {
      executionId: context.executionId,
      timestamp: new Date().toISOString(),
      summary: {
        totalTransactions: transactions.length,
        processedTransactions: this.processedCount,
        alertsGenerated: this.alerts.length,
        criticalAlerts: this.alerts.filter((a) => a.severity === "critical").length,
        highAlerts: this.alerts.filter((a) => a.severity === "high").length,
        mediumAlerts: this.alerts.filter((a) => a.severity === "medium").length,
        lowAlerts: this.alerts.filter((a) => a.severity === "low").length,
      },
      alerts: this.alerts,
      rulesUsed: this.rules.map((r) => ({ id: r.id, name: r.name })),
    };

    // Generate report via tool if available
    if (context.tools.available().includes("generate_report")) {
      await context.tools.call("generate_report", {
        title: `Fraud Monitoring Report — ${new Date().toLocaleDateString()}`,
        data: summary,
      });
    }

    return summary;
  }
}

// Register the agent type
AgentRegistry.register("FRAUD_MONITORING", FraudMonitoringAgent);
