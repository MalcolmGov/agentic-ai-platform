// ─── App / Property Registry ──────────────────────────────────────────────────
// Represents every digital property (website, app, portal, API) the company
// operates. Each property belongs to a market + owning division, and has one
// or more integration methods that tell the platform *how* an agent gets
// embedded into it.

export type AppType =
  | 'website'          // public-facing website
  | 'mobile-ios'       // iOS native app
  | 'mobile-android'   // Android native app
  | 'internal-portal'  // employee / internal web app
  | 'api'              // backend API / microservice
  | 'whatsapp'         // WhatsApp Business number
  | 'ussd'             // USSD shortcode

export type IntegrationMethod =
  | 'js-snippet'       // copy-paste <script> tag → web chat widget
  | 'mobile-sdk'       // npm/CocoaPods SDK → in-app chat
  | 'webhook'          // POST to URL for event-driven agents
  | 'api-key'          // REST API calls with key
  | 'whatsapp-cloud'   // Meta WhatsApp Cloud API
  | 'ussd-gateway'     // USSD gateway provider

export type AppStatus = 'live' | 'staging' | 'development' | 'archived'
export type DivisionId = string  // maps to DepartmentId

export interface AppProperty {
  id: string
  name: string
  shortName: string          // used in badges
  type: AppType
  description: string
  market: string             // market id e.g. 'za', 'ng'
  ownerDivision: DivisionId
  sharedWith?: DivisionId[]  // other divisions that can deploy to this app
  status: AppStatus
  url?: string               // website URL or API base URL
  identifier?: string        // bundle ID, phone number, USSD code
  integrationMethods: IntegrationMethod[]
  icon: string
  color: string
  agentsDeployed?: number
  monthlyUsers?: number
  environment: 'production' | 'staging' | 'development'
}

// ── Icon + color helpers ──────────────────────────────────────────────────────

export const APP_TYPE_ICON: Record<AppType, string> = {
  'website':         '🌐',
  'mobile-ios':      '📱',
  'mobile-android':  '🤖',
  'internal-portal': '🏢',
  'api':             '⚙️',
  'whatsapp':        '💬',
  'ussd':            '📟',
}

export const APP_TYPE_LABEL: Record<AppType, string> = {
  'website':         'Website',
  'mobile-ios':      'iOS App',
  'mobile-android':  'Android App',
  'internal-portal': 'Internal Portal',
  'api':             'API / Service',
  'whatsapp':        'WhatsApp Channel',
  'ussd':            'USSD Channel',
}

export const INTEGRATION_ICON: Record<IntegrationMethod, string> = {
  'js-snippet':     '🔖',
  'mobile-sdk':     '📦',
  'webhook':        '🔗',
  'api-key':        '🔑',
  'whatsapp-cloud': '💬',
  'ussd-gateway':   '📟',
}

export const INTEGRATION_LABEL: Record<IntegrationMethod, string> = {
  'js-snippet':     'JS Snippet',
  'mobile-sdk':     'Mobile SDK',
  'webhook':        'Webhook',
  'api-key':        'API Key',
  'whatsapp-cloud': 'WhatsApp Cloud API',
  'ussd-gateway':   'USSD Gateway',
}

export const STATUS_COLOR: Record<AppStatus, string> = {
  live:        '#10b981',
  staging:     '#f59e0b',
  development: '#6366f1',
  archived:    '#6b7280',
}

export const STATUS_LABEL: Record<AppStatus, string> = {
  live:        'Live',
  staging:     'Staging',
  development: 'In Development',
  archived:    'Archived',
}

// ── Registry ──────────────────────────────────────────────────────────────────
// South Africa pilot apps. Additional markets will be added when enabled.

export const APP_REGISTRY: AppProperty[] = [

  // ─── Customer-facing: South Africa ──────────────────────────────────────────
  {
    id:                 'za-main-website',
    name:               'Company Website',
    shortName:          'mycompany.co.za',
    type:               'website',
    description:        'Main public-facing marketing and product website for South Africa.',
    market:             'za',
    ownerDivision:      'MARKETING',
    sharedWith:         ['CUSTOMER_SUPPORT', 'PRODUCT'],
    status:             'live',
    url:                'https://mycompany.co.za',
    integrationMethods: ['js-snippet', 'webhook'],
    icon:               '🌐',
    color:              '#3b82f6',
    agentsDeployed:     2,
    monthlyUsers:       48200,
    environment:        'production',
  },
  {
    id:                 'za-support-portal',
    name:               'Customer Support Portal',
    shortName:          'support.mycompany.co.za',
    type:               'website',
    description:        'Self-service support portal where customers log and track tickets.',
    market:             'za',
    ownerDivision:      'CUSTOMER_SUPPORT',
    sharedWith:         ['MARKETING'],
    status:             'live',
    url:                'https://support.mycompany.co.za',
    integrationMethods: ['js-snippet', 'webhook', 'api-key'],
    icon:               '🎧',
    color:              '#0d9488',
    agentsDeployed:     3,
    monthlyUsers:       12400,
    environment:        'production',
  },
  {
    id:                 'za-employee-portal',
    name:               'Employee Self-Service Portal',
    shortName:          'hr.mycompany.co.za',
    type:               'internal-portal',
    description:        'Internal HR and IT self-service portal for all South Africa employees.',
    market:             'za',
    ownerDivision:      'HR',
    sharedWith:         ['IT', 'FINANCE', 'LEGAL', 'COMPLIANCE'],
    status:             'live',
    url:                'https://hr.mycompany.co.za',
    integrationMethods: ['js-snippet', 'api-key'],
    icon:               '🏢',
    color:              '#8b5cf6',
    agentsDeployed:     4,
    monthlyUsers:       1840,
    environment:        'production',
  },
  {
    id:                 'za-compliance-portal',
    name:               'Compliance & Risk Portal',
    shortName:          'compliance.mycompany.co.za',
    type:               'internal-portal',
    description:        'Internal portal for risk assessments, compliance tracking, and audit evidence.',
    market:             'za',
    ownerDivision:      'COMPLIANCE',
    sharedWith:         ['RISK', 'LEGAL', 'SECURITY'],
    status:             'live',
    url:                'https://compliance.mycompany.co.za',
    integrationMethods: ['js-snippet', 'api-key', 'webhook'],
    icon:               '📋',
    color:              '#1d4ed8',
    agentsDeployed:     3,
    monthlyUsers:       320,
    environment:        'production',
  },
  {
    id:                 'za-ios-app',
    name:               'iOS Mobile App',
    shortName:          'MyCompany iOS',
    type:               'mobile-ios',
    description:        'Native iOS app for customers. Available on South African App Store.',
    market:             'za',
    ownerDivision:      'PRODUCT',
    sharedWith:         ['ENGINEERING', 'CUSTOMER_SUPPORT', 'MARKETING'],
    status:             'live',
    identifier:         'com.mycompany.app.ios',
    integrationMethods: ['mobile-sdk', 'webhook'],
    icon:               '📱',
    color:              '#f59e0b',
    agentsDeployed:     1,
    monthlyUsers:       29600,
    environment:        'production',
  },
  {
    id:                 'za-android-app',
    name:               'Android Mobile App',
    shortName:          'MyCompany Android',
    type:               'mobile-android',
    description:        'Native Android app for customers. Available on Google Play for South Africa.',
    market:             'za',
    ownerDivision:      'PRODUCT',
    sharedWith:         ['ENGINEERING', 'CUSTOMER_SUPPORT', 'MARKETING'],
    status:             'live',
    identifier:         'com.mycompany.app.android',
    integrationMethods: ['mobile-sdk', 'webhook'],
    icon:               '🤖',
    color:              '#84cc16',
    agentsDeployed:     1,
    monthlyUsers:       34100,
    environment:        'production',
  },
  {
    id:                 'za-whatsapp-main',
    name:               'WhatsApp Business Line',
    shortName:          '+27 81 000 0000',
    type:               'whatsapp',
    description:        'Primary WhatsApp Business number for South Africa customer interactions.',
    market:             'za',
    ownerDivision:      'CUSTOMER_SUPPORT',
    sharedWith:         ['MARKETING', 'HR'],
    status:             'live',
    identifier:         '+27810000000',
    integrationMethods: ['whatsapp-cloud'],
    icon:               '💬',
    color:              '#25d366',
    agentsDeployed:     2,
    monthlyUsers:       8400,
    environment:        'production',
  },
  {
    id:                 'za-api-platform',
    name:               'Internal API Platform',
    shortName:          'api.mycompany.co.za',
    type:               'api',
    description:        'Core internal API gateway used by engineering, data, and infra teams.',
    market:             'za',
    ownerDivision:      'ENGINEERING',
    sharedWith:         ['DATA_ANALYTICS', 'INFRA_OPS', 'QA'],
    status:             'live',
    url:                'https://api.mycompany.co.za',
    integrationMethods: ['api-key', 'webhook'],
    icon:               '⚙️',
    color:              '#0d9488',
    agentsDeployed:     2,
    monthlyUsers:       0,
    environment:        'production',
  },
  {
    id:                 'za-marketing-staging',
    name:               'Marketing Website (Staging)',
    shortName:          'staging.mycompany.co.za',
    type:               'website',
    description:        'Staging environment for marketing website — used to test agents before going live.',
    market:             'za',
    ownerDivision:      'MARKETING',
    sharedWith:         ['ENGINEERING', 'QA'],
    status:             'staging',
    url:                'https://staging.mycompany.co.za',
    integrationMethods: ['js-snippet', 'webhook'],
    icon:               '🧪',
    color:              '#f59e0b',
    agentsDeployed:     0,
    monthlyUsers:       0,
    environment:        'staging',
  },
  {
    id:                 'za-ussd',
    name:               'USSD Service (*120*XXX#)',
    shortName:          '*120*XXX#',
    type:               'ussd',
    description:        'USSD shortcode for feature-phone and low-bandwidth access in South Africa.',
    market:             'za',
    ownerDivision:      'CUSTOMER_SUPPORT',
    sharedWith:         ['ENGINEERING'],
    status:             'live',
    identifier:         '*120*567#',
    integrationMethods: ['ussd-gateway'],
    icon:               '📟',
    color:              '#6366f1',
    agentsDeployed:     0,
    monthlyUsers:       5200,
    environment:        'production',
  },

  // ─── Placeholder stubs for other markets (added when enabled) ────────────────
  {
    id:                 'ng-main-website',
    name:               'Company Website (Nigeria)',
    shortName:          'mycompany.ng',
    type:               'website',
    description:        'Main public-facing website for Nigeria.',
    market:             'ng',
    ownerDivision:      'MARKETING',
    status:             'development',
    url:                'https://mycompany.ng',
    integrationMethods: ['js-snippet'],
    icon:               '🌐',
    color:              '#3b82f6',
    agentsDeployed:     0,
    monthlyUsers:       0,
    environment:        'development',
  },
  {
    id:                 'ke-main-website',
    name:               'Company Website (Kenya)',
    shortName:          'mycompany.co.ke',
    type:               'website',
    description:        'Main public-facing website for Kenya.',
    market:             'ke',
    ownerDivision:      'MARKETING',
    status:             'development',
    url:                'https://mycompany.co.ke',
    integrationMethods: ['js-snippet'],
    icon:               '🌐',
    color:              '#3b82f6',
    agentsDeployed:     0,
    monthlyUsers:       0,
    environment:        'development',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getAppsByMarket(marketId: string): AppProperty[] {
  return APP_REGISTRY.filter(a => a.market === marketId)
}

export function getAppsByDivision(divisionId: DivisionId): AppProperty[] {
  return APP_REGISTRY.filter(
    a => a.ownerDivision === divisionId || (a.sharedWith ?? []).includes(divisionId)
  )
}

export function getCompatibleApps(agentDepartment: string): AppProperty[] {
  // Returns apps this agent type can reasonably be deployed into
  return APP_REGISTRY.filter(app => {
    // Internal portals for internal departments
    const internalDepts = ['HR', 'LEGAL', 'COMPLIANCE', 'RISK', 'SECURITY', 'FINANCE', 'IT', 'EXECUTIVE', 'OPERATIONS', 'DATA_ANALYTICS', 'INFRA_OPS', 'ENGINEERING', 'QA', 'PRODUCT']
    if (internalDepts.includes(agentDepartment)) {
      return app.type === 'internal-portal' || app.type === 'api' ||
        app.ownerDivision === agentDepartment ||
        (app.sharedWith ?? []).includes(agentDepartment)
    }
    // Customer-facing for marketing and support
    if (agentDepartment === 'MARKETING') {
      return ['website', 'mobile-ios', 'mobile-android', 'whatsapp'].includes(app.type)
    }
    if (agentDepartment === 'CUSTOMER_SUPPORT') {
      return ['website', 'mobile-ios', 'mobile-android', 'whatsapp', 'ussd', 'internal-portal'].includes(app.type)
    }
    return true
  })
}
