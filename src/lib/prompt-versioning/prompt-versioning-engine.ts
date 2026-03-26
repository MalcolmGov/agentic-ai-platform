/**
 * Prompt Versioning & Rollback
 *
 * Git-like version control for system prompts: commit, diff, rollback,
 * branch, tag, and audit trail for every prompt change.
 */

// ─── Types ─────────────────────────────────

export interface PromptVersion {
  id: string;
  agentId: string;
  tenantId: string;
  version: number;
  content: string;
  message: string;        // commit message
  author: string;
  diff: DiffEntry[];
  metadata: Record<string, unknown>;
  tags: string[];
  status: "active" | "superseded" | "rollback";
  createdAt: number;
}

export interface DiffEntry {
  type: "added" | "removed" | "unchanged";
  line: number;
  content: string;
}

export interface PromptBranch {
  name: string;
  agentId: string;
  tenantId: string;
  headVersion: number;
  createdAt: number;
  createdFrom: { branch: string; version: number };
}

export interface PromptHistory {
  agentId: string;
  tenantId: string;
  currentVersion: number;
  totalVersions: number;
  branches: string[];
  tags: Record<string, number>; // tag → version
  versions: PromptVersion[];
}

export interface RollbackResult {
  success: boolean;
  previousVersion: number;
  restoredVersion: number;
  newVersion: PromptVersion;
}

// ─── Engine ────────────────────────────────

export class PromptVersioningEngine {
  private versions = new Map<string, PromptVersion[]>(); // agentId → versions
  private branches = new Map<string, PromptBranch[]>();   // agentId → branches
  private activeBranch = new Map<string, string>();        // agentId → branch name

  /**
   * Commit a new prompt version
   */
  commit(params: {
    agentId: string;
    tenantId: string;
    content: string;
    message: string;
    author: string;
    metadata?: Record<string, unknown>;
  }): PromptVersion {
    const key = params.agentId;
    const existing = this.versions.get(key) || [];
    const prevContent = existing.length > 0 ? existing[existing.length - 1].content : "";
    const newVersion = existing.length + 1;

    // Mark previous as superseded
    if (existing.length > 0) {
      existing[existing.length - 1].status = "superseded";
    }

    const version: PromptVersion = {
      id: `pv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId: params.agentId,
      tenantId: params.tenantId,
      version: newVersion,
      content: params.content,
      message: params.message,
      author: params.author,
      diff: this.computeDiff(prevContent, params.content),
      metadata: params.metadata || {},
      tags: [],
      status: "active",
      createdAt: Date.now(),
    };

    existing.push(version);
    this.versions.set(key, existing);

    // Initialize main branch if first commit
    if (newVersion === 1) {
      this.branches.set(key, [{ name: "main", agentId: params.agentId, tenantId: params.tenantId, headVersion: 1, createdAt: Date.now(), createdFrom: { branch: "main", version: 0 } }]);
      this.activeBranch.set(key, "main");
    } else {
      // Update branch head
      const branches = this.branches.get(key) || [];
      const active = this.activeBranch.get(key) || "main";
      const branch = branches.find((b) => b.name === active);
      if (branch) branch.headVersion = newVersion;
    }

    return version;
  }

  /**
   * Rollback to a previous version
   */
  rollback(agentId: string, targetVersion: number, author: string): RollbackResult | null {
    const existing = this.versions.get(agentId);
    if (!existing || existing.length === 0) return null;

    const target = existing.find((v) => v.version === targetVersion);
    if (!target) return null;

    const currentVersion = existing[existing.length - 1].version;
    if (targetVersion === currentVersion) return null;

    // Create a new version with the old content
    const restored = this.commit({
      agentId: target.agentId,
      tenantId: target.tenantId,
      content: target.content,
      message: `Rollback to v${targetVersion}: ${target.message}`,
      author,
      metadata: { rollbackFrom: currentVersion, rollbackTo: targetVersion },
    });
    restored.status = "rollback";

    return {
      success: true,
      previousVersion: currentVersion,
      restoredVersion: targetVersion,
      newVersion: restored,
    };
  }

  /**
   * Get the current active prompt for an agent
   */
  getCurrentPrompt(agentId: string): PromptVersion | null {
    const versions = this.versions.get(agentId);
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  /**
   * Get a specific version
   */
  getVersion(agentId: string, version: number): PromptVersion | null {
    const versions = this.versions.get(agentId);
    if (!versions) return null;
    return versions.find((v) => v.version === version) || null;
  }

  /**
   * Get full history for an agent
   */
  getHistory(agentId: string): PromptHistory | null {
    const versions = this.versions.get(agentId);
    if (!versions || versions.length === 0) return null;

    const branches = this.branches.get(agentId) || [];
    const tagMap: Record<string, number> = {};
    for (const v of versions) {
      for (const tag of v.tags) {
        tagMap[tag] = v.version;
      }
    }

    return {
      agentId,
      tenantId: versions[0].tenantId,
      currentVersion: versions[versions.length - 1].version,
      totalVersions: versions.length,
      branches: branches.map((b) => b.name),
      tags: tagMap,
      versions: [...versions].reverse(),
    };
  }

  /**
   * Tag a version (e.g., "production", "staging", "v2.0")
   */
  tag(agentId: string, version: number, tagName: string): boolean {
    const versions = this.versions.get(agentId);
    if (!versions) return false;

    const v = versions.find((v) => v.version === version);
    if (!v) return false;

    // Remove tag from other versions
    for (const other of versions) {
      other.tags = other.tags.filter((t) => t !== tagName);
    }
    v.tags.push(tagName);
    return true;
  }

  /**
   * Create a branch for A/B testing prompts
   */
  createBranch(agentId: string, branchName: string): PromptBranch | null {
    const existing = this.branches.get(agentId) || [];
    if (existing.some((b) => b.name === branchName)) return null;

    const versions = this.versions.get(agentId);
    if (!versions || versions.length === 0) return null;

    const currentBranch = this.activeBranch.get(agentId) || "main";
    const branch: PromptBranch = {
      name: branchName,
      agentId,
      tenantId: versions[0].tenantId,
      headVersion: versions[versions.length - 1].version,
      createdAt: Date.now(),
      createdFrom: { branch: currentBranch, version: versions[versions.length - 1].version },
    };

    existing.push(branch);
    this.branches.set(agentId, existing);
    return branch;
  }

  /**
   * Switch active branch
   */
  switchBranch(agentId: string, branchName: string): boolean {
    const branches = this.branches.get(agentId) || [];
    if (!branches.some((b) => b.name === branchName)) return false;
    this.activeBranch.set(agentId, branchName);
    return true;
  }

  /**
   * Compare two versions
   */
  compare(agentId: string, versionA: number, versionB: number): { diff: DiffEntry[]; summary: string } | null {
    const versions = this.versions.get(agentId);
    if (!versions) return null;

    const a = versions.find((v) => v.version === versionA);
    const b = versions.find((v) => v.version === versionB);
    if (!a || !b) return null;

    const diff = this.computeDiff(a.content, b.content);
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    const summary = `${added} line(s) added, ${removed} line(s) removed between v${versionA} and v${versionB}`;

    return { diff, summary };
  }

  /**
   * List all agents with version history for a tenant
   */
  listAgents(tenantId: string): { agentId: string; currentVersion: number; totalVersions: number }[] {
    const result: { agentId: string; currentVersion: number; totalVersions: number }[] = [];
    for (const [agentId, versions] of this.versions) {
      if (versions.length > 0 && versions[0].tenantId === tenantId) {
        result.push({
          agentId,
          currentVersion: versions[versions.length - 1].version,
          totalVersions: versions.length,
        });
      }
    }
    return result;
  }

  // ─── Private ─────────────────────────────

  private computeDiff(oldContent: string, newContent: string): DiffEntry[] {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    const diff: DiffEntry[] = [];
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = i < oldLines.length ? oldLines[i] : undefined;
      const newLine = i < newLines.length ? newLines[i] : undefined;

      if (oldLine === newLine) {
        diff.push({ type: "unchanged", line: i + 1, content: newLine! });
      } else {
        if (oldLine !== undefined) {
          diff.push({ type: "removed", line: i + 1, content: oldLine });
        }
        if (newLine !== undefined) {
          diff.push({ type: "added", line: i + 1, content: newLine });
        }
      }
    }
    return diff;
  }
}

// ─── Singleton ─────────────────────────────

let engine: PromptVersioningEngine | null = null;
export function getPromptVersioningEngine(): PromptVersioningEngine {
  if (!engine) engine = new PromptVersioningEngine();
  return engine;
}
