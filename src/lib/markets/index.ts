// ─── African Markets Configuration ───────────────────────────────────────────
// 13 markets across West, East, and Southern Africa

export type MarketStatus = 'pilot' | 'available' | 'coming_soon'
export type Region = 'Southern Africa' | 'West Africa' | 'East Africa'

export interface Market {
  id: string
  name: string
  code: string           // ISO 3166-1 alpha-2
  flag: string           // emoji flag
  region: Region
  status: MarketStatus
  currency: string
  currencyCode: string
  language: string[]
  locale: string
  timezone: string
  dataResidencyLaw: string
  dataResidencyRegion: string    // AWS/GCP region closest + compliant
  channels: string[]             // preferred channels
  whatsappBizRequired: boolean
  complianceNotes: string
  agentCount?: number            // deployed agents in this market
  activeUsers?: number
  monthlyInteractions?: number
}

export const MARKETS: Market[] = [
  // ── Southern Africa ─────────────────────────────────────────────────────────
  {
    id: 'za',
    name: 'South Africa',
    code: 'ZA',
    flag: '🇿🇦',
    region: 'Southern Africa',
    status: 'pilot',
    currency: 'Rand',
    currencyCode: 'ZAR',
    language: ['English', 'Zulu', 'Xhosa', 'Afrikaans', 'Sotho'],
    locale: 'en-ZA',
    timezone: 'Africa/Johannesburg',
    dataResidencyLaw: 'POPIA (Protection of Personal Information Act)',
    dataResidencyRegion: 'af-south-1 (AWS Cape Town)',
    channels: ['WhatsApp', 'Web', 'Mobile App', 'USSD'],
    whatsappBizRequired: true,
    complianceNotes: 'POPIA requires data localisation. PII must stay in-country. Information Regulator oversight.',
    agentCount: 6,
    activeUsers: 342,
    monthlyInteractions: 12840,
  },
  {
    id: 'zw',
    name: 'Zimbabwe',
    code: 'ZW',
    flag: '🇿🇼',
    region: 'Southern Africa',
    status: 'available',
    currency: 'USD / ZiG',
    currencyCode: 'USD',
    language: ['English', 'Shona', 'Ndebele'],
    locale: 'en-ZW',
    timezone: 'Africa/Harare',
    dataResidencyLaw: 'Cyber and Data Protection Act 2021',
    dataResidencyRegion: 'af-south-1 (AWS Cape Town — nearest)',
    channels: ['WhatsApp', 'USSD', 'SMS'],
    whatsappBizRequired: true,
    complianceNotes: 'Cyber & Data Protection Act 2021 in force. Data Protection Authority established.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'zm',
    name: 'Zambia',
    code: 'ZM',
    flag: '🇿🇲',
    region: 'Southern Africa',
    status: 'available',
    currency: 'Kwacha',
    currencyCode: 'ZMW',
    language: ['English', 'Bemba', 'Nyanja', 'Tonga'],
    locale: 'en-ZM',
    timezone: 'Africa/Lusaka',
    dataResidencyLaw: 'Data Protection Act 2021',
    dataResidencyRegion: 'af-south-1 (AWS Cape Town — nearest)',
    channels: ['WhatsApp', 'USSD', 'SMS', 'Web'],
    whatsappBizRequired: true,
    complianceNotes: 'Data Protection Act 2021 operative. Zambia ICTA oversees compliance.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'bw',
    name: 'Botswana',
    code: 'BW',
    flag: '🇧🇼',
    region: 'Southern Africa',
    status: 'coming_soon',
    currency: 'Pula',
    currencyCode: 'BWP',
    language: ['English', 'Setswana'],
    locale: 'en-BW',
    timezone: 'Africa/Gaborone',
    dataResidencyLaw: 'Data Protection Act 2018',
    dataResidencyRegion: 'af-south-1 (AWS Cape Town — nearest)',
    channels: ['WhatsApp', 'Web', 'USSD'],
    whatsappBizRequired: true,
    complianceNotes: 'DPA 2018 in force. BOCRA is the regulator.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'mz',
    name: 'Mozambique',
    code: 'MZ',
    flag: '🇲🇿',
    region: 'Southern Africa',
    status: 'coming_soon',
    currency: 'Metical',
    currencyCode: 'MZN',
    language: ['Portuguese', 'Makua', 'Tsonga'],
    locale: 'pt-MZ',
    timezone: 'Africa/Maputo',
    dataResidencyLaw: 'Personal Data Protection Law 2021',
    dataResidencyRegion: 'af-south-1 (AWS Cape Town — nearest)',
    channels: ['WhatsApp', 'SMS', 'USSD'],
    whatsappBizRequired: true,
    complianceNotes: 'Portuguese-language primary. INTIC oversees data protection.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },

  // ── East Africa ──────────────────────────────────────────────────────────────
  {
    id: 'ke',
    name: 'Kenya',
    code: 'KE',
    flag: '🇰🇪',
    region: 'East Africa',
    status: 'available',
    currency: 'Shilling',
    currencyCode: 'KES',
    language: ['English', 'Swahili'],
    locale: 'en-KE',
    timezone: 'Africa/Nairobi',
    dataResidencyLaw: 'Data Protection Act 2019',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — GDPR-aligned nearest)',
    channels: ['WhatsApp', 'M-PESA API', 'Web', 'USSD', 'SMS'],
    whatsappBizRequired: true,
    complianceNotes: 'DPA 2019 in force. ODPC is regulator. M-PESA integration common for payments.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'tz',
    name: 'Tanzania',
    code: 'TZ',
    flag: '🇹🇿',
    region: 'East Africa',
    status: 'available',
    currency: 'Shilling',
    currencyCode: 'TZS',
    language: ['Swahili', 'English'],
    locale: 'sw-TZ',
    timezone: 'Africa/Dar_es_Salaam',
    dataResidencyLaw: 'Personal Data Protection Act 2022',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — nearest compliant)',
    channels: ['WhatsApp', 'USSD', 'SMS'],
    whatsappBizRequired: true,
    complianceNotes: 'PDPA 2022 newly enacted. TCRA oversees. Swahili-first content recommended.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'ug',
    name: 'Uganda',
    code: 'UG',
    flag: '🇺🇬',
    region: 'East Africa',
    status: 'coming_soon',
    currency: 'Shilling',
    currencyCode: 'UGX',
    language: ['English', 'Luganda', 'Swahili'],
    locale: 'en-UG',
    timezone: 'Africa/Kampala',
    dataResidencyLaw: 'Data Protection and Privacy Act 2019',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — nearest compliant)',
    channels: ['WhatsApp', 'USSD', 'SMS', 'Web'],
    whatsappBizRequired: true,
    complianceNotes: 'DPPA 2019 in force. PDPO is the regulator.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },

  // ── West Africa ──────────────────────────────────────────────────────────────
  {
    id: 'ng',
    name: 'Nigeria',
    code: 'NG',
    flag: '🇳🇬',
    region: 'West Africa',
    status: 'available',
    currency: 'Naira',
    currencyCode: 'NGN',
    language: ['English', 'Pidgin', 'Hausa', 'Yoruba', 'Igbo'],
    locale: 'en-NG',
    timezone: 'Africa/Lagos',
    dataResidencyLaw: 'NDPR (Nigeria Data Protection Regulation)',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — nearest compliant)',
    channels: ['WhatsApp', 'Web', 'USSD', 'SMS', 'Mobile App'],
    whatsappBizRequired: true,
    complianceNotes: 'NDPR 2019 in force. NDPC is regulator. Largest market — high WhatsApp penetration.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'gh',
    name: 'Ghana',
    code: 'GH',
    flag: '🇬🇭',
    region: 'West Africa',
    status: 'available',
    currency: 'Cedi',
    currencyCode: 'GHS',
    language: ['English', 'Twi', 'Fante', 'Ewe'],
    locale: 'en-GH',
    timezone: 'Africa/Accra',
    dataResidencyLaw: 'Data Protection Act 2012 (Act 843)',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — nearest compliant)',
    channels: ['WhatsApp', 'Web', 'USSD', 'SMS'],
    whatsappBizRequired: true,
    complianceNotes: 'Act 843 in force. Data Protection Commission oversees. Strong mobile money ecosystem.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'ci',
    name: "Côte d'Ivoire",
    code: 'CI',
    flag: '🇨🇮',
    region: 'West Africa',
    status: 'coming_soon',
    currency: 'CFA Franc',
    currencyCode: 'XOF',
    language: ["French", "Dioula", "Bété"],
    locale: 'fr-CI',
    timezone: 'Africa/Abidjan',
    dataResidencyLaw: 'Loi sur la Protection des Données Personnelles 2013',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — EU-aligned)',
    channels: ['WhatsApp', 'Web', 'USSD'],
    whatsappBizRequired: true,
    complianceNotes: "French-language primary. ARTCI oversees. ECOWAS digital single market framework applies.",
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'sn',
    name: 'Senegal',
    code: 'SN',
    flag: '🇸🇳',
    region: 'West Africa',
    status: 'coming_soon',
    currency: 'CFA Franc',
    currencyCode: 'XOF',
    language: ['French', 'Wolof', 'Pulaar'],
    locale: 'fr-SN',
    timezone: 'Africa/Dakar',
    dataResidencyLaw: 'Loi sur les Données Personnelles 2008',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — EU-aligned)',
    channels: ['WhatsApp', 'USSD', 'Web'],
    whatsappBizRequired: true,
    complianceNotes: 'CDP (Commission des Données Personnelles) oversees. WAEMU regulatory zone.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
  {
    id: 'cm',
    name: 'Cameroon',
    code: 'CM',
    flag: '🇨🇲',
    region: 'West Africa',
    status: 'coming_soon',
    currency: 'CFA Franc',
    currencyCode: 'XAF',
    language: ['French', 'English'],
    locale: 'fr-CM',
    timezone: 'Africa/Douala',
    dataResidencyLaw: 'Law on Cybersecurity and Cybercriminality 2010',
    dataResidencyRegion: 'eu-west-1 (AWS Ireland — EU-aligned)',
    channels: ['WhatsApp', 'USSD', 'SMS'],
    whatsappBizRequired: true,
    complianceNotes: 'Bilingual (French/English). ANTIC oversees. Dedicated data protection law pending.',
    agentCount: 0,
    activeUsers: 0,
    monthlyInteractions: 0,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getMarketsByRegion(): Record<Region, Market[]> {
  return MARKETS.reduce((acc, m) => {
    if (!acc[m.region]) acc[m.region] = []
    acc[m.region].push(m)
    return acc
  }, {} as Record<Region, Market[]>)
}

export function getPilotMarkets(): Market[] {
  return MARKETS.filter(m => m.status === 'pilot')
}

export function getAvailableMarkets(): Market[] {
  return MARKETS.filter(m => m.status === 'pilot' || m.status === 'available')
}

export const STATUS_LABEL: Record<MarketStatus, string> = {
  pilot:       'Pilot',
  available:   'Available',
  coming_soon: 'Coming Soon',
}

export const STATUS_COLOR: Record<MarketStatus, string> = {
  pilot:       '#10b981',   // emerald
  available:   '#3b82f6',   // blue
  coming_soon: '#6b7280',   // gray
}

export const REGION_COLOR: Record<Region, string> = {
  'Southern Africa': '#8b5cf6',
  'East Africa':     '#06b6d4',
  'West Africa':     '#f59e0b',
}
