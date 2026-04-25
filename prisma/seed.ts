import { PrismaClient, Department, AgentType, PlanType, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { MARKETS } from '../src/lib/markets'
import { APP_REGISTRY } from '../src/lib/apps'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      industry: 'Financial Services',
      plan: PlanType.ENTERPRISE,
      subscription: {
        create: {
          plan: PlanType.ENTERPRISE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          agentLimit: 100,
          executionLimit: 1000000,
          priceMonthly: 999,
        }
      }
    }
  })

  console.log('✅ Tenant created:', tenant.name)

  // Create users per department
  const passwordHash = await bcrypt.hash('admin123456', 10)

  const users = [
    { email: 'admin@acme.com', name: 'Enterprise Admin', role: UserRole.OWNER, department: null },
    { email: 'hr@acme.com', name: 'Sarah Johnson', role: UserRole.ANALYST, department: Department.HR },
    { email: 'legal@acme.com', name: 'James Mitchell', role: UserRole.ANALYST, department: Department.LEGAL },
    { email: 'risk@acme.com', name: 'Priya Sharma', role: UserRole.ANALYST, department: Department.RISK },
    { email: 'security@acme.com', name: 'Marcus Williams', role: UserRole.DEVELOPER, department: Department.SECURITY },
    { email: 'compliance@acme.com', name: 'Fatima Al-Hassan', role: UserRole.ANALYST, department: Department.COMPLIANCE },
    { email: 'qa@acme.com', name: 'David Chen', role: UserRole.DEVELOPER, department: Department.QA },
    { email: 'product@acme.com', name: 'Aisha Patel', role: UserRole.ANALYST, department: Department.PRODUCT },
    { email: 'engineering@acme.com', name: 'Luca Ferrari', role: UserRole.DEVELOPER, department: Department.ENGINEERING },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash,
        tenantId: tenant.id,
      }
    })
  }

  console.log('✅ Users created:', users.length)

  // Create agent templates
  const templates = [
    // HR Templates
    {
      name: 'HR Onboarding Guide',
      description: 'Guides new employees through the onboarding process, answers questions about company policies, benefits, and first-day procedures.',
      department: Department.HR,
      agentType: AgentType.HR_ONBOARDING,
      systemPrompt: 'You are a friendly HR Onboarding Assistant for Acme Corporation. Help new employees with their onboarding journey. Answer questions about company policies, benefits enrollment, IT setup, and first-day expectations. Be warm, encouraging, and thorough. Always refer to HR for sensitive personal matters.',
      difficulty: 'beginner',
      estimatedSetup: 3,
      tags: ['HR', 'Onboarding', 'New Hire'],
      icon: '👋',
      sortOrder: 1,
    },
    {
      name: 'HR Policy Q&A',
      description: 'Answers employee questions about HR policies including leave, benefits, performance reviews, and workplace guidelines.',
      department: Department.HR,
      agentType: AgentType.HR_POLICY_QA,
      systemPrompt: 'You are an HR Policy Assistant. Answer employee questions about company HR policies accurately and concisely. Topics include: leave policies, benefits, performance management, workplace conduct, and employee rights. Always recommend speaking with HR directly for personal employment matters or anything not clearly covered in policy.',
      difficulty: 'beginner',
      estimatedSetup: 5,
      tags: ['HR', 'Policy', 'Benefits'],
      icon: '📋',
      sortOrder: 2,
    },
    {
      name: 'Job Description Writer',
      description: 'Generates professional, inclusive job descriptions based on role requirements and company standards.',
      department: Department.HR,
      agentType: AgentType.HR_JOB_DESCRIPTION,
      systemPrompt: 'You are an expert HR copywriter specialising in creating compelling, inclusive job descriptions. When given a role title and key requirements, generate a professional job description with: role overview, key responsibilities, required qualifications, preferred qualifications, and company culture section. Use gender-neutral language and avoid jargon that may discourage diverse candidates.',
      difficulty: 'beginner',
      estimatedSetup: 2,
      tags: ['HR', 'Recruiting', 'Job Descriptions'],
      icon: '✍️',
      sortOrder: 3,
    },
    // Legal Templates
    {
      name: 'Contract Review Assistant',
      description: 'Reviews contracts and highlights key clauses, risks, and missing standard provisions. Not a replacement for legal counsel.',
      department: Department.LEGAL,
      agentType: AgentType.LEGAL_CONTRACT_REVIEW,
      systemPrompt: 'You are a legal contract review assistant. Analyse contracts and identify: key parties and obligations, unusual or missing standard clauses, potential risks and red flags, important dates and deadlines, and payment terms. Always clearly state that your analysis is preliminary and that all contracts require review by qualified legal counsel before signing.',
      difficulty: 'intermediate',
      estimatedSetup: 10,
      tags: ['Legal', 'Contracts', 'Risk'],
      icon: '⚖️',
      sortOrder: 10,
    },
    {
      name: 'Legal Policy Q&A',
      description: 'Answers questions about company legal policies, data protection requirements, and regulatory obligations.',
      department: Department.LEGAL,
      agentType: AgentType.LEGAL_POLICY_QA,
      systemPrompt: 'You are a Legal Policy Assistant. Help employees understand company legal policies including data protection, intellectual property, confidentiality, and regulatory compliance. Always emphasise when matters require review by the Legal team and avoid giving specific legal advice on individual situations.',
      difficulty: 'beginner',
      estimatedSetup: 5,
      tags: ['Legal', 'Policy', 'Compliance'],
      icon: '🏛️',
      sortOrder: 11,
    },
    // Risk Templates
    {
      name: 'Risk Assessment Assistant',
      description: 'Helps teams perform structured risk assessments for projects, processes, and decisions.',
      department: Department.RISK,
      agentType: AgentType.RISK_ASSESSMENT,
      systemPrompt: 'You are a Risk Assessment Assistant. Guide users through structured risk identification and assessment processes. Help identify: potential risks and their likelihood, impact severity, existing controls, residual risk levels, and recommended mitigations. Use standard risk frameworks (likelihood x impact matrix). Generate clear risk registers suitable for management review.',
      difficulty: 'intermediate',
      estimatedSetup: 10,
      tags: ['Risk', 'Assessment', 'Governance'],
      icon: '⚠️',
      sortOrder: 20,
    },
    // Security Templates
    {
      name: 'Security Alert Explainer',
      description: 'Explains security alerts and incidents in plain language and guides employees on appropriate response actions.',
      department: Department.SECURITY,
      agentType: AgentType.SECURITY_ALERT_EXPLAINER,
      systemPrompt: 'You are a Security Awareness Assistant. When an employee reports a suspicious email, alert, or security concern, explain what it likely is in plain language, assess the risk level, and provide clear step-by-step response instructions. Always escalate critical threats to the Security team immediately. Educate without causing panic.',
      difficulty: 'beginner',
      estimatedSetup: 3,
      tags: ['Security', 'Alerts', 'Phishing'],
      icon: '🔒',
      sortOrder: 30,
    },
    // Compliance Templates
    {
      name: 'Regulation Q&A',
      description: 'Answers questions about regulatory requirements relevant to your industry and jurisdiction.',
      department: Department.COMPLIANCE,
      agentType: AgentType.COMPLIANCE_REGULATION_QA,
      systemPrompt: 'You are a Compliance Q&A Assistant. Help employees understand regulatory requirements, compliance obligations, and company compliance policies. Cover areas including data protection (GDPR, POPIA), financial regulations, industry standards, and reporting requirements. Always note when specific regulatory interpretation requires review by the Compliance team.',
      difficulty: 'intermediate',
      estimatedSetup: 8,
      tags: ['Compliance', 'Regulation', 'GDPR'],
      icon: '📊',
      sortOrder: 40,
    },
    // QA Templates
    {
      name: 'Test Case Generator',
      description: 'Generates comprehensive test cases from requirements, user stories, or feature descriptions.',
      department: Department.QA,
      agentType: AgentType.QA_TEST_CASE_GENERATOR,
      systemPrompt: 'You are a QA Test Engineer. When given a feature description, user story, or requirements document, generate comprehensive test cases covering: happy path scenarios, edge cases, negative test cases, boundary conditions, and accessibility considerations. Output in a structured format with test ID, description, steps, expected results, and priority.',
      difficulty: 'beginner',
      estimatedSetup: 3,
      tags: ['QA', 'Testing', 'Test Cases'],
      icon: '🧪',
      sortOrder: 50,
    },
    // Product Templates
    {
      name: 'Customer Feedback Summariser',
      description: 'Analyses and summarises customer feedback, reviews, and support tickets to surface key themes and insights.',
      department: Department.PRODUCT,
      agentType: AgentType.PRODUCT_FEEDBACK_SUMMARISER,
      systemPrompt: 'You are a Product Insights Assistant. Analyse customer feedback, reviews, and support tickets to identify: key themes and patterns, sentiment trends, top pain points, feature requests ranked by frequency, and actionable insights for the product team. Present findings in clear, concise summaries with supporting evidence from the data provided.',
      difficulty: 'beginner',
      estimatedSetup: 5,
      tags: ['Product', 'Customer Insights', 'Analytics'],
      icon: '💡',
      sortOrder: 60,
    },
    // Engineering Templates
    {
      name: 'Code Review Assistant',
      description: 'Reviews code changes for quality, security issues, performance concerns, and best practice violations.',
      department: Department.ENGINEERING,
      agentType: AgentType.ENGINEERING_CODE_REVIEWER,
      systemPrompt: 'You are a Code Review Assistant. Analyse code changes and provide structured feedback on: code quality and readability, potential bugs and edge cases, security vulnerabilities, performance considerations, test coverage, and adherence to best practices. Be constructive and educational in feedback. Prioritise issues by severity.',
      difficulty: 'intermediate',
      estimatedSetup: 5,
      tags: ['Engineering', 'Code Review', 'Security'],
      icon: '💻',
      sortOrder: 70,
    },
  ]

  for (const template of templates) {
    await prisma.agentTemplate.upsert({
      where: {
        id: template.name.toLowerCase().replace(/\s+/g, '-')
      },
      update: template,
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
        defaultConfig: {},
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini',
        tools: [],
        published: true,
      }
    })
  }

  console.log('✅ Agent templates created:', templates.length)

  // Create a sample deployed agent instance
  const hrUser = await prisma.user.findFirst({ where: { department: Department.HR } })
  if (hrUser) {
    await prisma.agent.upsert({
      where: { id: 'agent-hr-onboarding-demo' },
      update: {},
      create: {
        id: 'agent-hr-onboarding-demo',
        name: 'HR Onboarding Guide',
        type: AgentType.HR_ONBOARDING,
        description: 'Guides new employees through onboarding',
        department: Department.HR,
        systemPrompt: 'You are a friendly HR Onboarding Assistant for Acme Corporation.',
        status: 'ACTIVE',
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini',
        tools: [],
        tenantId: tenant.id,
        isTemplate: false,
      }
    })
  }

  console.log('✅ Sample agents created')

  await seedMarketsAndApps(tenant.id)

  console.log('🎉 Seeding complete!')
}

// ─── Markets & Apps Seed ──────────────────────────────────────────────────────

async function seedMarketsAndApps(tenantId: string) {
  console.log('🌍 Seeding markets...')

  // Upsert all 13 markets from the static MARKETS array
  for (const market of MARKETS) {
    await prisma.market.upsert({
      where: { code: market.id },
      update: {
        name: market.name,
        flag: market.flag,
        region: market.region,
        status: market.status,
        currencyCode: market.currencyCode,
        dataResidencyLaw: market.dataResidencyLaw,
        dataResidencyRegion: market.dataResidencyRegion,
        complianceNotes: market.complianceNotes,
        isActive: market.status === 'pilot' || market.status === 'available',
      },
      create: {
        code: market.id,
        name: market.name,
        flag: market.flag,
        region: market.region,
        status: market.status,
        currencyCode: market.currencyCode,
        dataResidencyLaw: market.dataResidencyLaw,
        dataResidencyRegion: market.dataResidencyRegion,
        complianceNotes: market.complianceNotes,
        isActive: market.status === 'pilot' || market.status === 'available',
        tenantId,
      },
    })
  }

  console.log(`✅ Markets seeded: ${MARKETS.length}`)

  // Find the South Africa market DB record (needed as FK for SA apps)
  const zaMarket = await prisma.market.findFirst({
    where: { code: 'za', tenantId },
  })

  if (!zaMarket) {
    console.warn('⚠️  ZA market not found — skipping app seeding')
    return
  }

  const saApps = APP_REGISTRY.filter(a => a.market === 'za')
  console.log(`📱 Seeding ${saApps.length} South Africa apps...`)

  for (const app of saApps) {
    // Use the static id as DB id for idempotent upserts
    await prisma.appProperty.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        shortName: app.shortName,
        type: app.type,
        description: app.description,
        ownerDivision: app.ownerDivision,
        sharedWith: app.sharedWith ?? [],
        status: app.status,
        url: app.url ?? null,
        identifier: app.identifier ?? null,
        integrationMethods: app.integrationMethods,
        color: app.color,
      },
      create: {
        id: app.id,
        name: app.name,
        shortName: app.shortName,
        type: app.type,
        description: app.description,
        marketId: zaMarket.id,
        ownerDivision: app.ownerDivision,
        sharedWith: app.sharedWith ?? [],
        status: app.status,
        url: app.url ?? null,
        identifier: app.identifier ?? null,
        integrationMethods: app.integrationMethods,
        color: app.color,
        tenantId,
      },
    })
  }

  console.log(`✅ SA apps seeded: ${saApps.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
