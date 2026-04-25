"use client";

const activeUsers = [
  { name: "Malcolm Chen", avatar: "MC", page: "/dashboard", status: "online" as const, role: "Owner" },
  { name: "Sarah Kim", avatar: "SK", page: "/dashboard/agents", status: "online" as const, role: "Admin" },
  { name: "James Rodriguez", avatar: "JR", page: "/dashboard/analytics", status: "away" as const, role: "Analyst" },
];

const activityFeed = [
  { user: "Sarah Kim", avatar: "SK", action: "deployed", resource: "Fraud Monitoring Agent v2", time: "5 min ago", icon: "🚀" },
  { user: "James Rodriguez", avatar: "JR", action: "reviewed execution", resource: "exec_001", time: "12 min ago", icon: "👀" },
  { user: "Malcolm Chen", avatar: "MC", action: "created workflow", resource: "Monthly Compliance Report", time: "25 min ago", icon: "📋" },
  { user: "Sarah Kim", avatar: "SK", action: "approved gate", resource: "Fraud Agent — Block account", time: "1 hour ago", icon: "✅" },
  { user: "James Rodriguez", avatar: "JR", action: "commented on", resource: "Risk scoring step in exec_001", time: "1 hour ago", icon: "💬" },
  { user: "Malcolm Chen", avatar: "MC", action: "updated settings", resource: "LLM Provider Configuration", time: "2 hours ago", icon: "⚙️" },
  { user: "Sarah Kim", avatar: "SK", action: "ran A/B test", resource: "Fraud Agent: Concise vs Verbose", time: "3 hours ago", icon: "🧪" },
  { user: "James Rodriguez", avatar: "JR", action: "exported report", resource: "Q1 Analytics Summary", time: "4 hours ago", icon: "📊" },
];

const annotations = [
  { user: "James Rodriguez", avatar: "JR", execution: "exec_001", step: "Risk Scoring (Step 2)", comment: "Risk score seems high for this merchant category — should we adjust the threshold?", time: "1 hour ago" },
  { user: "Sarah Kim", avatar: "SK", execution: "exec_001", step: "Risk Scoring (Step 2)", comment: "Agreed, let's lower to 0.65 for verified merchants.", time: "55 min ago" },
];

const stats = { online: 2, away: 1, annotations: 2, activitiesToday: 8, mostActive: "Sarah Kim" };

const statusColors: Record<string, string> = { online: "bg-emerald-500", away: "bg-amber-500", offline: "bg-gray-500" };

export default function CollaborationPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Team Collaboration</h1>
        <p className="text-text-secondary mt-1">Real-time presence, activity feed, and execution annotations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: "Online", value: stats.online, color: "text-emerald-400" },
          { label: "Away", value: stats.away, color: "text-amber-400" },
          { label: "Annotations", value: stats.annotations, color: "text-violet-400" },
          { label: "Activities Today", value: stats.activitiesToday, color: "text-electric-400" },
          { label: "Most Active", value: stats.mostActive, color: "text-text-primary", small: true },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className={`${s.small ? "text-sm" : "text-xl"} font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Users */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Team Members</h2>
          <div className="space-y-3">
            {activeUsers.map((user) => (
              <div key={user.name} className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-electric-500/20 flex items-center justify-center text-xs font-bold text-electric-400">{user.avatar}</div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-navy-900 ${statusColors[user.status]}`} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-text-primary">{user.name}</div>
                  <div className="text-[10px] text-text-muted">{user.role} · {user.page}</div>
                </div>
                <span className={`text-[9px] capitalize ${user.status === "online" ? "text-emerald-400" : "text-amber-400"}`}>{user.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Activity Feed</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {activityFeed.map((event, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-electric-500/20 flex items-center justify-center text-xs font-bold text-electric-400 shrink-0">{event.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{event.user}</span>{" "}
                    {event.action}{" "}
                    <span className="text-electric-400">{event.resource}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{event.time}</div>
                </div>
                <span className="text-lg shrink-0">{event.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Annotations */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Execution Annotations</h2>
        <div className="space-y-4">
          {annotations.map((ann, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-navy-800/30">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">{ann.avatar}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-primary">{ann.user}</span>
                  <span className="text-[10px] text-text-muted">on {ann.step}</span>
                  <span className="text-[10px] text-text-muted">· {ann.time}</span>
                </div>
                <p className="text-xs text-text-secondary">{ann.comment}</p>
                <div className="text-[10px] text-electric-400 mt-1">Execution: {ann.execution}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
