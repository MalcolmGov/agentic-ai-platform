/**
 * Agent Registry — Central registry for all agent types
 * 
 * Maps agent type identifiers to their constructors,
 * enabling dynamic agent instantiation from configuration.
 */

import { BaseAgent, AgentConfig } from "./base-agent";

type AgentConstructor = new (config: AgentConfig) => BaseAgent;

class AgentRegistryImpl {
  private registry = new Map<string, AgentConstructor>();

  /**
   * Register a new agent type
   */
  register(type: string, constructor: AgentConstructor): void {
    if (this.registry.has(type)) {
      console.warn(`Agent type "${type}" is already registered. Overwriting.`);
    }
    this.registry.set(type, constructor);
    console.log(`✅ Registered agent type: ${type}`);
  }

  /**
   * Create an agent instance from config
   */
  create(config: AgentConfig): BaseAgent {
    const Constructor = this.registry.get(config.type);
    if (!Constructor) {
      throw new Error(
        `Unknown agent type: "${config.type}". ` +
        `Available types: ${this.list().join(", ")}`
      );
    }
    return new Constructor(config);
  }

  /**
   * List all registered agent types
   */
  list(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if an agent type is registered
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }
}

// Singleton instance
export const AgentRegistry = new AgentRegistryImpl();
