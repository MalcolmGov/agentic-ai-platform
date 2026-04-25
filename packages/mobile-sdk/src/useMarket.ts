import { useMemo } from 'react'
import { useAgenticContext } from './AgenticProvider'
import { MarketConfig } from './types'

const MARKET_CONFIGS: Record<string, MarketConfig> = {
  za: { code: 'za', name: 'South Africa', currency: 'ZAR', language: ['en', 'zu', 'af'], complianceRegion: 'af-south-1' },
  ng: { code: 'ng', name: 'Nigeria', currency: 'NGN', language: ['en', 'pcm'], complianceRegion: 'eu-west-1' },
  ke: { code: 'ke', name: 'Kenya', currency: 'KES', language: ['en', 'sw'], complianceRegion: 'eu-west-1' },
  gh: { code: 'gh', name: 'Ghana', currency: 'GHS', language: ['en'], complianceRegion: 'eu-west-1' },
  tz: { code: 'tz', name: 'Tanzania', currency: 'TZS', language: ['sw', 'en'], complianceRegion: 'eu-west-1' },
  zm: { code: 'zm', name: 'Zambia', currency: 'ZMW', language: ['en'], complianceRegion: 'af-south-1' },
  ug: { code: 'ug', name: 'Uganda', currency: 'UGX', language: ['en', 'sw'], complianceRegion: 'eu-west-1' },
  rw: { code: 'rw', name: 'Rwanda', currency: 'RWF', language: ['en', 'fr', 'rw'], complianceRegion: 'eu-west-1' },
  et: { code: 'et', name: 'Ethiopia', currency: 'ETB', language: ['am', 'en'], complianceRegion: 'eu-west-1' },
  eg: { code: 'eg', name: 'Egypt', currency: 'EGP', language: ['ar', 'en'], complianceRegion: 'me-south-1' },
  ma: { code: 'ma', name: 'Morocco', currency: 'MAD', language: ['ar', 'fr'], complianceRegion: 'eu-west-1' },
  sn: { code: 'sn', name: 'Senegal', currency: 'XOF', language: ['fr', 'wo'], complianceRegion: 'eu-west-1' },
  ci: { code: 'ci', name: "Côte d'Ivoire", currency: 'XOF', language: ['fr'], complianceRegion: 'eu-west-1' },
}

export function useMarket(): MarketConfig | null {
  const { config } = useAgenticContext()
  return useMemo(() => MARKET_CONFIGS[config.market] ?? null, [config.market])
}
