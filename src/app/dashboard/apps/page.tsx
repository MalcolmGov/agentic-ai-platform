'use client'

import { useState, useEffect } from 'react'
import {
  APP_REGISTRY,
  APP_TYPE_ICON,
  APP_TYPE_LABEL,
  INTEGRATION_LABEL,
  INTEGRATION_ICON,
  STATUS_COLOR,
  STATUS_LABEL,
  type AppProperty,
  type AppType,
  type AppStatus,
  type IntegrationMethod,
} from '@/lib/apps'
import { MARKETS } from '@/lib/markets'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMarket(id: string) { return MARKETS.find(m => m.id === id) }

const DIVISION_LABEL: Record<string, string> = {
  MARKETING: 'Marketing', CUSTOMER_SUPPORT: 'Customer Support', HR: 'HR',
  COMPLIANCE: 'Compliance', RISK: 'Risk', LEGAL: 'Legal', SECURITY: 'Security',
  PRODUCT: 'Product', ENGINEERING: 'Engineering', DATA_ANALYTICS: 'Data & Analytics',
  INFRA_OPS: 'Infra & Ops', IT: 'IT', FINANCE: 'Finance', EXECUTIVE: 'Executive',
  OPERATIONS: 'Operations', QA: 'QA',
}

const DIVISION_IDS = Object.keys(DIVISION_LABEL)

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#0d9488', '#84cc16', '#25d366', '#6366f1',
]

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${STATUS_COLOR[status]}15`, color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Register App Modal ────────────────────────────────────────────────────────

type RegisterAppFormData = {
  name: string
  shortName: string
  type: AppType
  description: string
  marketId: string
  ownerDivision: string
  status: AppStatus
  url: string
  identifier: string
  integrationMethods: IntegrationMethod[]
  color: string
}

const BLANK_FORM: RegisterAppFormData = {
  name: '',
  shortName: '',
  type: 'website',
  description: '',
  marketId: 'za',
  ownerDivision: 'MARKETING',
  status: 'development',
  url: '',
  identifier: '',
  integrationMethods: [],
  color: '#3b82f6',
}

function RegisterAppModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (app: AppProperty) => void
}) {
  const [form, setForm] = useState<RegisterAppFormData>(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof RegisterAppFormData>(key: K, value: RegisterAppFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleMethod(method: IntegrationMethod) {
    setForm(prev => ({
      ...prev,
      integrationMethods: prev.integrationMethods.includes(method)
        ? prev.integrationMethods.filter(m => m !== method)
        : [...prev.integrationMethods, method],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.shortName.trim() || !form.description.trim()) {
      setError('Name, Short Name and Description are required.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          shortName: form.shortName.trim(),
          type: form.type,
          description: form.description.trim(),
          marketId: form.marketId,
          ownerDivision: form.ownerDivision,
          status: form.status,
          url: form.url.trim() || undefined,
          identifier: form.identifier.trim() || undefined,
          integrationMethods: form.integrationMethods,
          color: form.color,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to register app')

      const market = MARKETS.find(m => m.id === form.marketId)
      const created: AppProperty = {
        id: json.data?.app?.id ?? `app_${Date.now()}`,
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        type: form.type,
        description: form.description.trim(),
        market: form.marketId,
        ownerDivision: form.ownerDivision,
        status: form.status,
        url: form.url.trim() || undefined,
        identifier: form.identifier.trim() || undefined,
        integrationMethods: form.integrationMethods,
        icon: APP_TYPE_ICON[form.type],
        color: form.color,
        agentsDeployed: 0,
        monthlyUsers: 0,
        environment: form.status === 'live' ? 'production' : form.status === 'staging' ? 'staging' : 'development',
      }
      onSuccess(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const ALL_METHODS: IntegrationMethod[] = ['js-snippet', 'mobile-sdk', 'webhook', 'api-key', 'whatsapp-cloud', 'ussd-gateway']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,10,20,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,19,36,0.99)', border: '1px solid rgba(59,130,246,0.35)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), transparent)' }}>
          <div>
            <h2 className="text-base font-bold text-text-primary">Register App</h2>
            <p className="text-xs text-text-muted mt-0.5">Add a new digital property to the platform</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-white/10">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Name + Short Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">App Name *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Company Website"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-muted/50 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Short Name *</label>
              <input
                value={form.shortName}
                onChange={e => set('shortName', e.target.value)}
                placeholder="e.g. mycompany.co.za"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-muted/50 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* App Type + Market */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">App Type</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value as AppType)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {(Object.keys(APP_TYPE_LABEL) as AppType[]).map(t => (
                  <option key={t} value={t}>{APP_TYPE_ICON[t]} {APP_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Market</label>
              <select
                value={form.marketId}
                onChange={e => set('marketId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {MARKETS.map(m => (
                  <option key={m.id} value={m.id}>{m.flag} {m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Describe what this app does and who uses it…"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-muted/50 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* URL / Identifier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">URL</label>
              <input
                value={form.url}
                onChange={e => set('url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-muted/50 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Identifier</label>
              <input
                value={form.identifier}
                onChange={e => set('identifier', e.target.value)}
                placeholder="Bundle ID, phone no., USSD…"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-muted/50 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Owner Division + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Owner Division</label>
              <select
                value={form.ownerDivision}
                onChange={e => set('ownerDivision', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {DIVISION_IDS.map(d => (
                  <option key={d} value={d}>{DIVISION_LABEL[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as AppStatus)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="live">Live</option>
                <option value="staging">Staging</option>
                <option value="development">In Development</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Integration Methods */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Integration Methods</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_METHODS.map(method => {
                const checked = form.integrationMethods.includes(method)
                return (
                  <label
                    key={method}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: checked ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${checked ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMethod(method)}
                      className="sr-only"
                    />
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${checked ? 'text-blue-400' : 'text-transparent'}`}
                      style={{ background: checked ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)', border: `1px solid ${checked ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.15)'}` }}>
                      ✓
                    </span>
                    <span className="text-xs text-text-secondary">
                      {INTEGRATION_ICON[method]} {INTEGRATION_LABEL[method]}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Brand Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex-shrink-0"
                  style={{
                    background: c,
                    border: form.color === c ? `2px solid white` : '2px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                title="Custom color"
              />
              <span className="text-xs text-text-muted font-mono">{form.color}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ❌ {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #3b82f6bb)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}
          >
            {submitting ? '⏳ Registering…' : '+ Register App'}
          </button>
          <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── App detail drawer ─────────────────────────────────────────────────────────

function AppDrawer({ app, onClose }: { app: AppProperty; onClose: () => void }) {
  const market = getMarket(app.market)
  const snippet = `<script
  src="https://agents.mycompany.co.za/widget.js"
  data-agent-id="[your-agent-id]"
  data-app="${app.id}"
  data-market="${app.market}">
</script>`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,10,20,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,19,36,0.99)', border: `1px solid ${app.color}40` }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${app.color}10, transparent)` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${app.color}18`, border: `1px solid ${app.color}35` }}>
              {APP_TYPE_ICON[app.type]}
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">{app.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={app.status} />
                <span className="text-xs text-text-muted">{market?.flag} {market?.name}</span>
                <span className="text-xs text-text-muted">· {APP_TYPE_LABEL[app.type]}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-white/10">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-text-muted leading-relaxed">{app.description}</p>

          {/* Stats */}
          {app.status === 'live' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Deployed Agents', value: app.agentsDeployed ?? 0 },
                { label: 'Monthly Users', value: (app.monthlyUsers ?? 0).toLocaleString() },
                { label: 'Environment', value: app.environment },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: `${app.color}0d`, border: `1px solid ${app.color}25` }}>
                  <div className="text-base font-bold capitalize" style={{ color: app.color }}>{s.value}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="space-y-2.5">
            {[
              { label: 'Owner Division', value: DIVISION_LABEL[app.ownerDivision] ?? app.ownerDivision },
              { label: 'Shared With', value: app.sharedWith?.map(d => DIVISION_LABEL[d] ?? d).join(', ') || 'None' },
              ...(app.url ? [{ label: 'URL', value: app.url }] : []),
              ...(app.identifier ? [{ label: 'Identifier', value: app.identifier }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.05]">
                <span className="text-xs text-text-muted flex-shrink-0">{row.label}</span>
                <span className="text-xs font-medium text-text-primary text-right font-mono">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Integration methods */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Integration Methods</p>
            <div className="space-y-2">
              {app.integrationMethods.map(method => (
                <div key={method} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span>{INTEGRATION_ICON[method]}</span>
                  <span className="text-xs text-text-primary font-medium">{INTEGRATION_LABEL[method]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* JS Snippet */}
          {app.integrationMethods.includes('js-snippet') && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Embed Snippet</p>
              <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <pre className="text-[10px] font-mono text-text-muted p-4 overflow-x-auto leading-relaxed">{snippet}</pre>
                <button
                  className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-lg font-medium"
                  style={{ background: `${app.color}20`, color: app.color }}
                  onClick={() => navigator.clipboard?.writeText(snippet)}
                >
                  Copy
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">
                Replace <code className="font-mono">[your-agent-id]</code> with the agent ID from My Agents after deploying.
              </p>
            </div>
          )}

          {/* Mobile SDK */}
          {app.integrationMethods.includes('mobile-sdk') && (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p className="text-xs font-semibold text-blue-400 mb-1">Mobile SDK Integration</p>
              <p className="text-[11px] text-blue-400/80 leading-relaxed">
                Install the SDK: <code className="font-mono">npm install @agentic-ai/sdk</code><br />
                Full iOS & Android integration guide is available in the developer docs.
              </p>
            </div>
          )}

          {/* Compliance note */}
          {market && (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[11px] text-amber-400/90 leading-relaxed">
                ⚖️ <strong>Data Residency:</strong> {market.dataResidencyLaw}. All agent data for this app is stored in <strong>{market.dataResidencyRegion}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}bb)` }}>
            Deploy Agent to This App
          </button>
          <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AppsPage() {
  const [apps, setApps] = useState<AppProperty[]>(APP_REGISTRY)
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<AppProperty | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [marketFilter, setMarketFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Fetch apps from API on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch('/api/apps')
        if (!res.ok) throw new Error('API error')
        const json = await res.json()
        if (json.success && json.data?.apps?.length > 0) {
          setApps(json.data.apps as AppProperty[])
        }
      } catch {
        // Silent fallback to APP_REGISTRY default
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleAppRegistered(newApp: AppProperty) {
    setApps(prev => [newApp, ...prev])
    setShowRegisterModal(false)
    showToast(`${newApp.name} registered successfully`, 'success')
  }

  const liveApps = apps.filter(a => a.status === 'live')
  const totalUsers = apps.reduce((s, a) => s + (a.monthlyUsers ?? 0), 0)
  const totalAgents = apps.reduce((s, a) => s + (a.agentsDeployed ?? 0), 0)

  const filtered = apps.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (marketFilter !== 'all' && a.market !== marketFilter) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const byMarket = filtered.reduce((acc, a) => {
    if (!acc[a.market]) acc[a.market] = []
    acc[a.market].push(a)
    return acc
  }, {} as Record<string, AppProperty[]>)

  return (
    <div className="space-y-8">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Apps & Properties</h1>
          <p className="text-sm text-text-muted mt-1">
            All digital properties registered on the platform. Deploy agents to specific apps and manage integration methods per division.
            {loading && <span className="ml-2 text-text-muted/60">Loading live data…</span>}
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #3b82f6bb)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}
        >
          + Register App
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered Apps', value: apps.length, sub: `${liveApps.length} live`, color: '#3b82f6' },
          { label: 'Agents Deployed', value: totalAgents, sub: 'across all apps', color: '#10b981' },
          { label: 'Monthly Reach', value: totalUsers.toLocaleString(), sub: 'combined users', color: '#8b5cf6' },
          { label: 'Markets Covered', value: new Set(apps.map(a => a.market)).size, sub: 'of 13 markets', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 rounded-2xl">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm font-medium text-text-primary mt-0.5">{stat.label}</div>
            <div className="text-xs text-text-muted mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Understanding the model — callout */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-text-primary mb-3">How App Deployment Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              icon: '🤖',
              title: 'Pick & Configure Agent',
              desc: 'Choose an agent from the library and configure its behaviour for your division.',
              color: '#8b5cf6',
            },
            {
              step: '2',
              icon: '🌍',
              title: 'Select Market + App',
              desc: 'Choose which market (e.g. South Africa) and which specific app or channel to deploy it in — website, mobile app, WhatsApp line, or USSD.',
              color: '#10b981',
            },
            {
              step: '3',
              icon: '🔖',
              title: 'Get Integration Code',
              desc: 'The platform generates a JS snippet, webhook URL, or mobile SDK config. Paste it into your app — the agent goes live.',
              color: '#3b82f6',
            },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30` }}>
                {s.step}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.icon}</span>
                  <span className="text-xs font-semibold text-text-primary">{s.title}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-text-muted leading-relaxed">
            <strong className="text-text-secondary">Division ownership:</strong> Each app is owned by one division but can be shared with others. For example, the Customer Support Portal is owned by Customer Support but HR can also deploy agents to it. The owning division must approve cross-division deployments for apps that require approval.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Type:</span>
          {(['all', 'website', 'mobile-ios', 'mobile-android', 'internal-portal', 'whatsapp', 'ussd', 'api'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
              style={typeFilter === t ? { background: '#3b82f6', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              {t === 'all' ? 'All' : APP_TYPE_ICON[t] + ' ' + APP_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted">Status:</span>
          {(['all', 'live', 'staging', 'development'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all capitalize"
              style={statusFilter === s ? { background: s === 'all' ? '#3b82f6' : STATUS_COLOR[s], color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Apps grouped by market */}
      {Object.entries(byMarket).map(([marketId, marketApps]) => {
        const market = getMarket(marketId)
        return (
          <div key={marketId}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">{market?.flag ?? '🌍'}</span>
              <h2 className="text-sm font-bold text-text-primary">{market?.name ?? marketId.toUpperCase()}</h2>
              <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-white/[0.05]">{marketApps.length} app{marketApps.length !== 1 ? 's' : ''}</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="glass-card rounded-2xl p-5 text-left hover:scale-[1.01] transition-all duration-150 group"
                  style={{ borderColor: `${app.color}20` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${app.color}18`, border: `1px solid ${app.color}30` }}>
                        {APP_TYPE_ICON[app.type]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary truncate">{app.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 truncate">{app.shortName}</div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <p className="text-[11px] text-text-muted leading-relaxed mb-3 line-clamp-2">{app.description}</p>

                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${app.color}15`, color: app.color }}>
                      {DIVISION_LABEL[app.ownerDivision] ?? app.ownerDivision}
                    </span>
                    {(app.sharedWith ?? []).slice(0, 2).map(d => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-muted">
                        {DIVISION_LABEL[d] ?? d}
                      </span>
                    ))}
                    {(app.sharedWith ?? []).length > 2 && (
                      <span className="text-[10px] text-text-muted">+{(app.sharedWith ?? []).length - 2}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {app.integrationMethods.map(m => (
                      <span key={m} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/[0.04] text-text-muted">
                        {INTEGRATION_ICON[m]} {INTEGRATION_LABEL[m]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      {(app.agentsDeployed ?? 0) > 0 && (
                        <div>
                          <span className="text-sm font-bold" style={{ color: app.color }}>{app.agentsDeployed}</span>
                          <span className="text-[10px] text-text-muted ml-1">agents</span>
                        </div>
                      )}
                      {(app.monthlyUsers ?? 0) > 0 && (
                        <div>
                          <span className="text-sm font-bold text-text-primary">{(app.monthlyUsers ?? 0).toLocaleString()}</span>
                          <span className="text-[10px] text-text-muted ml-1">users/mo</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted group-hover:text-electric-400 transition-colors">
                      View details →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Drawers / Modals */}
      {selectedApp && <AppDrawer app={selectedApp} onClose={() => setSelectedApp(null)} />}
      {showRegisterModal && (
        <RegisterAppModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleAppRegistered}
        />
      )}
    </div>
  )
}
