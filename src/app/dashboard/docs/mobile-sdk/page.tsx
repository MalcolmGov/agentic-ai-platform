'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Section = 'installation' | 'quickstart' | 'configuration' | 'provider' | 'useagent' | 'agentchat' | 'usemarket' | 'markets' | 'ios' | 'android' | 'examples'

// ── Code block component ───────────────────────────────────────────────────────
function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative rounded-xl overflow-hidden my-4" style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[11px] text-text-muted font-mono">{language}</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-[11px] px-2 py-1 rounded font-medium transition-colors"
          style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: copied ? '#10b981' : 'rgba(255,255,255,0.5)' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-text-secondary whitespace-pre">{code}</pre>
    </div>
  )
}

// ── Prop table ─────────────────────────────────────────────────────────────────
function PropTable({ rows }: { rows: { prop: string; type: string; default?: string; desc: string }[] }) {
  return (
    <div className="rounded-xl overflow-hidden my-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['Prop', 'Type', 'Default', 'Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-text-muted font-semibold uppercase tracking-wider text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.prop} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td className="px-4 py-2.5 font-mono text-electric-400">{r.prop}</td>
              <td className="px-4 py-2.5 font-mono text-cyan-400/80">{r.type}</td>
              <td className="px-4 py-2.5 text-text-muted">{r.default ?? '—'}</td>
              <td className="px-4 py-2.5 text-text-secondary">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Sidebar nav ────────────────────────────────────────────────────────────────
const NAV: { id: Section; label: string; group?: string }[] = [
  { id: 'installation', label: 'Installation', group: 'Getting Started' },
  { id: 'quickstart', label: 'Quick Start', group: 'Getting Started' },
  { id: 'configuration', label: 'Configuration', group: 'API Reference' },
  { id: 'provider', label: 'AgenticProvider', group: 'API Reference' },
  { id: 'useagent', label: 'useAgent Hook', group: 'API Reference' },
  { id: 'agentchat', label: 'AgentChat', group: 'API Reference' },
  { id: 'usemarket', label: 'useMarket Hook', group: 'API Reference' },
  { id: 'markets', label: 'Markets Reference', group: 'Reference' },
  { id: 'ios', label: 'iOS Integration', group: 'Platform Guides' },
  { id: 'android', label: 'Android Integration', group: 'Platform Guides' },
  { id: 'examples', label: 'Examples', group: 'Platform Guides' },
]

// ── Content sections ───────────────────────────────────────────────────────────
function Content({ section }: { section: Section }) {
  switch (section) {
    case 'installation': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Installation</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Install the AI Platform Mobile SDK via npm or yarn. The SDK supports React Native 0.73+ and requires peer dependencies for React 18+.</p>
        <CodeBlock language="bash" code={`npm install @agentic-ai/sdk\n# or\nyarn add @agentic-ai/sdk\n# or\npnpm add @agentic-ai/sdk`} />
        <div className="p-4 rounded-xl my-4" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-xs text-blue-400/90 leading-relaxed">ℹ️ The SDK is compatible with <strong>Expo SDK 50+</strong> and bare React Native. For Expo Go, some native modules may require a development build.</p>
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">Peer Dependencies</h3>
        <CodeBlock language="json" code={`{\n  "react": ">=18.0.0",\n  "react-native": ">=0.73.0"\n}`} />
      </div>
    )

    case 'quickstart': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Quick Start</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Get a working AI agent chat in your app in under 5 minutes.</p>
        <h3 className="text-sm font-bold text-text-primary mb-2">1. Wrap your app with AgenticProvider</h3>
        <CodeBlock code={`import { AgenticProvider } from '@agentic-ai/sdk'\n\nexport default function App() {\n  return (\n    <AgenticProvider\n      config={{\n        apiKey: 'your_api_key',\n        appId: 'za-main-website',   // from Apps & Properties page\n        market: 'za',              // South Africa pilot\n      }}\n    >\n      <YourAppNavigator />\n    </AgenticProvider>\n  )\n}`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">2. Add the AgentChat component</h3>
        <CodeBlock code={`import { AgentChat } from '@agentic-ai/sdk'\n\nexport function SupportScreen() {\n  return (\n    <AgentChat\n      agentConfig={{\n        agentId: 'support-ticket-classifier',\n        welcomeMessage: 'Hi! How can I help you today? 👋',\n        language: 'en',\n      }}\n      style={{ flex: 1 }}\n    />\n  )\n}`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">3. Or use the hook directly</h3>
        <CodeBlock code={`import { useAgent } from '@agentic-ai/sdk'\n\nfunction MyComponent() {\n  const { messages, sendMessage, isLoading } = useAgent({\n    agentId: 'hr-policy-qa',\n  })\n\n  return (\n    <Button\n      title="Ask HR"\n      onPress={() => sendMessage('What is the leave policy?')}\n    />\n  )\n}`} />
      </div>
    )

    case 'configuration': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Configuration</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Pass configuration to <code className="font-mono text-electric-400">AgenticProvider</code>. Your API key and App ID are available in the dashboard under Apps & Properties.</p>
        <PropTable rows={[
          { prop: 'apiKey', type: 'string', desc: 'Your AI Platform API key. Find it in Settings → API Keys.' },
          { prop: 'appId', type: 'string', desc: 'The ID of the app registered in Apps & Properties (e.g. za-ios-app).' },
          { prop: 'market', type: 'string', desc: "Active market code: 'za' | 'ng' | 'ke' | 'gh' | 'tz' | 'zm' | 'zw' | 'bw' | 'mz' | 'ci' | 'sn' | 'cm' | 'ug'." },
          { prop: 'department', type: 'string?', desc: 'Optional department context for filtering agents shown to the user.' },
          { prop: 'baseUrl', type: 'string?', default: "'https://api.{{YOUR_DOMAIN}}'", desc: 'Override the API base URL (useful for self-hosted or staging).' },
          { prop: 'theme.primaryColor', type: 'string?', default: "'#3b82f6'", desc: 'Accent colour for bubbles and buttons (hex or rgb).' },
          { prop: 'theme.fontFamily', type: 'string?', desc: 'Custom font family for chat messages.' },
          { prop: 'theme.borderRadius', type: 'number?', default: '16', desc: 'Border radius for chat bubbles.' },
        ]} />
      </div>
    )

    case 'provider': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">AgenticProvider</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Root provider that supplies SDK config to all child components and hooks. Must wrap your app or the screen that uses agents.</p>
        <CodeBlock code={`import { AgenticProvider } from '@agentic-ai/sdk'\n\n<AgenticProvider config={{\n  apiKey: string,\n  appId: string,\n  market: string,\n  department?: string,\n  baseUrl?: string,\n  theme?: { primaryColor?: string }\n}}>\n  {children}\n</AgenticProvider>`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">useAgenticContext</h3>
        <p className="text-xs text-text-muted mb-3">Access the provider config from any child component.</p>
        <CodeBlock code={`import { useAgenticContext } from '@agentic-ai/sdk'\n\nconst { config, isConnected } = useAgenticContext()`} />
      </div>
    )

    case 'useagent': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">useAgent Hook</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Core hook for sending messages to an agent and managing conversation state.</p>
        <CodeBlock code={`const {\n  messages,      // AgentMessage[]\n  isLoading,     // boolean\n  error,         // string | null\n  sendMessage,   // (text: string) => Promise<void>\n  clearMessages, // () => void\n  agentId,       // string\n} = useAgent(config: AgentConfig)`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">AgentConfig</h3>
        <PropTable rows={[
          { prop: 'agentId', type: 'string', desc: 'The deployed agent ID from My Agents page.' },
          { prop: 'systemPrompt', type: 'string?', desc: 'Override the default system prompt for this agent.' },
          { prop: 'model', type: 'string?', default: "'gpt-4o-mini'", desc: 'LLM model: gpt-4o | gpt-4o-mini | claude-3-5-sonnet | claude-3-haiku.' },
          { prop: 'language', type: 'string?', default: "'en'", desc: "BCP-47 language code: 'en' | 'sw' | 'fr' | 'zu' | 'af' | 'pcm' etc." },
          { prop: 'welcomeMessage', type: 'string?', desc: 'First message shown when the chat opens.' },
        ]} />
      </div>
    )

    case 'agentchat': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">AgentChat Component</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">A complete, styled chat UI component. Drop it into any screen — it handles messages, loading states, errors, and keyboard avoidance.</p>
        <CodeBlock code={`import { AgentChat } from '@agentic-ai/sdk'\n\n<AgentChat\n  agentConfig={{ agentId: 'support-whatsapp-bot', language: 'en' }}\n  style={{ flex: 1 }}\n  inputPlaceholder="Type a message..."\n  showTimestamps={true}\n/>`} />
        <PropTable rows={[
          { prop: 'agentConfig', type: 'AgentConfig', desc: 'Agent configuration (see useAgent).' },
          { prop: 'style', type: 'ViewStyle?', desc: 'Style overrides for the outer container.' },
          { prop: 'inputPlaceholder', type: 'string?', default: "'Ask me anything...'", desc: 'Placeholder text for the input field.' },
          { prop: 'showTimestamps', type: 'boolean?', default: 'false', desc: 'Show message timestamps and token count.' },
        ]} />
      </div>
    )

    case 'usemarket': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">useMarket Hook</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Returns the market config for the active market set in AgenticProvider. Use this to localise currency, language, and compliance messaging.</p>
        <CodeBlock code={`import { useMarket } from '@agentic-ai/sdk'\n\nfunction PriceDisplay({ amount }: { amount: number }) {\n  const market = useMarket()\n  const formatted = new Intl.NumberFormat(market?.code ?? 'en-ZA', {\n    style: 'currency',\n    currency: market?.currency ?? 'ZAR',\n  }).format(amount)\n  return <Text>{formatted}</Text>\n}`} />
      </div>
    )

    case 'markets': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Markets Reference</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">The SDK supports all 13 African markets on the platform. Pass the market code to AgenticProvider.</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-xs">
            <thead><tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Flag', 'Code', 'Name', 'Currency', 'Languages', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-text-muted font-semibold uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { flag:'🇿🇦', code:'za', name:'South Africa', currency:'ZAR', langs:'en, zu, af', status:'pilot' },
                { flag:'🇳🇬', code:'ng', name:'Nigeria', currency:'NGN', langs:'en, pcm', status:'available' },
                { flag:'🇰🇪', code:'ke', name:'Kenya', currency:'KES', langs:'en, sw', status:'available' },
                { flag:'🇬🇭', code:'gh', name:'Ghana', currency:'GHS', langs:'en', status:'available' },
                { flag:'🇹🇿', code:'tz', name:'Tanzania', currency:'TZS', langs:'sw, en', status:'available' },
                { flag:'🇿🇲', code:'zm', name:'Zambia', currency:'ZMW', langs:'en', status:'available' },
                { flag:'🇿🇼', code:'zw', name:'Zimbabwe', currency:'USD', langs:'en, sn, nd', status:'available' },
                { flag:'🇧🇼', code:'bw', name:'Botswana', currency:'BWP', langs:'en, tn', status:'coming_soon' },
                { flag:'🇲🇿', code:'mz', name:'Mozambique', currency:'MZN', langs:'pt', status:'coming_soon' },
                { flag:'🇨🇮', code:'ci', name:"Côte d'Ivoire", currency:'XOF', langs:'fr', status:'coming_soon' },
                { flag:'🇸🇳', code:'sn', name:'Senegal', currency:'XOF', langs:'fr, wo', status:'coming_soon' },
                { flag:'🇨🇲', code:'cm', name:'Cameroon', currency:'XAF', langs:'fr, en', status:'coming_soon' },
                { flag:'🇺🇬', code:'ug', name:'Uganda', currency:'UGX', langs:'en, lg', status:'coming_soon' },
              ].map((m, i) => (
                <tr key={m.code} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td className="px-3 py-2">{m.flag}</td>
                  <td className="px-3 py-2 font-mono text-electric-400">{m.code}</td>
                  <td className="px-3 py-2 text-text-primary">{m.name}</td>
                  <td className="px-3 py-2 font-mono text-text-muted">{m.currency}</td>
                  <td className="px-3 py-2 text-text-muted">{m.langs}</td>
                  <td className="px-3 py-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
                      background: m.status === 'pilot' ? 'rgba(16,185,129,0.15)' : m.status === 'available' ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.15)',
                      color: m.status === 'pilot' ? '#10b981' : m.status === 'available' ? '#3b82f6' : '#6b7280',
                    }}>{m.status === 'coming_soon' ? 'Soon' : m.status.charAt(0).toUpperCase() + m.status.slice(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )

    case 'ios': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">iOS Integration</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Additional setup steps required for iOS native builds.</p>
        <h3 className="text-sm font-bold text-text-primary mb-2">1. Add network permission to Info.plist</h3>
        <CodeBlock language="xml" code={`<key>NSAppTransportSecurity</key>\n<dict>\n  <key>NSAllowsArbitraryLoads</key>\n  <false/>\n  <key>NSExceptionDomains</key>\n  <dict>\n    <key>api.{{YOUR_DOMAIN}}</key>\n    <dict>\n      <key>NSExceptionAllowsInsecureHTTPLoads</key>\n      <false/>\n      <key>NSIncludesSubdomains</key>\n      <true/>\n    </dict>\n  </dict>\n</dict>`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">2. Install Pods</h3>
        <CodeBlock language="bash" code={`cd ios && pod install`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">3. Minimum deployment target</h3>
        <p className="text-xs text-text-muted mb-2">Set iOS deployment target to 14.0+ in Xcode or Podfile:</p>
        <CodeBlock language="ruby" code={`platform :ios, '14.0'`} />
      </div>
    )

    case 'android': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Android Integration</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">Additional setup steps for Android builds.</p>
        <h3 className="text-sm font-bold text-text-primary mb-2">1. Add internet permission to AndroidManifest.xml</h3>
        <CodeBlock language="xml" code={`<uses-permission android:name="android.permission.INTERNET" />`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">2. Minimum SDK</h3>
        <p className="text-xs text-text-muted mb-2">Set <code className="font-mono text-electric-400">minSdkVersion</code> to 21+ in <code className="font-mono text-electric-400">android/build.gradle</code>:</p>
        <CodeBlock language="groovy" code={`android {\n  defaultConfig {\n    minSdkVersion 21\n    targetSdkVersion 34\n  }\n}`} />
        <h3 className="text-sm font-bold text-text-primary mb-2 mt-6">3. ProGuard rules (release builds)</h3>
        <CodeBlock language="text" code={`-keep class io.agenticai.** { *; }\n-dontwarn io.agenticai.**`} />
      </div>
    )

    case 'examples': return (
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Examples</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-1">HR Leave Request Bot (South Africa)</h3>
            <p className="text-xs text-text-muted mb-3">Deploy an HR agent inside the employee self-service app.</p>
            <CodeBlock code={`import { AgenticProvider, AgentChat } from '@agentic-ai/sdk'\n\nexport function HRScreen() {\n  return (\n    <AgenticProvider config={{ apiKey: 'sk_...', appId: 'za-employee-portal', market: 'za', department: 'HR' }}>\n      <AgentChat\n        agentConfig={{\n          agentId: 'hr-leave-handler',\n          welcomeMessage: 'Hi! I can process leave requests and answer HR questions.',\n          language: 'en',\n        }}\n        showTimestamps\n      />\n    </AgenticProvider>\n  )\n}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-1">Multi-Market Customer Support Bot</h3>
            <p className="text-xs text-text-muted mb-3">Switch markets dynamically based on user location.</p>
            <CodeBlock code={`import { AgenticProvider, AgentChat } from '@agentic-ai/sdk'\n\nexport function SupportScreen({ userMarket }: { userMarket: 'za' | 'ng' | 'ke' }) {\n  const langMap = { za: 'en', ng: 'en', ke: 'sw' }\n  return (\n    <AgenticProvider config={{ apiKey: 'sk_...', appId: \`\${userMarket}-main-website\`, market: userMarket }}>\n      <AgentChat\n        agentConfig={{\n          agentId: 'support-ticket-classifier',\n          language: langMap[userMarket],\n          welcomeMessage: 'Hello! How can we help you today?',\n        }}\n      />\n    </AgenticProvider>\n  )\n}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-1">Custom useAgent Integration</h3>
            <p className="text-xs text-text-muted mb-3">Use the hook directly for custom UI patterns.</p>
            <CodeBlock code={`import { useAgent } from '@agentic-ai/sdk'\n\nexport function QuickAsk() {\n  const { sendMessage, messages, isLoading } = useAgent({ agentId: 'legal-policy-qa' })\n  const lastReply = messages.filter(m => m.role === 'assistant').at(-1)\n\n  return (\n    <View>\n      {lastReply && <Text>{lastReply.content}</Text>}\n      <Button\n        disabled={isLoading}\n        title={isLoading ? 'Thinking...' : 'Ask about NDA policy'}\n        onPress={() => sendMessage('What does our standard NDA cover?')}\n      />\n    </View>\n  )\n}`} />
          </div>
        </div>
      </div>
    )

    default: return null
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MobileSDKDocsPage() {
  const [active, setActive] = useState<Section>('installation')
  let lastGroup = ''

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border overflow-y-auto p-4 space-y-0.5">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📦</span>
            <span className="text-sm font-bold text-text-primary">Mobile SDK</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-electric-500/15 text-electric-400">v0.1.0</span>
          <span className="text-[10px] text-text-muted ml-2">React Native · iOS · Android</span>
        </div>

        {NAV.map(item => {
          const showGroup = item.group !== lastGroup
          if (showGroup) lastGroup = item.group ?? ''
          return (
            <div key={item.id}>
              {showGroup && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted pt-4 pb-1 px-2">{item.group}</p>
              )}
              <button
                onClick={() => setActive(item.id)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
                style={active === item.id
                  ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 600 }
                  : { color: 'rgba(255,255,255,0.5)' }}
              >
                {item.label}
              </button>
            </div>
          )
        })}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {/* Header breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <span>Docs</span><span>›</span><span className="text-text-primary">Mobile SDK</span>
        </div>

        <Content section={active} />

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
          <button
            onClick={() => {
              const idx = NAV.findIndex(n => n.id === active)
              if (idx > 0) setActive(NAV[idx - 1].id)
            }}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              const idx = NAV.findIndex(n => n.id === active)
              if (idx < NAV.length - 1) setActive(NAV[idx + 1].id)
            }}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  )
}
