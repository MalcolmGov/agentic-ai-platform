'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { DEPARTMENTS } from '@/lib/departments'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPT_OPTIONS = Object.values(DEPARTMENTS).map(d => ({ id: d.id, label: d.label, icon: d.icon }))

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'gemini-1-5-pro', label: 'Gemini 1.5 Pro' },
]

const NODE_COLORS: Record<string, string> = {
  input: '#3b82f6',
  llm: '#8b5cf6',
  tool: '#10b981',
  router: '#f59e0b',
  output: '#0d9488',
}

const NODE_ICONS: Record<string, string> = {
  input: '📥',
  llm: '🧠',
  tool: '🔧',
  router: '🔀',
  output: '📤',
}

const TOOL_TYPES = ['Search', 'Calculator', 'Database', 'API Call', 'Email', 'WhatsApp Send']
const INPUT_SOURCES = ['User message', 'Webhook', 'Schedule', 'File upload']
const OUTPUT_DESTS = ['WhatsApp', 'Web widget', 'Email', 'API response', 'Slack']

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic_studio_flow_v1'

interface StudioState {
  agentName: string
  department: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  nodes: Node[]
  edges: Edge[]
  savedAt: string
}

function persistFlow(data: Omit<StudioState, 'savedAt'>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }))
}

function hydrateFlow(): StudioState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StudioState) : null
  } catch {
    return null
  }
}

// ─── Default flow factory ─────────────────────────────────────────────────────

function makeDefaultFlow(model = 'gpt-4o-mini', systemPrompt = 'You are a helpful AI assistant.'): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 160, y: 60 },
        data: { label: 'User Input', description: 'Message from user/channel', source: 'User message' },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 160, y: 240 },
        data: { label: 'AI Brain', model, systemPrompt },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 160, y: 420 },
        data: { label: 'Response', destinations: ['WhatsApp', 'Web widget'] },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'llm-1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e2-3', source: 'llm-1', target: 'output-1', animated: true, style: { stroke: '#0d9488', strokeWidth: 2 } },
    ],
  }
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function btn(bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: bg,
    color,
    border: bg.startsWith('rgba') || bg === 'transparent' ? '1px solid rgba(59,130,246,0.18)' : 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...extra,
  }
}

// ─── Node wrapper ─────────────────────────────────────────────────────────────

function NodeShell({
  type,
  selected,
  children,
}: {
  type: string
  selected: boolean
  children: React.ReactNode
}) {
  const color = NODE_COLORS[type] ?? '#94a3b8'
  return (
    <div
      style={{
        background: 'rgba(13,19,36,0.97)',
        border: `1.5px solid ${selected ? color : 'rgba(59,130,246,0.18)'}`,
        borderRadius: 12,
        width: 200,
        overflow: 'hidden',
        boxShadow: selected ? `0 0 24px ${color}55, 0 4px 16px rgba(0,0,0,0.4)` : '0 4px 16px rgba(0,0,0,0.35)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          background: `${color}1a`,
          borderBottom: `1px solid ${color}33`,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13 }}>{NODE_ICONS[type] ?? '⬡'}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {type}
        </span>
      </div>
      <div style={{ padding: '8px 10px' }}>{children}</div>
    </div>
  )
}

function NodeLabel({ text }: { text: string }) {
  return (
    <p style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {text}
    </p>
  )
}

function NodePill({ color, text }: { color: string; text: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 20,
        background: `${color}1f`,
        color,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  )
}

function NodeSub({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </p>
  )
}

function handle(type: 'source' | 'target', pos: Position, nodeType: string, id?: string) {
  return (
    <Handle
      type={type}
      position={pos}
      id={id}
      style={{
        background: NODE_COLORS[nodeType] ?? '#94a3b8',
        border: '2px solid #060a14',
        width: 10,
        height: 10,
      }}
    />
  )
}

// ─── Custom node components ───────────────────────────────────────────────────

function InputNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>
  return (
    <NodeShell type="input" selected={!!selected}>
      {handle('source', Position.Bottom, 'input')}
      <NodeLabel text={String(d.label ?? 'User Input')} />
      <NodeSub text={String(d.description ?? 'Message from user/channel')} />
      {!!d.source && <NodePill color={NODE_COLORS.input} text={String(d.source)} />}
    </NodeShell>
  )
}

function LLMNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>
  const prompt = String(d.systemPrompt ?? '')
  return (
    <NodeShell type="llm" selected={!!selected}>
      {handle('target', Position.Top, 'llm')}
      {handle('source', Position.Bottom, 'llm')}
      <NodeLabel text={String(d.label ?? 'LLM Node')} />
      <NodePill color={NODE_COLORS.llm} text={String(d.model ?? 'gpt-4o-mini')} />
      {prompt && <NodeSub text={prompt.slice(0, 48) + (prompt.length > 48 ? '…' : '')} />}
    </NodeShell>
  )
}

function ToolNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>
  return (
    <NodeShell type="tool" selected={!!selected}>
      {handle('target', Position.Top, 'tool')}
      {handle('source', Position.Bottom, 'tool')}
      <NodeLabel text={String(d.label ?? 'Tool Node')} />
      <NodePill color={NODE_COLORS.tool} text={String(d.toolType ?? 'API Call')} />
      {!!d.endpoint && <NodeSub text={String(d.endpoint)} />}
    </NodeShell>
  )
}

function RouterNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>
  return (
    <NodeShell type="router" selected={!!selected}>
      {handle('target', Position.Top, 'router')}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{ background: NODE_COLORS.router, border: '2px solid #060a14', width: 10, height: 10, left: '33%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ background: NODE_COLORS.router, border: '2px solid #060a14', width: 10, height: 10, left: '67%' }}
      />
      <NodeLabel text={String(d.label ?? 'Router')} />
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <NodePill color={NODE_COLORS.router} text={String(d.branchA ?? 'Branch A')} />
        <NodePill color={NODE_COLORS.router} text={String(d.branchB ?? 'Branch B')} />
      </div>
      {!!d.condition && <NodeSub text={`if: ${String(d.condition)}`} />}
    </NodeShell>
  )
}

function OutputNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>
  const dests = (d.destinations as string[]) ?? ['WhatsApp', 'Web widget']
  const icons: Record<string, string> = {
    WhatsApp: '💬',
    'Web widget': '🌐',
    Email: '✉️',
    'API response': '📡',
    Slack: '💼',
  }
  return (
    <NodeShell type="output" selected={!!selected}>
      {handle('target', Position.Top, 'output')}
      <NodeLabel text={String(d.label ?? 'Response')} />
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        {dests.map(dest => (
          <NodePill key={dest} color={NODE_COLORS.output} text={`${icons[dest] ?? '📤'} ${dest}`} />
        ))}
      </div>
    </NodeShell>
  )
}

const NODE_TYPES = {
  input: InputNode,
  llm: LLMNode,
  tool: ToolNode,
  router: RouterNode,
  output: OutputNode,
}

// ─── Sub-panel helpers ────────────────────────────────────────────────────────

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Inspector panel ──────────────────────────────────────────────────────────

function InspectorPanel({
  node,
  onUpdate,
  globalModel,
  globalTemp,
  globalPrompt,
}: {
  node: Node
  onUpdate: (u: Record<string, unknown>) => void
  globalModel: string
  globalTemp: number
  globalPrompt: string
}) {
  const d = node.data as Record<string, unknown>
  const color = NODE_COLORS[node.type ?? ''] ?? '#94a3b8'
  const dests = (d.destinations as string[]) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            background: `${color}1f`,
            color,
            textTransform: 'uppercase',
          }}
        >
          {node.type}
        </span>
        <span style={{ fontSize: 11, color: '#64748b' }}>#{node.id}</span>
      </div>

      <PanelField label="Node Label">
        <input
          className="studio-input"
          value={String(d.label ?? '')}
          onChange={e => onUpdate({ label: e.target.value })}
        />
      </PanelField>

      {node.type === 'input' && (
        <PanelField label="Input Source">
          <select
            className="studio-input"
            value={String(d.source ?? 'User message')}
            onChange={e => onUpdate({ source: e.target.value })}
          >
            {INPUT_SOURCES.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </PanelField>
      )}

      {node.type === 'llm' && (
        <>
          <PanelField label="Model">
            <select
              className="studio-input"
              value={String(d.model ?? globalModel)}
              onChange={e => onUpdate({ model: e.target.value })}
            >
              {MODEL_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </PanelField>
          <PanelField label={`Temperature: ${Number(d.temperature ?? globalTemp).toFixed(1)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={Number(d.temperature ?? globalTemp)}
              onChange={e => onUpdate({ temperature: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </PanelField>
          <PanelField label="System Prompt">
            <textarea
              className="studio-input"
              rows={5}
              value={String(d.systemPrompt ?? globalPrompt)}
              onChange={e => onUpdate({ systemPrompt: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </PanelField>
        </>
      )}

      {node.type === 'tool' && (
        <>
          <PanelField label="Tool Type">
            <select
              className="studio-input"
              value={String(d.toolType ?? 'API Call')}
              onChange={e => onUpdate({ toolType: e.target.value })}
            >
              {TOOL_TYPES.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </PanelField>
          <PanelField label="API Endpoint">
            <input
              className="studio-input"
              value={String(d.endpoint ?? '')}
              onChange={e => onUpdate({ endpoint: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </PanelField>
          <PanelField label="Auth Token">
            <input
              type="password"
              className="studio-input"
              value={String(d.authToken ?? '')}
              onChange={e => onUpdate({ authToken: e.target.value })}
              placeholder="Bearer sk-..."
            />
          </PanelField>
        </>
      )}

      {node.type === 'router' && (
        <>
          <PanelField label="Route if message contains">
            <input
              className="studio-input"
              value={String(d.condition ?? '')}
              onChange={e => onUpdate({ condition: e.target.value })}
              placeholder="e.g. urgent, help, refund"
            />
          </PanelField>
          <PanelField label="Branch A Label">
            <input
              className="studio-input"
              value={String(d.branchA ?? 'Branch A')}
              onChange={e => onUpdate({ branchA: e.target.value })}
            />
          </PanelField>
          <PanelField label="Branch B Label">
            <input
              className="studio-input"
              value={String(d.branchB ?? 'Branch B')}
              onChange={e => onUpdate({ branchB: e.target.value })}
            />
          </PanelField>
        </>
      )}

      {node.type === 'output' && (
        <PanelField label="Output Destinations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {OUTPUT_DESTS.map(dest => {
              const checked = dests.includes(dest)
              const icons: Record<string, string> = {
                WhatsApp: '💬',
                'Web widget': '🌐',
                Email: '✉️',
                'API response': '📡',
                Slack: '💼',
              }
              return (
                <label
                  key={dest}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onUpdate({
                        destinations: checked ? dests.filter((x: string) => x !== dest) : [...dests, dest],
                      })
                    }
                    style={{ accentColor: '#0d9488', width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    {icons[dest] ?? '📤'} {dest}
                  </span>
                </label>
              )
            })}
          </div>
        </PanelField>
      )}
    </div>
  )
}

// ─── Test panel ───────────────────────────────────────────────────────────────

interface TestResult {
  response: string
  model: string
  tokens: number
  latency: number
}

function TestPanel({
  testMessage,
  setTestMessage,
  testLoading,
  testResult,
  onTest,
  onBack,
}: {
  testMessage: string
  setTestMessage: (v: string) => void
  testLoading: boolean
  testResult: TestResult | null
  onTest: () => void
  onBack: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>🧪 Test Agent</h3>
        <button onClick={onBack} style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Inspector
        </button>
      </div>

      <div
        style={{
          flex: 1,
          background: 'rgba(6,10,20,0.6)',
          borderRadius: 10,
          padding: 12,
          overflowY: 'auto',
          border: '1px solid rgba(59,130,246,0.12)',
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {testLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#3b82f6',
                animation: 'pulse-ring 1s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 12, color: '#64748b' }}>Agent thinking…</span>
          </div>
        )}

        {testResult && (
          <>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(139,92,246,0.15)',
                  color: '#a78bfa',
                }}
              >
                {testResult.model}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(16,185,129,0.15)',
                  color: '#34d399',
                }}
              >
                {testResult.tokens} tokens
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                }}
              >
                {testResult.latency}ms
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#94a3b8',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {testResult.response}
            </div>
          </>
        )}

        {!testLoading && !testResult && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center' }}>
              Type a message below and press Send to test your agent
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="studio-input"
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          placeholder="Ask your agent…"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !testLoading && testMessage.trim()) onTest()
          }}
          style={{ flex: 1 }}
        />
        <button
          onClick={onTest}
          disabled={testLoading || !testMessage.trim()}
          style={{
            ...btn('#3b82f6', '#fff'),
            padding: '8px 16px',
            opacity: testLoading || !testMessage.trim() ? 0.45 : 1,
            cursor: testLoading || !testMessage.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentStudioPage() {
  const defaultFlow = makeDefaultFlow()

  const [agentName, setAgentName] = useState('My Agent')
  const [department, setDepartment] = useState('HR')
  const [model, setModel] = useState('gpt-4o-mini')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultFlow.edges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const [panelMode, setPanelMode] = useState<'inspector' | 'test'>('inspector')
  const [testMessage, setTestMessage] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nodeCounter = useRef(20)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = hydrateFlow()
    if (!saved) return
    setAgentName(saved.agentName)
    setDepartment(saved.department)
    setModel(saved.model)
    setTemperature(saved.temperature)
    setMaxTokens(saved.maxTokens)
    setSystemPrompt(saved.systemPrompt)
    if (saved.nodes?.length) setNodes(saved.nodes)
    if (saved.edges?.length) setEdges(saved.edges)
    setLastSavedAt(new Date(saved.savedAt))
    setSaveStatus('saved')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced auto-save
  const triggerSave = useCallback(
    (
      name: string,
      dept: string,
      mdl: string,
      temp: number,
      tok: number,
      prompt: string,
      ns: Node[],
      es: Edge[],
    ) => {
      setSaveStatus('unsaved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        setSaveStatus('saving')
        persistFlow({ agentName: name, department: dept, model: mdl, temperature: temp, maxTokens: tok, systemPrompt: prompt, nodes: ns, edges: es })
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      }, 2000)
    },
    [],
  )

  useEffect(() => {
    triggerSave(agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges)
  }, [agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges, triggerSave])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(eds =>
        addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds),
      )
    },
    [setEdges],
  )

  const onNodeClick = useCallback((_evt: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setPanelMode('inspector')
  }, [])

  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  const updateSelectedNode = useCallback(
    (updates: Record<string, unknown>) => {
      if (!selectedNode) return
      setNodes(nds =>
        nds.map(n => (n.id === selectedNode.id ? { ...n, data: { ...n.data, ...updates } } : n)),
      )
      setSelectedNode(prev => (prev ? { ...prev, data: { ...prev.data, ...updates } } : null))
    },
    [selectedNode, setNodes],
  )

  const addNode = useCallback(
    (type: string) => {
      const id = `${type}-${++nodeCounter.current}`
      const defaults: Record<string, Record<string, unknown>> = {
        input: { label: 'User Input', description: 'Message from user/channel', source: 'User message' },
        llm: { label: 'LLM Node', model, systemPrompt },
        tool: { label: 'Tool Node', toolType: 'API Call', endpoint: '' },
        router: { label: 'Router', condition: '', branchA: 'Branch A', branchB: 'Branch B' },
        output: { label: 'Response', destinations: ['Web widget'] },
      }
      const newNode: Node = {
        id,
        type,
        position: { x: 80 + Math.random() * 280, y: 80 + Math.random() * 280 },
        data: defaults[type] ?? { label: type },
      }
      setNodes(nds => [...nds, newNode])
    },
    [model, systemPrompt, setNodes],
  )

  const handleNewAgent = useCallback(() => {
    const fresh = makeDefaultFlow('gpt-4o-mini', 'You are a helpful AI assistant.')
    setAgentName('My Agent')
    setDepartment('HR')
    setModel('gpt-4o-mini')
    setTemperature(0.7)
    setMaxTokens(2048)
    setSystemPrompt('You are a helpful AI assistant.')
    setNodes(fresh.nodes)
    setEdges(fresh.edges)
    setSelectedNode(null)
    setTestResult(null)
  }, [setNodes, setEdges])

  const handleExport = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agentName.replace(/\s+/g, '-').toLowerCase()}-flow.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string) as Partial<StudioState>
          if (data.agentName) setAgentName(data.agentName)
          if (data.department) setDepartment(data.department)
          if (data.model) setModel(data.model)
          if (data.temperature !== undefined) setTemperature(data.temperature)
          if (data.maxTokens) setMaxTokens(data.maxTokens)
          if (data.systemPrompt) setSystemPrompt(data.systemPrompt)
          if (data.nodes?.length) setNodes(data.nodes)
          if (data.edges?.length) setEdges(data.edges)
        } catch {
          alert('Invalid JSON file — could not parse flow.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [setNodes, setEdges])

  const handleSaveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    persistFlow({ agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges })
    setLastSavedAt(new Date())
    setSaveStatus('saved')
  }, [agentName, department, model, temperature, maxTokens, systemPrompt, nodes, edges])

  const handleTest = useCallback(async () => {
    if (!testMessage.trim()) return
    setTestLoading(true)
    setTestResult(null)
    const start = Date.now()
    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'studio-preview',
          agentName,
          department,
          userMessage: testMessage,
          systemPrompt,
        }),
      })
      const data = (await res.json()) as { response?: string; error?: string; model?: string; tokens?: number }
      setTestResult({
        response: data.response ?? data.error ?? 'No response received.',
        model: data.model ?? model,
        tokens: data.tokens ?? 0,
        latency: Date.now() - start,
      })
    } catch {
      setTestResult({ response: 'Network error — check your connection.', model, tokens: 0, latency: Date.now() - start })
    } finally {
      setTestLoading(false)
    }
  }, [testMessage, agentName, department, systemPrompt, model])

  // Save status display
  const savedSecondsAgo = lastSavedAt ? Math.round((Date.now() - lastSavedAt.getTime()) / 1000) : null
  const saveLabel =
    saveStatus === 'saved'
      ? `● Saved${savedSecondsAgo !== null ? ` ${savedSecondsAgo}s ago` : ''}`
      : saveStatus === 'saving'
        ? '○ Saving…'
        : '○ Unsaved changes'

  // Add node button definitions
  const ADD_NODE_BTNS = [
    { type: 'input', label: '📥 Input' },
    { type: 'llm', label: '🧠 LLM' },
    { type: 'tool', label: '🔧 Tool' },
    { type: 'router', label: '🔀 Router' },
    { type: 'output', label: '📤 Output' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 4rem)',
        background: '#060a14',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 52,
          borderBottom: '1px solid rgba(59,130,246,0.15)',
          background: 'rgba(10,14,26,0.96)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Left: title + save status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Agent Studio</h1>
          <span
            style={{
              fontSize: 11,
              color: saveStatus === 'saved' ? '#10b981' : '#f59e0b',
              fontWeight: 500,
            }}
          >
            {saveLabel}
          </span>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleNewAgent} style={btn('rgba(26,39,68,0.8)', '#94a3b8')}>
            + New Agent
          </button>
          <button onClick={handleImport} style={btn('rgba(26,39,68,0.8)', '#94a3b8')}>
            Import JSON
          </button>
          <button onClick={handleExport} style={btn('rgba(26,39,68,0.8)', '#94a3b8')}>
            Export
          </button>
          <Link
            href="/dashboard/marketplace"
            style={{
              ...btn('#3b82f6', '#fff'),
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Deploy →
          </Link>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid rgba(59,130,246,0.15)',
            background: 'rgba(9,13,24,0.92)',
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <PanelSection title="Agent Configuration">
            <PanelField label="Agent Name">
              <input
                className="studio-input"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="My Agent"
              />
            </PanelField>

            <PanelField label="Department">
              <select
                className="studio-input"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                {DEPT_OPTIONS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.label}
                  </option>
                ))}
              </select>
            </PanelField>

            <PanelField label="AI Model">
              <select
                className="studio-input"
                value={model}
                onChange={e => setModel(e.target.value)}
              >
                {MODEL_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </PanelField>

            <PanelField label={`Temperature: ${temperature.toFixed(1)}`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                <span>0.0 — Precise</span>
                <span>1.0 — Creative</span>
              </div>
            </PanelField>

            <PanelField label="Max Tokens">
              <input
                type="number"
                className="studio-input"
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value) || 2048)}
                min={256}
                max={8192}
                step={256}
              />
            </PanelField>

            <PanelField label="System Prompt">
              <textarea
                className="studio-input"
                rows={6}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant…"
                style={{ resize: 'vertical' }}
              />
            </PanelField>
          </PanelSection>

          <PanelSection title="Add Nodes">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ADD_NODE_BTNS.map(n => {
                const color = NODE_COLORS[n.type]
                return (
                  <button
                    key={n.type}
                    onClick={() => addNode(n.type)}
                    style={{
                      background: `${color}14`,
                      border: `1px solid ${color}30`,
                      borderRadius: 8,
                      color,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLElement).style.background = `${color}28`
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLElement).style.background = `${color}14`
                    }}
                  >
                    {n.label}
                  </button>
                )
              })}
            </div>
          </PanelSection>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            <button
              onClick={handleSaveNow}
              style={{ ...btn('#10b981', '#fff'), width: '100%', padding: '10px', fontSize: 13, borderRadius: 10 }}
            >
              💾 Save Agent
            </button>
            <button
              onClick={() => { setPanelMode('test'); setTestResult(null) }}
              style={{ ...btn('#3b82f6', '#fff'), width: '100%', padding: '10px', fontSize: 13, borderRadius: 10 }}
            >
              🧪 Test Agent
            </button>
          </div>
        </div>

        {/* ── CENTER PANEL: Canvas ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            fitView
            colorMode="dark"
            style={{ background: '#060a14', width: '100%', height: '100%' }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="rgba(59,130,246,0.14)"
            />
            <Controls />
            <MiniMap
              style={{
                background: '#0f1629',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 8,
              }}
              nodeColor={(n: Node) => NODE_COLORS[n.type ?? ''] ?? '#94a3b8'}
              maskColor="rgba(6,10,20,0.7)"
            />
          </ReactFlow>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderLeft: '1px solid rgba(59,130,246,0.15)',
            background: 'rgba(9,13,24,0.92)',
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {panelMode === 'test' ? (
            <TestPanel
              testMessage={testMessage}
              setTestMessage={setTestMessage}
              testLoading={testLoading}
              testResult={testResult}
              onTest={handleTest}
              onBack={() => setPanelMode('inspector')}
            />
          ) : selectedNode ? (
            <InspectorPanel
              node={selectedNode}
              onUpdate={updateSelectedNode}
              globalModel={model}
              globalTemp={temperature}
              globalPrompt={systemPrompt}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: 24,
                textAlign: 'center',
                height: '100%',
              }}
            >
              <span style={{ fontSize: 44 }}>🔍</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Click a node to configure it</p>
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                Select any node on the canvas to inspect and edit its properties here.
              </p>
              <div
                style={{
                  marginTop: 8,
                  padding: '12px 16px',
                  background: 'rgba(59,130,246,0.06)',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.12)',
                  fontSize: 12,
                  color: '#64748b',
                  textAlign: 'left',
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: '#94a3b8', display: 'block', marginBottom: 6 }}>Quick tips:</strong>
                • Drag nodes to reposition<br />
                • Connect handles to link nodes<br />
                • Click a node to edit its config<br />
                • Use "Add Nodes" to grow the flow<br />
                • Press "Test Agent" to try it live
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
