'use client'

import { useState, useEffect } from 'react'
import {
  MARKETS,
  STATUS_COLOR,
  STATUS_LABEL,
  REGION_COLOR,
  getMarketsByRegion,
  type Market,
  type MarketStatus,
} from '@/lib/markets'
import AfricaMap from '@/components/AfricaMap'

// ── Types ──────────────────────────────────────────────────────────────────────

type ApiMarket = {
  id: string
  code: string
  name: string
  flag: string
  region: string
  status: string
  currencyCode: string
  dataResidencyLaw: string
  dataResidencyRegion: string
  complianceNotes?: string | null
  isActive: boolean
  tenantId: string
}

// Merge DB market with static market metadata (channels, locale, etc.)
function mergeWithStatic(dbMarkets: ApiMarket[]): Market[] {
  return dbMarkets.map(db => {
    const stat = MARKETS.find(m => m.code.toLowerCase() === db.code.toLowerCase() || m.id === db.code.toLowerCase())
    return {
      id: db.code.toLowerCase(),
      name: db.name,
      code: db.code.toUpperCase(),
      flag: db.flag,
      region: db.region as Market['region'],
      status: (db.status || 'coming_soon') as MarketStatus,
      currency: stat?.currency ?? db.currencyCode,
      currencyCode: db.currencyCode,
      language: stat?.language ?? ['English'],
      locale: stat?.locale ?? 'en',
      timezone: stat?.timezone ?? 'UTC',
      dataResidencyLaw: db.dataResidencyLaw,
      dataResidencyRegion: db.dataResidencyRegion,
      channels: stat?.channels ?? ['Web'],
      whatsappBizRequired: stat?.whatsappBizRequired ?? false,
      complianceNotes: db.complianceNotes ?? stat?.complianceNotes ?? '',
      agentCount: stat?.agentCount ?? 0,
      activeUsers: stat?.activeUsers ?? 0,
      monthlyInteractions: stat?.monthlyInteractions ?? 0,
    }
  })
}

// ── Summary stats ──────────────────────────────────────────────────────────────

const totalAgents    = MARKETS.reduce((s, m) => s + (m.agentCount ?? 0), 0)
const totalUsers     = MARKETS.reduce((s, m) => s + (m.activeUsers ?? 0), 0)
const totalInteract  = MARKETS.reduce((s, m) => s + (m.monthlyInteractions ?? 0), 0)
const liveCount      = MARKETS.filter(m => m.status !== 'coming_soon').length

// ── Live activity feed data ────────────────────────────────────────────────────

const LIVE_ACTIVITY = [
  { id: 1, agent: 'HR Leave Handler', action: 'processed 47 requests', flag: '🇿🇦', code: 'ZA' },
  { id: 2, agent: 'WhatsApp Support Bot', action: 'handled 183 messages', flag: '🇿🇦', code: 'ZA' },
  { id: 3, agent: 'Contract Review', action: 'ran 12 times', flag: '🇿🇦', code: 'ZA' },
]

// ── Readiness scorecard data ───────────────────────────────────────────────────

const READINESS_ITEMS = [
  { label: 'Data Compliance', pct: 100, icon: '✅' },
  { label: 'Channel Setup',   pct: 100, icon: '✅' },
  { label: 'Agent Coverage',  pct: 72,  icon: '🟡' },
  { label: 'Staff Training',  pct: 65,  icon: '🟡' },
]
const OVERALL_READINESS = 87

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MarketStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: `${STATUS_COLOR[status]}18`, color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}35` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: STATUS_COLOR[status] }} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Channel pill ──────────────────────────────────────────────────────────────

function ChannelPill({ ch }: { ch: string }) {
  const color = ch === 'WhatsApp' ? '#25d366' : ch === 'USSD' ? '#f59e0b' : ch === 'SMS' ? '#6366f1' : '#3b82f6'
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${color}15`, color }}>
      {ch}
    </span>
  )
}

// ── Market detail drawer ──────────────────────────────────────────────────────

function MarketDrawer({
  market,
  onClose,
  onEnableMarket,
  enabling,
}: {
  market: Market
  onClose: () => void
  onEnableMarket: (code: string) => Promise<void>
  enabling: string | null
}) {
  const isLive = market.status !== 'coming_soon'
  const isEnabling = enabling === market.id

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(6,10,20,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,19,36,0.99)', border: `1px solid ${STATUS_COLOR[market.status]}40` }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${STATUS_COLOR[market.status]}12, transparent)` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{market.flag}</span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{market.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={market.status} />
                <span className="text-xs text-text-muted">{market.region}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-white/10">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Stats row */}
          {isLive && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Deployed Agents', value: market.agentCount ?? 0 },
                { label: 'Active Users', value: market.activeUsers ?? 0 },
                { label: 'Monthly Interactions', value: (market.monthlyInteractions ?? 0).toLocaleString() },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: `${STATUS_COLOR[market.status]}0d`, border: `1px solid ${STATUS_COLOR[market.status]}25` }}>
                  <div className="text-lg font-bold text-text-primary">{s.value}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-2.5">
            {[
              { label: 'Currency', value: `${market.currency} (${market.currencyCode})` },
              { label: 'Languages', value: market.language.join(', ') },
              { label: 'Locale', value: market.locale },
              { label: 'Timezone', value: market.timezone },
              { label: 'Data Residency Law', value: market.dataResidencyLaw },
              { label: 'Hosting Region', value: market.dataResidencyRegion },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.05]">
                <span className="text-xs text-text-muted flex-shrink-0">{row.label}</span>
                <span className="text-xs font-medium text-text-primary text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Channels */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Supported Channels</p>
            <div className="flex flex-wrap gap-1.5">
              {market.channels.map(ch => <ChannelPill key={ch} ch={ch} />)}
            </div>
          </div>

          {/* Compliance note */}
          <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[11px] text-amber-400/90 leading-relaxed">⚖️ {market.complianceNotes}</p>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            {market.status === 'pilot' ? (
              <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${STATUS_COLOR[market.status]}, ${STATUS_COLOR[market.status]}bb)` }}>
                🚀 Manage Pilot
              </button>
            ) : market.status === 'available' ? (
              <button
                onClick={() => onEnableMarket(market.id)}
                disabled={isEnabling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                style={{ background: `linear-gradient(135deg, ${STATUS_COLOR[market.status]}, ${STATUS_COLOR[market.status]}bb)` }}
              >
                {isEnabling ? '⏳ Enabling…' : '✚ Enable Market'}
              </button>
            ) : (
              <button disabled className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-muted cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.05)' }}>
                🔔 Notify Me When Available
              </button>
            )}
            <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>(MARKETS)
  const [loading, setLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [enabling, setEnabling] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [visibleActivity, setVisibleActivity] = useState<number[]>([])

  const marketsByRegion = getMarketsByRegion()

  // ── Fetch markets from API on mount ─────────────────────────────────────────
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const res = await fetch('/api/markets')
        if (!res.ok) throw new Error('API error')
        const json = await res.json()
        if (json.success && json.data?.markets?.length > 0) {
          const apiMarkets = json.data.markets
          // If from DB, merge with static metadata; if static, use as-is
          const merged = json.data.source === 'db'
            ? mergeWithStatic(apiMarkets as ApiMarket[])
            : (apiMarkets as Market[])
          setMarkets(merged)
        }
      } catch {
        // Silent fallback — MARKETS state default already set
      } finally {
        setLoading(false)
      }
    }
    fetchMarkets()
  }, [])

  // ── Staggered activity feed entrance ─────────────────────────────────────────
  useEffect(() => {
    const timers = LIVE_ACTIVITY.map((item, i) =>
      setTimeout(() => setVisibleActivity(prev => [...prev, item.id]), i * 100)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // ── Enable market (PATCH) ────────────────────────────────────────────────────
  async function handleEnableMarket(marketId: string) {
    setEnabling(marketId)
    try {
      const res = await fetch('/api/markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: marketId, isActive: true, status: 'available' }),
      })
      if (!res.ok) throw new Error('Failed')
      // Optimistically update local state
      setMarkets(prev => prev.map(m => m.id === marketId ? { ...m, isActive: true } as Market & { isActive?: boolean } : m))
      showToast(`${markets.find(m => m.id === marketId)?.name ?? 'Market'} enabled successfully`, 'success')
      setSelectedMarket(null)
    } catch {
      showToast('Failed to enable market. Please try again.', 'error')
    } finally {
      setEnabling(null)
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const dynamicTotalAgents = markets.reduce((s, m) => s + (m.agentCount ?? 0), 0)
  const dynamicTotalUsers  = markets.reduce((s, m) => s + (m.activeUsers ?? 0), 0)
  const dynamicTotalInteract = markets.reduce((s, m) => s + (m.monthlyInteractions ?? 0), 0)
  const dynamicLiveCount   = markets.filter(m => m.status !== 'coming_soon').length

  const filteredMarkets = markets.filter(m => {
    if (regionFilter !== 'all' && m.region !== regionFilter) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    return true
  })

  const groupedByRegion = markets.reduce((acc, m) => {
    if (!acc[m.region]) acc[m.region] = []
    acc[m.region].push(m)
    return acc
  }, {} as Record<string, Market[]>)

  return (
    <div className="space-y-8">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl text-sm font-medium shadow-2xl transition-all"
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
          <h1 className="text-2xl font-bold text-text-primary">Market Deployment</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage AI agent deployments across your {markets.length} African markets. Each market operates with localised language, currency, and compliance settings.
            {loading && <span className="ml-2 text-text-muted/60">Loading live data…</span>}
          </p>
        </div>
        <button
          className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #10b981, #10b981bb)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
        >
          🌍 Enable New Market
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Markets', value: markets.length, sub: `${dynamicLiveCount} live`, color: '#10b981' },
          { label: 'Deployed Agents', value: dynamicTotalAgents, sub: 'across all markets', color: '#3b82f6' },
          { label: 'Active Users', value: dynamicTotalUsers.toLocaleString(), sub: 'this month', color: '#8b5cf6' },
          { label: 'Interactions', value: dynamicTotalInteract.toLocaleString(), sub: 'this month', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 rounded-2xl">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm font-medium text-text-primary mt-0.5">{stat.label}</div>
            <div className="text-xs text-text-muted mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Africa map + pilot callout */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6">
        {/* Interactive SVG map */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04))',
            border: '1px solid rgba(255,255,255,0.06)',
            minHeight: 360,
          }}
        >
          <AfricaMap
            markets={markets}
            onMarketClick={market => setSelectedMarket(market)}
            selectedMarketId={selectedMarket?.id}
          />
        </div>

        {/* Pilot info + readiness + live activity */}
        <div className="md:w-80 flex-shrink-0 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🇿🇦</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">South Africa Pilot</h3>
              <p className="text-xs text-text-muted">Active since April 2026</p>
            </div>
            <StatusBadge status="pilot" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            South Africa is your live pilot market. All agents use af-south-1 (AWS Cape Town) for POPIA-compliant data residency. Expand to additional markets once the pilot is validated.
          </p>

          {/* Quick facts */}
          <div className="space-y-2">
            {[
              { label: 'Data Region', value: 'AWS Cape Town (af-south-1)' },
              { label: 'Compliance', value: 'POPIA compliant' },
              { label: 'Primary Channel', value: 'WhatsApp Business' },
              { label: 'Agents Active', value: '6' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center text-xs">
                <span className="text-text-muted">{r.label}</span>
                <span className="font-medium text-text-primary">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Market Readiness scorecard */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Market Readiness</span>
              <span className="text-sm font-bold" style={{ color: '#10b981' }}>{OVERALL_READINESS}%</span>
            </div>
            {/* Overall bar */}
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${OVERALL_READINESS}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
              />
            </div>
            {/* Item bars */}
            {READINESS_ITEMS.map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">{item.icon} {item.label}</span>
                  <span className="font-medium text-text-primary">{item.pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.pct}%`,
                      background: item.pct === 100 ? '#10b981' : '#f59e0b',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live activity feed */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Recent activity (last 24h)</p>
            {LIVE_ACTIVITY.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 text-[11px] transition-all duration-300"
                style={{
                  opacity: visibleActivity.includes(item.id) ? 1 : 0,
                  transform: visibleActivity.includes(item.id) ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: '#10b981' }} />
                <span className="text-text-secondary leading-snug">
                  <span className="font-medium text-text-primary">{item.agent}</span>
                  {' '}{item.action}
                  {' '}—{' '}{item.flag} {item.code}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSelectedMarket(markets.find(m => m.id === 'za') ?? null)}
            className="w-full py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #10b981aa)' }}
          >
            View SA Market Details →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium">Region:</span>
          {['all', 'Southern Africa', 'East Africa', 'West Africa'].map(r => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
              style={regionFilter === r
                ? { background: r === 'all' ? '#3b82f6' : REGION_COLOR[r as keyof typeof REGION_COLOR], color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted font-medium">Status:</span>
          {(['all', 'pilot', 'available', 'coming_soon'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all duration-150"
              style={statusFilter === s
                ? { background: s === 'all' ? '#3b82f6' : STATUS_COLOR[s], color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Market cards by region */}
      {(Object.entries(groupedByRegion) as [string, Market[]][]).map(([region, regionMarkets]) => {
        const visible = regionMarkets.filter(m => filteredMarkets.includes(m))
        if (visible.length === 0) return null
        return (
          <div key={region}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: REGION_COLOR[region as keyof typeof REGION_COLOR] }} />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">{region}</h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-text-muted">{visible.length} market{visible.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(market => (
                <button
                  key={market.id}
                  onClick={() => setSelectedMarket(market)}
                  className="glass-card rounded-2xl p-5 text-left hover:border-opacity-40 transition-all duration-150 group"
                  style={{ borderColor: `${STATUS_COLOR[market.status]}25` }}
                >
                  {/* Flag + name */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{market.flag}</span>
                      <div>
                        <div className="text-sm font-bold text-text-primary">{market.name}</div>
                        <div className="text-xs text-text-muted">{market.currencyCode} · {market.locale}</div>
                      </div>
                    </div>
                    <StatusBadge status={market.status} />
                  </div>

                  {/* Channels */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {market.channels.slice(0, 3).map(ch => <ChannelPill key={ch} ch={ch} />)}
                    {market.channels.length > 3 && (
                      <span className="text-[10px] text-text-muted px-1.5 py-0.5">+{market.channels.length - 3}</span>
                    )}
                  </div>

                  {/* Compliance snippet */}
                  <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                    ⚖️ {market.dataResidencyLaw}
                  </p>

                  {/* Stats or coming soon */}
                  {market.status === 'pilot' && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold" style={{ color: STATUS_COLOR[market.status] }}>{market.agentCount}</div>
                        <div className="text-[9px] text-text-muted">Agents</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: STATUS_COLOR[market.status] }}>{market.activeUsers}</div>
                        <div className="text-[9px] text-text-muted">Users</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: STATUS_COLOR[market.status] }}>{(market.monthlyInteractions ?? 0).toLocaleString()}</div>
                        <div className="text-[9px] text-text-muted">Interactions</div>
                      </div>
                    </div>
                  )}

                  {market.status === 'available' && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <span className="text-xs font-medium" style={{ color: STATUS_COLOR[market.status] }}>
                        Ready to enable → click to configure
                      </span>
                    </div>
                  )}

                  {market.status === 'coming_soon' && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <span className="text-[11px] text-text-muted">Roadmap — H2 2026</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Rollout timeline */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-text-primary mb-4">Expansion Roadmap</h2>
        <div className="space-y-3">
          {[
            { phase: 'Phase 1 — Pilot', period: 'Apr–Jun 2026', markets: ['🇿🇦 South Africa'], color: '#10b981', status: 'active' },
            { phase: 'Phase 2 — West & East Africa', period: 'Jul–Sep 2026', markets: ['🇳🇬 Nigeria', '🇬🇭 Ghana', '🇰🇪 Kenya', '🇹🇿 Tanzania'], color: '#3b82f6', status: 'planned' },
            { phase: 'Phase 3 — Full Southern', period: 'Oct–Dec 2026', markets: ['🇿🇲 Zambia', '🇿🇼 Zimbabwe'], color: '#8b5cf6', status: 'planned' },
            { phase: 'Phase 4 — Francophone & Remaining', period: 'Q1–Q2 2027', markets: ["🇨🇮 Côte d'Ivoire", '🇸🇳 Senegal', '🇨🇲 Cameroon', '🇺🇬 Uganda', '🇧🇼 Botswana', '🇲🇿 Mozambique'], color: '#f59e0b', status: 'roadmap' },
          ].map(phase => (
            <div key={phase.phase} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: `${phase.color}08`, border: `1px solid ${phase.color}20` }}>
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: phase.status === 'active' ? phase.color : `${phase.color}50` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{phase.phase}</span>
                  <span className="text-xs text-text-muted">{phase.period}</span>
                  {phase.status === 'active' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${phase.color}20`, color: phase.color }}>LIVE</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phase.markets.map(m => (
                    <span key={m} className="text-[11px] px-2 py-0.5 rounded-lg text-text-secondary" style={{ background: `${phase.color}12` }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market drawer */}
      {selectedMarket && (
        <MarketDrawer
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          onEnableMarket={handleEnableMarket}
          enabling={enabling}
        />
      )}
    </div>
  )
}
