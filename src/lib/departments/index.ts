export type DepartmentId =
  | 'HR'
  | 'LEGAL'
  | 'ENGINEERING'
  | 'RISK'
  | 'SECURITY'
  | 'COMPLIANCE'
  | 'QA'
  | 'PRODUCT'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'EXECUTIVE'
  | 'IT'
  | 'MARKETING'
  | 'DATA_ANALYTICS'
  | 'INFRA_OPS'
  | 'CUSTOMER_SUPPORT'

export interface NavItem {
  href: string
  label: string
  icon: string
  description?: string
}

export interface DepartmentConfig {
  id: DepartmentId
  label: string
  icon: string
  color: string
  description: string
  agentCount: number
  primaryAgents: string[]
  navItems: NavItem[]
}

export const DEPARTMENTS: Record<DepartmentId, DepartmentConfig> = {
  HR: {
    id: 'HR',
    label: 'Human Resources',
    icon: '👥',
    color: '#8b5cf6',
    description: 'HR agents for onboarding, policies, and people management',
    agentCount: 5,
    primaryAgents: ['HR_ONBOARDING', 'HR_POLICY_QA', 'HR_JOB_DESCRIPTION', 'HR_LEAVE_ASSISTANT', 'HR_PERFORMANCE_REVIEW'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon', description: 'Your deployed HR agents' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon', description: 'Browse HR agent templates' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon', description: 'HR process automation' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon', description: 'Pending approvals' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/logs', label: 'Activity Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  LEGAL: {
    id: 'LEGAL',
    label: 'Legal',
    icon: '⚖️',
    color: '#0891b2',
    description: 'Legal agents for contract review, policy Q&A, and compliance',
    agentCount: 4,
    primaryAgents: ['LEGAL_CONTRACT_REVIEW', 'LEGAL_POLICY_QA', 'LEGAL_NDA_CLASSIFIER', 'LEGAL_COMPLIANCE_CHECK'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/logs', label: 'Audit Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  ENGINEERING: {
    id: 'ENGINEERING',
    label: 'Engineering',
    icon: '💻',
    color: '#0d9488',
    description: 'Engineering agents for code review, incidents, and runbooks',
    agentCount: 3,
    primaryAgents: ['ENGINEERING_CODE_REVIEWER', 'ENGINEERING_RUNBOOK_ASSISTANT', 'ENGINEERING_INCIDENT_RESPONDER'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/studio', label: 'Agent Studio', icon: 'WorkflowIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon' },
      { href: '/dashboard/experiments', label: 'A/B Testing', icon: 'AnalyticsIcon' },
      { href: '/dashboard/logs', label: 'Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  RISK: {
    id: 'RISK',
    label: 'Risk',
    icon: '⚠️',
    color: '#dc2626',
    description: 'Risk agents for assessment, monitoring, and incident reporting',
    agentCount: 3,
    primaryAgents: ['RISK_ASSESSMENT', 'RISK_INCIDENT_REPORTER', 'RISK_FRAUD_MONITORING'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/analytics', label: 'Risk Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/logs', label: 'Audit Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  SECURITY: {
    id: 'SECURITY',
    label: 'Security',
    icon: '🔒',
    color: '#b45309',
    description: 'Security agents for alert triage, access review, and phishing response',
    agentCount: 3,
    primaryAgents: ['SECURITY_ALERT_EXPLAINER', 'SECURITY_ACCESS_REVIEW', 'SECURITY_PHISHING_TRIAGE'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/logs', label: 'Security Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  COMPLIANCE: {
    id: 'COMPLIANCE',
    label: 'Compliance',
    icon: '📊',
    color: '#1d4ed8',
    description: 'Compliance agents for regulation Q&A, policy checking, and audit logging',
    agentCount: 3,
    primaryAgents: ['COMPLIANCE_REGULATION_QA', 'COMPLIANCE_POLICY_CHECKER', 'COMPLIANCE_AUDIT_LOGGER'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/logs', label: 'Compliance Log', icon: 'LogIcon' },
      { href: '/dashboard/analytics', label: 'Compliance Reports', icon: 'AnalyticsIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  QA: {
    id: 'QA',
    label: 'Quality Assurance',
    icon: '🧪',
    color: '#059669',
    description: 'QA agents for test generation, bug triage, and regression analysis',
    agentCount: 3,
    primaryAgents: ['QA_TEST_CASE_GENERATOR', 'QA_BUG_TRIAGE', 'QA_REGRESSION_ANALYST'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/studio', label: 'Agent Studio', icon: 'WorkflowIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/experiments', label: 'Experiments', icon: 'AnalyticsIcon' },
      { href: '/dashboard/logs', label: 'Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  PRODUCT: {
    id: 'PRODUCT',
    label: 'Product',
    icon: '💡',
    color: '#7c3aed',
    description: 'Product agents for feedback analysis, PRD writing, and roadmap insights',
    agentCount: 3,
    primaryAgents: ['PRODUCT_FEEDBACK_SUMMARISER', 'PRODUCT_PRD_ASSISTANT', 'PRODUCT_ROADMAP_ANALYST'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/analytics', label: 'Product Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/insights', label: 'Predictions', icon: 'AnalyticsIcon' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  OPERATIONS: {
    id: 'OPERATIONS',
    label: 'Operations',
    icon: '⚙️',
    color: '#475569',
    description: 'Operations agents for workflow automation and data analysis',
    agentCount: 2,
    primaryAgents: ['OPERATIONS_WORKFLOW_AUTOMATION', 'OPERATIONS_DATA_ANALYST'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon' },
      { href: '/dashboard/analytics', label: 'Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/logs', label: 'Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  FINANCE: {
    id: 'FINANCE',
    label: 'Finance',
    icon: '💰',
    color: '#ca8a04',
    description: 'Finance agents for reporting, budget analysis, and forecasting',
    agentCount: 2,
    primaryAgents: ['FINANCE_REPORTING', 'FINANCE_BUDGET_ANALYST'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/analytics', label: 'Finance Reports', icon: 'AnalyticsIcon' },
      { href: '/dashboard/logs', label: 'Audit Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    label: 'Executive',
    icon: '🎯',
    color: '#be123c',
    description: 'Executive overview across all departments',
    agentCount: 0,
    primaryAgents: [],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'All Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/analytics', label: 'Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/users', label: 'Users', icon: 'UsersIcon' },
      { href: '/dashboard/logs', label: 'Audit Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  IT: {
    id: 'IT',
    label: 'Information Technology',
    icon: '🖥️',
    color: '#0369a1',
    description: 'IT management and support agents',
    agentCount: 0,
    primaryAgents: [],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/studio', label: 'Agent Studio', icon: 'WorkflowIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/integrations', label: 'Integrations', icon: 'IntegrationIcon' },
      { href: '/dashboard/users', label: 'Users', icon: 'UsersIcon' },
      { href: '/dashboard/logs', label: 'Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  MARKETING: {
    id: 'MARKETING',
    label: 'Marketing',
    icon: '📣',
    color: '#e11d48',
    description: 'Marketing agents for campaigns, content, SEO, and brand management',
    agentCount: 5,
    primaryAgents: ['MARKETING_CAMPAIGN_COPYWRITER', 'MARKETING_SOCIAL_MEDIA', 'MARKETING_SEO_OPTIMIZER', 'MARKETING_EMAIL_ANALYZER', 'MARKETING_BRAND_VOICE'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon', description: 'Your deployed Marketing agents' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon', description: 'Browse Marketing agent templates' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon', description: 'Campaign automation workflows' },
      { href: '/dashboard/analytics', label: 'Campaign Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/logs', label: 'Activity Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  DATA_ANALYTICS: {
    id: 'DATA_ANALYTICS',
    label: 'Data & Analytics',
    icon: '📊',
    color: '#0284c7',
    description: 'Data agents for quality checks, SQL generation, anomaly detection, and reporting',
    agentCount: 5,
    primaryAgents: ['DATA_QUALITY_CHECKER', 'DATA_SQL_GENERATOR', 'DATA_INSIGHTS_SUMMARISER', 'DATA_ANOMALY_DETECTOR', 'DATA_REPORT_NARRATOR'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/analytics', label: 'Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/studio', label: 'Agent Studio', icon: 'WorkflowIcon' },
      { href: '/dashboard/integrations', label: 'Data Integrations', icon: 'IntegrationIcon' },
      { href: '/dashboard/logs', label: 'Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  INFRA_OPS: {
    id: 'INFRA_OPS',
    label: 'Infrastructure & Ops',
    icon: '🖥️',
    color: '#374151',
    description: 'Infrastructure agents for incident triage, capacity planning, change management, and SLA monitoring',
    agentCount: 5,
    primaryAgents: ['INFRA_INCIDENT_TRIAGE', 'INFRA_CAPACITY_PLANNING', 'INFRA_CHANGE_ANALYZER', 'INFRA_SLA_MONITOR', 'INFRA_RUNBOOK_GENERATOR'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon' },
      { href: '/dashboard/approvals', label: 'Change Approvals', icon: 'AgentIcon' },
      { href: '/dashboard/scaling', label: 'Scaling', icon: 'WorkflowIcon' },
      { href: '/dashboard/logs', label: 'Ops Logs', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
  CUSTOMER_SUPPORT: {
    id: 'CUSTOMER_SUPPORT',
    label: 'Customer Support',
    icon: '🎧',
    color: '#0d9488',
    description: 'Support agents for ticket management, response drafting, escalation, chatbots, voice assistants, and sentiment analysis',
    agentCount: 16,
    primaryAgents: ['SUPPORT_TICKET_CLASSIFIER', 'SUPPORT_RESPONSE_DRAFTER', 'CHATBOT_WEBSITE_BUILDER', 'CHATBOT_WHATSAPP_BOT', 'CHATBOT_VOICE_IVR', 'CHATBOT_HELPDESK_BOT', 'SUPPORT_SENTIMENT_ANALYZER', 'SUPPORT_CHURN_INTERVENTION'],
    navItems: [
      { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
      { href: '/dashboard/agents', label: 'My Agents', icon: 'AgentIcon' },
      { href: '/dashboard/marketplace', label: 'Agent Library', icon: 'IntegrationIcon' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
      { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
      { href: '/dashboard/workflows', label: 'Conversation Flows', icon: 'WorkflowIcon' },
      { href: '/dashboard/analytics', label: 'Support Analytics', icon: 'AnalyticsIcon' },
      { href: '/dashboard/approvals', label: 'Escalations', icon: 'AgentIcon' },
      { href: '/dashboard/integrations', label: 'Channel Integrations', icon: 'IntegrationIcon' },
      { href: '/dashboard/logs', label: 'Activity Log', icon: 'LogIcon' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
    ],
  },
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'DashboardIcon' },
  { href: '/dashboard/agents', label: 'Agents', icon: 'AgentIcon' },
  { href: '/dashboard/studio', label: 'Agent Studio', icon: 'WorkflowIcon' },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: 'IntegrationIcon' },
  { href: '/dashboard/markets', label: 'Markets', icon: 'AnalyticsIcon' },
  { href: '/dashboard/apps', label: 'Apps & Properties', icon: 'IntegrationIcon' },
  { href: '/dashboard/docs/mobile-sdk', label: 'Mobile SDK Docs', icon: 'IntegrationIcon' },
  { href: '/dashboard/workflows', label: 'Workflows', icon: 'WorkflowIcon' },
  { href: '/dashboard/approvals', label: 'Approvals', icon: 'AgentIcon' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'AnalyticsIcon' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: 'IntegrationIcon' },
  { href: '/dashboard/users', label: 'Users', icon: 'UsersIcon' },
  { href: '/dashboard/logs', label: 'Logs & Audit', icon: 'LogIcon' },
  { href: '/dashboard/settings/white-label', label: 'White-Label', icon: 'SettingsIcon' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'SettingsIcon' },
]

export function getDepartmentNav(department: DepartmentId | null, role: string): NavItem[] {
  if (role === 'OWNER' || role === 'ADMIN') return ADMIN_NAV_ITEMS
  if (!department) return ADMIN_NAV_ITEMS
  return DEPARTMENTS[department]?.navItems ?? ADMIN_NAV_ITEMS
}

export function getDepartmentConfig(department: DepartmentId | null): DepartmentConfig | null {
  if (!department) return null
  return DEPARTMENTS[department] ?? null
}
