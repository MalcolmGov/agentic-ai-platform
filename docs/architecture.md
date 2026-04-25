# Swifter AI Platform — System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI["Dashboard UI<br/>(Next.js App Router)"]
        API_C["API Clients<br/>(REST / SDK)"]
    end

    subgraph "API Gateway"
        AUTH["JWT Auth<br/>Middleware"]
        RATE["Rate Limiter"]
        RBAC["RBAC<br/>Middleware"]
    end

    subgraph "Application Layer"
        AGENTS["Agent<br/>Orchestrator"]
        WORKFLOWS["Workflow<br/>Engine"]
        INTEGRATIONS["Integration<br/>Hub"]
        ANALYTICS["Analytics<br/>Engine"]
    end

    subgraph "Agent Runtime"
        REGISTRY["Agent<br/>Registry"]
        EXECUTOR["Agent<br/>Executor"]
        TOOLS["Tool<br/>Framework"]
        MEMORY["Agent<br/>Memory"]
    end

    subgraph "Data Layer"
        PG["PostgreSQL<br/>(Primary DB)"]
        VECTOR["Vector DB<br/>(Pinecone / pgvector)"]
        REDIS["Redis<br/>(Cache / Queue)"]
        S3["Object Storage<br/>(S3 / R2)"]
    end

    subgraph "External Services"
        LLM["LLM Providers<br/>(OpenAI / Anthropic)"]
        EXT_API["External APIs<br/>(Stripe, Slack, etc.)"]
        WEBHOOK["Webhook<br/>Endpoints"]
    end

    UI --> AUTH
    API_C --> AUTH
    AUTH --> RATE --> RBAC

    RBAC --> AGENTS
    RBAC --> WORKFLOWS
    RBAC --> INTEGRATIONS
    RBAC --> ANALYTICS

    AGENTS --> REGISTRY
    AGENTS --> EXECUTOR
    EXECUTOR --> TOOLS
    EXECUTOR --> MEMORY
    EXECUTOR --> LLM

    WORKFLOWS --> AGENTS
    INTEGRATIONS --> EXT_API
    INTEGRATIONS --> WEBHOOK

    TOOLS --> EXT_API
    TOOLS --> PG

    MEMORY --> VECTOR
    MEMORY --> REDIS

    AGENTS --> PG
    WORKFLOWS --> PG
    ANALYTICS --> PG
    ANALYTICS --> VECTOR

    AGENTS --> S3
```

## Component Overview

| Component | Technology | Purpose |
|---|---|---|
| Dashboard UI | Next.js 15 + TypeScript | Admin portal with agent management, analytics, workflows |
| API Layer | Next.js Route Handlers | RESTful API with JWT auth, RBAC, rate limiting |
| Agent Orchestrator | Custom TypeScript framework | Lifecycle management, scheduling, execution |
| Workflow Engine | Event-driven FSM | Multi-step workflow automation with branching |
| Integration Hub | Adapter pattern | Unified interface for external services |
| Primary Database | PostgreSQL + Prisma | Multi-tenant data storage with audit trail |
| Vector Database | Pinecone / pgvector | Agent memory, semantic search, RAG |
| Cache / Queue | Redis | Session cache, job queues, rate limiting |
| LLM Gateway | OpenAI / Anthropic API | Language model inference with failover |

## Data Flow — Agent Execution

```mermaid
sequenceDiagram
    participant U as User / Trigger
    participant API as API Gateway
    participant O as Orchestrator
    participant R as Agent Registry
    participant E as Agent Executor
    participant LLM as LLM Provider
    participant T as Tool Framework
    participant DB as PostgreSQL
    participant V as Vector DB

    U->>API: POST /api/agents/{id}/execute
    API->>API: Authenticate + Authorize
    API->>O: Execute Agent Request

    O->>R: Lookup Agent Type
    R-->>O: Agent Constructor

    O->>E: Create Execution Context
    E->>V: Load Agent Memory
    V-->>E: Previous Context

    E->>E: Phase 1: Init
    E->>E: Phase 2: Plan
    
    loop For each planned step
        E->>LLM: Generate reasoning
        LLM-->>E: Response
        E->>T: Execute tools
        T-->>E: Tool results
    end

    E->>E: Phase 4: Report
    E->>V: Store new memories
    E->>DB: Save execution log

    E-->>O: AgentResult
    O-->>API: Response
    API-->>U: JSON Response
```

## Multi-Tenant Architecture

```mermaid
graph LR
    subgraph "Tenant A (Bank)"
        A1["Fraud Agent"]
        A2["Compliance Agent"]
        A3["Finance Agent"]
    end

    subgraph "Tenant B (Retailer)"
        B1["Customer Support Agent"]
        B2["Operations Agent"]
        B3["Reporting Agent"]
    end

    subgraph "Shared Infrastructure"
        DB["PostgreSQL<br/>(Row-Level Isolation)"]
        LLM["LLM Gateway"]
        Q["Job Queue"]
    end

    A1 --> DB
    A2 --> DB
    A3 --> DB
    B1 --> DB
    B2 --> DB
    B3 --> DB

    A1 --> LLM
    B1 --> LLM
```

## Deployment Topology

```mermaid
graph TB
    subgraph "CDN / Edge"
        CF["Cloudflare CDN"]
    end

    subgraph "Compute"
        NEXT["Next.js<br/>(Vercel / Docker)"]
        WORKERS["Agent Workers<br/>(Horizontal Scale)"]
    end

    subgraph "Data"
        PG_P["PostgreSQL Primary"]
        PG_R["PostgreSQL Replica"]
        REDIS_C["Redis Cluster"]
        VECTOR_C["Vector DB Cluster"]
    end

    subgraph "Monitoring"
        LOGS["Log Aggregation"]
        METRICS["Metrics / APM"]
        ALERTS["Alert Manager"]
    end

    CF --> NEXT
    NEXT --> WORKERS
    WORKERS --> PG_P
    PG_P --> PG_R
    WORKERS --> REDIS_C
    WORKERS --> VECTOR_C
    NEXT --> LOGS
    WORKERS --> LOGS
    LOGS --> METRICS
    METRICS --> ALERTS
```

## Folder Structure

```
swifter-ai-platform/
├── prisma/
│   └── schema.prisma              # Database schema (11 models)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   ├── globals.css            # Design system
│   │   ├── api/
│   │   │   ├── agents/route.ts    # Agent CRUD API
│   │   │   ├── workflows/route.ts # Workflow API
│   │   │   ├── analytics/route.ts # Analytics API
│   │   │   └── logs/route.ts      # Audit logs API
│   │   └── dashboard/
│   │       ├── layout.tsx         # Dashboard shell (sidebar + topbar)
│   │       ├── page.tsx           # Overview dashboard
│   │       ├── agents/page.tsx    # Agent management
│   │       ├── workflows/page.tsx # Workflow builder
│   │       ├── integrations/page.tsx
│   │       ├── logs/page.tsx      # Logs & audit trail
│   │       ├── analytics/page.tsx # AI insights
│   │       └── settings/page.tsx  # Settings & billing
│   ├── components/
│   │   └── icons.tsx              # SVG icon components
│   └── lib/
│       └── agents/
│           ├── base-agent.ts      # Abstract agent class
│           ├── agent-registry.ts  # Agent type registry
│           ├── agent-executor.ts  # Orchestration engine
│           └── types/
│               └── fraud-monitoring-agent.ts
└── docs/
    └── architecture.md            # This document
```
