import Link from "next/link";
import Image from "next/image";

const BLOG_POSTS = [
  {
    title: "Why Glass Box AI Changes Everything for Regulated Industries",
    excerpt: "Traditional AI systems are black boxes. Our Glass Box AI provides full reasoning transparency with 6-phase cognitive replay, compliance-ready PDF exports, and real-time confidence scoring.",
    date: "March 24, 2026",
    category: "Product",
    gradient: "from-cyan-500 to-blue-500",
    readTime: "8 min",
  },
  {
    title: "Building Multi-Agent Systems That Actually Work",
    excerpt: "We share the architecture behind our Multi-Agent Collaboration engine — how FraudGuard, ComplianceBot, and DataMiner delegate, coordinate, and solve problems autonomously.",
    date: "March 18, 2026",
    category: "Engineering",
    gradient: "from-emerald-500 to-teal-500",
    readTime: "12 min",
  },
  {
    title: "Agent Studio: No-Code Agent Building Is Here",
    excerpt: "Introducing Agent Studio — our drag-and-drop visual canvas for building production AI agents. 6 node types, 3 templates, and zero code required.",
    date: "March 12, 2026",
    category: "Product",
    gradient: "from-violet-500 to-fuchsia-500",
    readTime: "6 min",
  },
  {
    title: "How Crystal Ball Predicts Problems Before They Happen",
    excerpt: "Deep dive into our 538-line predictive engine powering Crystal Ball — time-series forecasting, anomaly detection, and trend analysis with 87% confidence.",
    date: "March 6, 2026",
    category: "Engineering",
    gradient: "from-amber-500 to-orange-500",
    readTime: "10 min",
  },
  {
    title: "Voice-First Agent Control: The Future of DevOps",
    excerpt: "Talk to your AI agents using WebRTC speech-to-speech powered by OpenAI's Realtime API. Deploy agents, get briefings, and manage your fleet — all by voice.",
    date: "February 28, 2026",
    category: "Product",
    gradient: "from-sky-500 to-cyan-500",
    readTime: "5 min",
  },
  {
    title: "Security Architecture for Enterprise AI Agents",
    excerpt: "AES-256 encryption, RBAC with 5 roles, JWT + scoped API keys, full audit trails, and SSO/SAML. How we built bank-grade security for autonomous agents.",
    date: "February 20, 2026",
    category: "Security",
    gradient: "from-emerald-500 to-green-600",
    readTime: "9 min",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo-3d.png" alt="AI Platform" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-text-primary">AI Platform</span>
            <span className="text-text-muted text-sm">/ Blog</span>
          </Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2">Start Free →</Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">Blog</div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Engineering & Product Updates</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Deep dives into our architecture, product launches, and the future of autonomous AI agents.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {BLOG_POSTS.map((post, i) => (
            <article key={post.title} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-900/50 hover:border-electric-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)]">
              <div className={`h-48 bg-gradient-to-br ${post.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="p-6 -mt-8 relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${post.gradient} text-white`}>{post.category}</span>
                  <span className="text-xs text-text-muted">{post.date}</span>
                  <span className="text-xs text-text-muted">· {post.readTime} read</span>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-3 group-hover:text-electric-400 transition-colors leading-tight">{post.title}</h2>
                <p className="text-text-secondary text-sm leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 text-electric-400 text-sm font-medium group-hover:underline">Read more →</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
