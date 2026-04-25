import Link from "next/link";
import Image from "next/image";

const API_SECTIONS = [
  {
    title: "Authentication",
    endpoints: [
      { method: "POST", path: "/api/auth/register", desc: "Create a new user account" },
      { method: "POST", path: "/api/auth/login", desc: "Authenticate and receive JWT token" },
    ],
  },
  {
    title: "Agents",
    endpoints: [
      { method: "GET", path: "/api/agents", desc: "List all agents for the tenant" },
      { method: "POST", path: "/api/agents", desc: "Create a new agent" },
      { method: "POST", path: "/api/agents/execute", desc: "Execute an agent with input data" },
      { method: "POST", path: "/api/agents/clone", desc: "Clone an agent configuration" },
      { method: "GET", path: "/api/agents/routing", desc: "Get multi-model routing decisions" },
      { method: "GET", path: "/api/agents/improve", desc: "Get self-improvement suggestions" },
    ],
  },
  {
    title: "Workflows",
    endpoints: [
      { method: "GET", path: "/api/workflows", desc: "List all workflows" },
      { method: "POST", path: "/api/workflows", desc: "Create a new workflow" },
      { method: "POST", path: "/api/workflows/replay", desc: "Replay a workflow execution" },
    ],
  },
  {
    title: "Collaboration",
    endpoints: [
      { method: "GET", path: "/api/collaboration", desc: "Get multi-agent collaboration sessions" },
      { method: "POST", path: "/api/collaboration", desc: "Start a new multi-agent session" },
    ],
  },
  {
    title: "Knowledge & Insights",
    endpoints: [
      { method: "GET", path: "/api/knowledge", desc: "Query the knowledge graph" },
      { method: "POST", path: "/api/knowledge", desc: "Add a node to the knowledge graph" },
      { method: "GET", path: "/api/insights", desc: "Get predictive insights" },
    ],
  },
  {
    title: "Tools & Approvals",
    endpoints: [
      { method: "GET", path: "/api/tools/custom", desc: "List custom tools" },
      { method: "POST", path: "/api/tools/custom", desc: "Register a new custom tool" },
      { method: "GET", path: "/api/approvals", desc: "List pending approvals" },
      { method: "POST", path: "/api/approvals", desc: "Approve or reject an action" },
    ],
  },
  {
    title: "Voice & Streaming",
    endpoints: [
      { method: "POST", path: "/api/voice/commands", desc: "Process a voice command" },
      { method: "GET", path: "/api/agents/stream", desc: "Stream agent execution events (SSE)" },
      { method: "POST", path: "/api/openai-session", desc: "Create an OpenAI Realtime session" },
    ],
  },
  {
    title: "Infrastructure",
    endpoints: [
      { method: "GET", path: "/api/health", desc: "Platform health check" },
      { method: "POST", path: "/api/keys", desc: "Create a scoped API key" },
      { method: "GET", path: "/api/scheduler", desc: "Get scheduled job status" },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10",
  POST: "text-electric-400 bg-electric-500/10",
  PUT: "text-amber-400 bg-amber-500/10",
  DELETE: "text-rose-400 bg-rose-500/10",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="Swifter AI" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-text-primary">Swifter AI</span>
            <span className="text-text-muted text-sm">/ Docs</span>
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">Open Dashboard</Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-400 text-xs font-semibold uppercase tracking-wider mb-4">API Reference</div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Swifter AI Platform API</h1>
          <p className="text-text-secondary text-lg max-w-2xl">Complete REST API documentation for managing agents, workflows, knowledge, and more. All endpoints require a valid JWT token or API key.</p>
        </div>

        {/* Quick Start */}
        <div className="glass-card p-6 mb-12">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Start</h2>
          <div className="bg-navy-950 rounded-xl p-4 font-mono text-sm text-text-secondary overflow-x-auto">
            <div className="text-text-muted mb-2"># 1. Get your API key</div>
            <div className="text-emerald-400">curl -X POST https://api.swifter-ai.com/api/auth/login \</div>
            <div className="text-text-muted ml-4">-H &quot;Content-Type: application/json&quot; \</div>
            <div className="text-text-muted ml-4">-d &apos;{`{"email":"admin@acme.com","password":"admin123"}`}&apos;</div>
            <div className="mt-4 text-text-muted"># 2. Execute an agent</div>
            <div className="text-electric-400">curl -X POST https://api.swifter-ai.com/api/agents/execute \</div>
            <div className="text-text-muted ml-4">-H &quot;Authorization: Bearer YOUR_TOKEN&quot; \</div>
            <div className="text-text-muted ml-4">-d &apos;{`{"agentId":"...","input":{"task":"Analyze transaction txn_123"}}`}&apos;</div>
          </div>
        </div>

        {/* API Sections */}
        <div className="space-y-8">
          {API_SECTIONS.map((section) => (
            <div key={section.title} className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-navy-900/30">
                <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {section.endpoints.map((ep) => (
                  <div key={ep.path + ep.method} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                    <code className="text-sm font-mono text-text-primary">{ep.path}</code>
                    <span className="text-sm text-text-muted ml-auto hidden sm:inline">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-text-muted">Need help? <Link href="/contact" className="text-electric-400 hover:underline">Contact our team</Link></p>
        </div>
      </div>
    </div>
  );
}
