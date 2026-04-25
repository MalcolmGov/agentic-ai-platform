"use client";

/* ═══════════════════════════════════════════════════════════
   Shared Agent Store — localStorage-based persistence
   Used by Agent Studio (write) and Agents page (read)
   ═══════════════════════════════════════════════════════════ */

export interface DeployedAgent {
  id: string;
  name: string;
  icon: string;
  status: "active" | "paused";
  color: string;
  description: string;
  source: "studio";
  deployedAt: string;
  executions: number;
  successRate: number;
  lastRun: string;
  model: string;
  temperature: number;
  nodeCount: number;
  edgeCount: number;
  graph?: unknown;
}

const STORAGE_KEY = "agentic_deployed_agents";

export function getDeployedAgents(): DeployedAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeployedAgent(agent: DeployedAgent): void {
  const existing = getDeployedAgents();
  // Replace if same id, otherwise prepend
  const idx = existing.findIndex((a) => a.id === agent.id);
  if (idx >= 0) {
    existing[idx] = agent;
  } else {
    existing.unshift(agent);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteDeployedAgent(id: string): void {
  const existing = getDeployedAgents().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/* Color palette for studio-deployed agents */
const DEPLOY_COLORS = [
  "from-electric-500 to-violet-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-indigo-500 to-blue-500",
  "from-rose-500 to-red-500",
  "from-emerald-500 to-green-500",
  "from-purple-500 to-violet-500",
];

let colorIndex = 0;
export function getNextColor(): string {
  const color = DEPLOY_COLORS[colorIndex % DEPLOY_COLORS.length];
  colorIndex++;
  return color;
}
