"use client";

import { useState } from "react";

// ═══ Data ═══

interface User {
  id: string; name: string; email: string; role: "owner" | "admin" | "member" | "viewer";
  avatar: string; status: "active" | "invited" | "suspended"; lastActive: string; joinedAt: string;
  agents: number; apiCalls: number;
}

const USERS: User[] = [
  { id: "u1", name: "Sumendran Govender", email: "sumendran@swifter.digital", role: "owner", avatar: "SG", status: "active", lastActive: "Just now", joinedAt: "Mar 1, 2026", agents: 13, apiCalls: 42580 },
  { id: "u2", name: "Priya Naidoo", email: "priya@swifter.digital", role: "admin", avatar: "PN", status: "active", lastActive: "5 min ago", joinedAt: "Mar 5, 2026", agents: 8, apiCalls: 18920 },
  { id: "u3", name: "James van der Merwe", email: "james@swifter.digital", role: "admin", avatar: "JM", status: "active", lastActive: "1 hour ago", joinedAt: "Mar 8, 2026", agents: 10, apiCalls: 24100 },
  { id: "u4", name: "Aisha Mohammed", email: "aisha@swifter.digital", role: "member", avatar: "AM", status: "active", lastActive: "30 min ago", joinedAt: "Mar 12, 2026", agents: 5, apiCalls: 8450 },
  { id: "u5", name: "Gustav Vermaas", email: "gustav@swifter.digital", role: "member", avatar: "GV", status: "invited", lastActive: "Pending", joinedAt: "Mar 24, 2026", agents: 0, apiCalls: 0 },
  { id: "u6", name: "Naledi Dlamini", email: "naledi@swifter.digital", role: "viewer", avatar: "ND", status: "active", lastActive: "2 hours ago", joinedAt: "Mar 15, 2026", agents: 3, apiCalls: 2100 },
  { id: "u7", name: "Raj Patel", email: "raj@partner-bank.co.za", role: "viewer", avatar: "RP", status: "active", lastActive: "Yesterday", joinedAt: "Mar 18, 2026", agents: 2, apiCalls: 890 },
  { id: "u8", name: "Sarah O'Brien", email: "sarah@partner-bank.co.za", role: "viewer", avatar: "SO", status: "suspended", lastActive: "5 days ago", joinedAt: "Mar 10, 2026", agents: 0, apiCalls: 340 },
];

interface ApiKey {
  id: string; name: string; prefix: string; created: string; lastUsed: string; status: "active" | "revoked"; permissions: string[];
}

const API_KEYS: ApiKey[] = [
  { id: "k1", name: "Production API Key", prefix: "sk-prod-****7a9f", created: "Mar 1, 2026", lastUsed: "Just now", status: "active", permissions: ["agents:execute", "data:read", "webhooks:manage"] },
  { id: "k2", name: "Staging API Key", prefix: "sk-stag-****3bc2", created: "Mar 5, 2026", lastUsed: "2 hours ago", status: "active", permissions: ["agents:execute", "data:read"] },
  { id: "k3", name: "CI/CD Pipeline Key", prefix: "sk-cicd-****8ef1", created: "Mar 10, 2026", lastUsed: "1 day ago", status: "active", permissions: ["deploy:manage", "config:write"] },
  { id: "k4", name: "Old Dev Key", prefix: "sk-dev-****2d4e", created: "Feb 15, 2026", lastUsed: "2 weeks ago", status: "revoked", permissions: ["agents:execute"] },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  owner: { bg: "bg-amber-500/15", text: "text-amber-400" },
  admin: { bg: "bg-violet-500/15", text: "text-violet-400" },
  member: { bg: "bg-electric-500/15", text: "text-electric-400" },
  viewer: { bg: "bg-slate-500/15", text: "text-slate-400" },
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  invited: { bg: "bg-electric-500/10", text: "text-electric-400", dot: "bg-electric-400 animate-pulse" },
  suspended: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
};

const avatarGradients = [
  "from-rose-500 to-pink-500", "from-violet-500 to-purple-500", "from-electric-500 to-cyan-500",
  "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-blue-500 to-indigo-500",
  "from-fuchsia-500 to-pink-500", "from-cyan-500 to-teal-500",
];

// ═══ Component ═══

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "api_keys" | "roles">("users");
  const [showInvite, setShowInvite] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary mt-1">Manage team members, roles, and API keys</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "users" && (
            <button onClick={() => setShowInvite(!showInvite)} className="btn-primary flex items-center gap-2 text-sm">
              <span className="text-lg leading-none">+</span> Invite User
            </button>
          )}
          {activeTab === "api_keys" && (
            <button onClick={() => setShowNewKey(!showNewKey)} className="btn-primary flex items-center gap-2 text-sm">
              <span className="text-lg leading-none">+</span> Generate Key
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Team Members", value: USERS.filter(u => u.status === "active").length, icon: "👥", gradient: "from-electric-500 to-cyan-500" },
          { label: "Pending Invites", value: USERS.filter(u => u.status === "invited").length, icon: "✉️", gradient: "from-amber-500 to-orange-500" },
          { label: "Active API Keys", value: API_KEYS.filter(k => k.status === "active").length, icon: "🔑", gradient: "from-violet-500 to-purple-500" },
          { label: "Total API Calls", value: "97.4K", icon: "📊", gradient: "from-emerald-500 to-teal-500" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-lg`}>{s.icon}</div>
              <div><div className="text-xl font-bold text-text-primary">{s.value}</div><div className="text-[10px] text-text-muted">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "users" as const, label: "Team Members" },
          { key: "api_keys" as const, label: "API Keys" },
          { key: "roles" as const, label: "Roles & Permissions" },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.key ? "border-electric-500 text-electric-400" : "border-transparent text-text-muted hover:text-text-secondary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invite a Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-text-secondary block mb-1.5">Email Address</label><input className="input-field text-sm" placeholder="user@company.com" /></div>
            <div><label className="text-xs font-medium text-text-secondary block mb-1.5">Role</label>
              <select className="input-field text-sm"><option>viewer</option><option>member</option><option>admin</option></select>
            </div>
            <div className="flex items-end gap-2">
              <button className="btn-primary px-5 py-2 text-sm">Send Invite</button>
              <button onClick={() => setShowInvite(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-navy-900/30">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">Last Active</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">Agents</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">API Calls</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((user, i) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-navy-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-xs font-bold`}>{user.avatar}</div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{user.name}</div>
                          <div className="text-[10px] text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${roleColors[user.role].bg} ${roleColors[user.role].text}`}>{user.role}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[user.status].bg} ${statusColors[user.status].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[user.status].dot}`} />{user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-muted">{user.lastActive}</td>
                    <td className="px-5 py-3.5 text-xs text-text-primary text-right font-medium">{user.agents}</td>
                    <td className="px-5 py-3.5 text-xs text-text-primary text-right font-mono">{user.apiCalls.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-[10px] text-electric-400 hover:text-electric-300 font-medium">Edit</button>
                        {user.role !== "owner" && <button className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Remove</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api_keys" && (
        <div className="space-y-4 animate-fade-in">
          {showNewKey && (
            <div className="glass-card p-6 animate-slide-up">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Generate New API Key</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-text-secondary block mb-1.5">Key Name</label><input className="input-field text-sm" placeholder="e.g. Production Key" /></div>
                <div><label className="text-xs font-medium text-text-secondary block mb-1.5">Permissions</label>
                  <select className="input-field text-sm"><option>Full Access</option><option>Read Only</option><option>Agent Execution Only</option><option>Custom</option></select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-primary px-5 py-2 text-sm">Generate Key</button>
                <button onClick={() => setShowNewKey(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {API_KEYS.map(key => (
            <div key={key.id} className={`glass-card p-5 ${key.status === "revoked" ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${key.status === "active" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>🔑</div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{key.name}</h3>
                    <code className="text-xs text-text-muted font-mono bg-navy-800 px-2 py-0.5 rounded">{key.prefix}</code>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${key.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>{key.status}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-text-muted mb-3">
                <span>Created: {key.created}</span><span>•</span><span>Last used: {key.lastUsed}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {key.permissions.map(p => (
                  <span key={p} className="text-[9px] px-2 py-0.5 rounded bg-electric-500/10 text-electric-400 font-mono">{p}</span>
                ))}
              </div>
              {key.status === "active" && (
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button className="text-[10px] text-electric-400 hover:text-electric-300 font-medium">Rotate</button>
                  <button className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Revoke</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Roles & Permissions Tab */}
      {activeTab === "roles" && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-navy-900/30">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider w-36">Permission</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-400">Owner</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-violet-400">Admin</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-electric-400">Member</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { perm: "View Dashboard", owner: true, admin: true, member: true, viewer: true },
                { perm: "Execute Agents", owner: true, admin: true, member: true, viewer: false },
                { perm: "Configure Agents", owner: true, admin: true, member: false, viewer: false },
                { perm: "Create Agents", owner: true, admin: true, member: false, viewer: false },
                { perm: "Delete Agents", owner: true, admin: false, member: false, viewer: false },
                { perm: "Manage Integrations", owner: true, admin: true, member: false, viewer: false },
                { perm: "View Logs", owner: true, admin: true, member: true, viewer: true },
                { perm: "Export Data", owner: true, admin: true, member: true, viewer: false },
                { perm: "Manage Users", owner: true, admin: true, member: false, viewer: false },
                { perm: "Manage API Keys", owner: true, admin: true, member: false, viewer: false },
                { perm: "Billing & Subscriptions", owner: true, admin: false, member: false, viewer: false },
                { perm: "Delete Organization", owner: true, admin: false, member: false, viewer: false },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-navy-800/20 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-text-secondary font-medium">{row.perm}</td>
                  {[row.owner, row.admin, row.member, row.viewer].map((val, j) => (
                    <td key={j} className="px-5 py-2.5 text-center">
                      <span className={`text-sm ${val ? "text-emerald-400" : "text-text-muted/20"}`}>{val ? "✓" : "—"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
