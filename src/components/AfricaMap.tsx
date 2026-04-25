'use client'

import { useState, useRef, useCallback } from 'react'
import type { Market } from '@/lib/markets'

// ── Country SVG path data ──────────────────────────────────────────────────────

const COUNTRY_PATHS: Record<string, string> = {
  za: 'M 280 480 L 310 465 L 345 460 L 370 470 L 385 485 L 390 510 L 370 530 L 340 545 L 305 540 L 285 520 Z',
  ng: 'M 185 280 L 225 275 L 245 285 L 250 310 L 230 325 L 195 320 L 175 305 Z',
  ke: 'M 335 295 L 365 285 L 385 295 L 390 325 L 370 345 L 340 350 L 320 335 L 325 310 Z',
  gh: 'M 165 285 L 185 280 L 190 305 L 175 315 L 160 310 Z',
  ci: 'M 145 285 L 165 285 L 165 310 L 145 315 L 135 300 Z',
  tz: 'M 320 340 L 360 335 L 380 350 L 375 385 L 345 390 L 315 375 L 310 355 Z',
  ug: 'M 320 295 L 340 290 L 355 300 L 350 320 L 325 325 L 315 310 Z',
  zm: 'M 295 380 L 330 375 L 345 385 L 345 415 L 315 425 L 290 415 L 285 395 Z',
  zw: 'M 310 420 L 340 415 L 350 430 L 340 450 L 310 455 L 295 440 Z',
  bw: 'M 280 430 L 310 420 L 315 455 L 295 470 L 270 460 L 265 440 Z',
  mz: 'M 345 385 L 375 380 L 390 410 L 385 450 L 365 465 L 345 455 L 340 420 Z',
  sn: 'M 130 255 L 155 250 L 160 265 L 140 270 L 125 265 Z',
  cm: 'M 210 285 L 240 275 L 255 290 L 250 315 L 225 315 L 205 300 Z',
}

// Approximate center point for each country (for pulsing dot placement)
const COUNTRY_CENTERS: Record<string, [number, number]> = {
  za: [335, 505],
  ng: [210, 300],
  ke: [357, 315],
  gh: [175, 298],
  ci: [150, 300],
  tz: [345, 362],
  ug: [335, 308],
  zm: [315, 400],
  zw: [323, 437],
  bw: [288, 447],
  mz: [365, 420],
  sn: [142, 260],
  cm: [228, 295],
}

const AFRICA_OUTLINE =
  'M 200 120 L 240 110 L 280 115 L 320 120 L 360 130 L 390 150 L 410 180 L 415 220 L 410 260 L 400 300 L 405 340 L 395 390 L 380 430 L 360 470 L 340 510 L 310 540 L 280 555 L 250 545 L 220 520 L 200 490 L 180 450 L 160 400 L 145 350 L 140 300 L 135 260 L 140 220 L 145 180 L 155 150 L 175 130 Z'

// ── Status colours ─────────────────────────────────────────────────────────────

const STATUS_FILL: Record<string, string> = {
  pilot:       '#10b981',
  available:   '#3b82f6',
  coming_soon: 'rgba(255,255,255,0.08)',
}

const STATUS_FILL_HOVER: Record<string, string> = {
  pilot:       '#34d399',
  available:   '#60a5fa',
  coming_soon: 'rgba(255,255,255,0.15)',
}

const STATUS_LABEL: Record<string, string> = {
  pilot:       'Pilot',
  available:   'Available',
  coming_soon: 'Coming Soon',
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface AfricaMapProps {
  markets: Market[]
  onMarketClick: (market: Market) => void
  selectedMarketId?: string
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

interface TooltipState {
  market: Market
  x: number
  y: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AfricaMap({ markets, onMarketClick, selectedMarketId }: AfricaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const marketById = markets.reduce<Record<string, Market>>((acc, m) => {
    acc[m.id] = m
    return acc
  }, {})

  const handleMouseMove = useCallback((e: React.MouseEvent, market: Market) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({
      market,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
    setHoveredId(null)
  }, [])

  const pilotMarkets = markets.filter(m => m.status === 'pilot')

  return (
    <div className="flex flex-col gap-3">
      {/* SVG container */}
      <div
        ref={containerRef}
        className="relative"
        style={{ minHeight: 360, width: '100%' }}
      >
        <svg
          viewBox="100 100 350 480"
          width="100%"
          height="100%"
          style={{ minHeight: 360, display: 'block' }}
          aria-label="Interactive map of Africa showing market deployment status"
        >
          {/* Continent outline as dark background */}
          <path
            d={AFRICA_OUTLINE}
            fill="rgba(30,40,60,0.85)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />

          {/* Country paths */}
          {Object.entries(COUNTRY_PATHS).map(([countryId, pathData]) => {
            const market = marketById[countryId]
            if (!market) return null

            const isHovered = hoveredId === countryId
            const isSelected = selectedMarketId === countryId
            const fill = isHovered
              ? STATUS_FILL_HOVER[market.status]
              : STATUS_FILL[market.status]
            const strokeColor =
              market.status === 'pilot'
                ? '#10b981'
                : market.status === 'available'
                ? '#3b82f6'
                : 'rgba(255,255,255,0.15)'

            return (
              <g key={countryId}>
                {/* Selected: drop-shadow filter applied via filter element */}
                {isSelected && (
                  <path
                    d={pathData}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    style={{ animation: 'dashSpin 1.5s linear infinite' }}
                    pointerEvents="none"
                  />
                )}
                <path
                  d={pathData}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 0 : isHovered ? 1.5 : 1}
                  strokeLinejoin="round"
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.15s ease',
                    filter: isSelected
                      ? `drop-shadow(0 0 6px ${strokeColor}88)`
                      : isHovered
                      ? `drop-shadow(0 0 4px ${strokeColor}55)`
                      : 'none',
                  }}
                  onClick={() => onMarketClick(market)}
                  onMouseMove={e => {
                    setHoveredId(countryId)
                    handleMouseMove(e, market)
                  }}
                  onMouseLeave={handleMouseLeave}
                  role="button"
                  aria-label={`${market.name} — ${STATUS_LABEL[market.status]}`}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onMarketClick(market)}
                />
              </g>
            )
          })}

          {/* Pulsing dots for pilot markets */}
          {pilotMarkets.map(market => {
            const center = COUNTRY_CENTERS[market.id]
            if (!center) return null
            return (
              <g
                key={`pulse-${market.id}`}
                pointerEvents="none"
                transform={`translate(${center[0]}, ${center[1]})`}
              >
                {/* Outer ring: scale-up + fade out */}
                <circle
                  r="6"
                  fill="#10b981"
                  style={{ animation: 'pulseRing 2s ease-out infinite', transformOrigin: 'center' }}
                />
                {/* Inner solid dot */}
                <circle
                  r="3.5"
                  fill="#10b981"
                  style={{ animation: 'pulseDot 2s ease-in-out infinite' }}
                />
              </g>
            )
          })}
        </svg>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20 px-3 py-2.5 rounded-xl text-xs shadow-2xl"
            style={{
              left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth ?? 400) - 170),
              top: tooltip.y - 10,
              background: 'rgba(10,16,30,0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              minWidth: 150,
              transform: 'translateY(-50%)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <span>{tooltip.market.flag}</span>
              <span>{tooltip.market.name}</span>
            </div>
            <div className="flex items-center gap-1 mb-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: STATUS_FILL[tooltip.market.status] }}
              />
              <span style={{ color: STATUS_FILL[tooltip.market.status] }}>
                {STATUS_LABEL[tooltip.market.status]}
              </span>
            </div>
            {(tooltip.market.agentCount ?? 0) > 0 || (tooltip.market.activeUsers ?? 0) > 0 ? (
              <div className="text-[10px] text-white/50">
                {tooltip.market.agentCount} agents · {tooltip.market.activeUsers} users
              </div>
            ) : (
              <div className="text-[10px] text-white/40">No active agents yet</div>
            )}
          </div>
        )}

        {/* CSS keyframe animations */}
        <style>{`
          @keyframes pulseRing {
            0%   { transform: scale(1);   opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes pulseDot {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.55; }
          }
          @keyframes dashSpin {
            to { stroke-dashoffset: -18; }
          }
        `}</style>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Legend</span>
        {([
          { status: 'pilot', label: 'Pilot', filled: true },
          { status: 'available', label: 'Available', filled: true },
          { status: 'coming_soon', label: 'Coming Soon', filled: false },
        ] as const).map(item => (
          <div key={item.status} className="flex items-center gap-1.5">
            {item.filled ? (
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: STATUS_FILL[item.status] }}
              />
            ) : (
              <span
                className="w-2 h-2 rounded-full inline-block border"
                style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}
              />
            )}
            <span className="text-[11px] text-white/50">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
