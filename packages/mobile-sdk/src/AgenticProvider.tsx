import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AgenticConfig } from './types'

interface AgenticContextValue {
  config: AgenticConfig
  isConnected: boolean
}

const AgenticContext = createContext<AgenticContextValue | null>(null)

export function AgenticProvider({ config, children }: { config: AgenticConfig; children: ReactNode }) {
  const [isConnected] = useState(true)

  return (
    <AgenticContext.Provider value={{ config, isConnected }}>
      {children}
    </AgenticContext.Provider>
  )
}

export function useAgenticContext() {
  const ctx = useContext(AgenticContext)
  if (!ctx) throw new Error('useAgenticContext must be used inside <AgenticProvider>')
  return ctx
}
