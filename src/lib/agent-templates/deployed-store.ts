import type { AgentTemplate } from './index'

/**
 * Represents a deployed instance of an agent template.
 * Stored in localStorage when a database is not available; can be synced to
 * Prisma when the DB becomes available.
 */
export interface DeployedAgentInstance {
  instanceId: string
  templateId: string
  name: string
  department: string
  icon: string
  color: string
  status: 'active' | 'paused' | 'configuring'
  deployedAt: string
  deployedBy: string
  config: Record<string, string>
  runCount: number
  lastRunAt: string | null
}

const STORAGE_KEY = 'agentic_deployed_v2'

/**
 * Returns all deployed agent instances belonging to the given user email.
 * Safe to call during SSR — returns an empty array when window is undefined.
 */
export function getDeployedAgents(userEmail: string): DeployedAgentInstance[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all: DeployedAgentInstance[] = JSON.parse(raw)
    return all.filter(a => a.deployedBy === userEmail)
  } catch {
    return []
  }
}

/**
 * Deploys a new instance of an agent template for the given user.
 * Persists to localStorage and returns the created instance.
 */
export function deployAgent(
  template: Pick<AgentTemplate, 'id' | 'name' | 'department' | 'icon' | 'color'>,
  userEmail: string,
  config: Record<string, string> = {}
): DeployedAgentInstance {
  const instance: DeployedAgentInstance = {
    instanceId: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    templateId: template.id,
    name: template.name,
    department: template.department,
    icon: template.icon,
    color: template.color,
    status: 'active',
    deployedAt: new Date().toISOString(),
    deployedBy: userEmail,
    config,
    runCount: 0,
    lastRunAt: null,
  }
  const existing = getAllDeployedAgents()
  existing.push(instance)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  return instance
}

/**
 * Removes a deployed agent instance by instanceId.
 */
export function removeDeployedAgent(instanceId: string): void {
  const existing = getAllDeployedAgents().filter(a => a.instanceId !== instanceId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

/**
 * Toggles a deployed agent between 'active' and 'paused' status.
 */
export function toggleAgentStatus(instanceId: string): void {
  const existing = getAllDeployedAgents()
  const agent = existing.find(a => a.instanceId === instanceId)
  if (agent) {
    agent.status = agent.status === 'active' ? 'paused' : 'active'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

/**
 * Increments the run count and updates the lastRunAt timestamp for a deployed agent.
 */
export function incrementRunCount(instanceId: string): void {
  const existing = getAllDeployedAgents()
  const agent = existing.find(a => a.instanceId === instanceId)
  if (agent) {
    agent.runCount += 1
    agent.lastRunAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

/**
 * Updates the config key-value pairs for a deployed agent instance.
 */
export function updateAgentConfig(
  instanceId: string,
  config: Record<string, string>
): void {
  const existing = getAllDeployedAgents()
  const agent = existing.find(a => a.instanceId === instanceId)
  if (agent) {
    agent.config = { ...agent.config, ...config }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

/**
 * Renames a deployed agent instance.
 */
export function renameAgent(instanceId: string, newName: string): void {
  const existing = getAllDeployedAgents()
  const agent = existing.find(a => a.instanceId === instanceId)
  if (agent) {
    agent.name = newName
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

/**
 * Returns a single deployed agent by instanceId, or undefined if not found.
 */
export function getDeployedAgentById(instanceId: string): DeployedAgentInstance | undefined {
  return getAllDeployedAgents().find(a => a.instanceId === instanceId)
}

/**
 * Returns all deployed agents across all users from localStorage.
 * Internal helper — external callers should use getDeployedAgents(userEmail) instead.
 */
function getAllDeployedAgents(): DeployedAgentInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DeployedAgentInstance[]) : []
  } catch {
    return []
  }
}
