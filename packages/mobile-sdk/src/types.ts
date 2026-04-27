export interface AgenticConfig {
  apiKey: string
  appId: string
  market: string  // 'za' | 'ng' | 'ke' | etc
  department?: string
  baseUrl?: string  // defaults to 'https://api.{{YOUR_DOMAIN}}'
  theme?: {
    primaryColor?: string
    fontFamily?: string
    borderRadius?: number
  }
}

export interface AgentConfig {
  agentId: string
  systemPrompt?: string
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet'
  language?: string  // 'en', 'sw', 'fr', 'zu', etc
  welcomeMessage?: string
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
  model?: string
}

export interface MarketConfig {
  code: string
  name: string
  currency: string
  language: string[]
  complianceRegion: string
}
