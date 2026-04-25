import { useState, useCallback } from 'react'
import { AgentConfig, AgentMessage } from './types'
import { useAgenticContext } from './AgenticProvider'

export interface UseAgentReturn {
  messages: AgentMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
  clearMessages: () => void
  agentId: string
}

export function useAgent(config: AgentConfig): UseAgentReturn {
  const { config: providerConfig } = useAgenticContext()
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      const baseUrl = providerConfig.baseUrl ?? 'https://api.swifterai.io'
      const res = await fetch(`${baseUrl}/api/agents/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': providerConfig.apiKey,
          'X-App-ID': providerConfig.appId,
          'X-Market': providerConfig.market,
        },
        body: JSON.stringify({
          agentId: config.agentId,
          userMessage: text,
          systemPrompt: config.systemPrompt,
          model: config.model ?? 'gpt-4o-mini',
          language: config.language ?? 'en',
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Agent error')

      const assistantMsg: AgentMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        tokens: data.tokens,
        model: data.model,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [config, providerConfig])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, error, sendMessage, clearMessages, agentId: config.agentId }
}
