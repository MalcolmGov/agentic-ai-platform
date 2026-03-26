"use client";

import { useCallback, useRef, useState, useMemo, DragEvent, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ═══════════════════════════════════════════════
// Node Type Definitions
// ═══════════════════════════════════════════════

interface StudioNodeData {
  label: string;
  type: string;
  icon: string;
  color: string;
  description: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

type StudioNode = Node<StudioNodeData>;

const NODE_TEMPLATES = [
  {
    type: "trigger",
    label: "Trigger",
    icon: "⚡",
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    description: "Start the agent flow",
    configs: ["Webhook", "Schedule (Cron)", "Manual", "Event-driven", "Real-time"],
  },
  {
    type: "llm",
    label: "LLM Call",
    icon: "🧠",
    color: "from-violet-500 to-purple-500",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    description: "AI reasoning step",
    configs: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "claude-3.5"],
  },
  {
    type: "tool",
    label: "Tool",
    icon: "🔧",
    color: "from-electric-500 to-cyan-500",
    border: "border-electric-500/30",
    bg: "bg-electric-500/10",
    description: "Execute an action",
    configs: ["API Call", "Database Query", "Send Email", "Slack Message", "File Upload"],
  },
  {
    type: "condition",
    label: "Condition",
    icon: "🔀",
    color: "from-teal-500 to-emerald-500",
    border: "border-teal-500/30",
    bg: "bg-teal-500/10",
    description: "Branch logic",
    configs: ["If/Else", "Switch", "Threshold", "Pattern Match", "Time-based"],
  },
  {
    type: "memory",
    label: "Memory",
    icon: "💾",
    color: "from-indigo-500 to-blue-500",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    description: "Store & retrieve context",
    configs: ["Save to Memory", "Recall Memory", "Search Vector DB", "Clear Context"],
  },
  {
    type: "output",
    label: "Output",
    icon: "📤",
    color: "from-emerald-500 to-green-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    description: "Return results",
    configs: ["JSON Response", "Report", "Alert", "Dashboard Update", "Email Report"],
  },
];

// ═══════════════════════════════════════════════
// Custom Node Components
// ═══════════════════════════════════════════════

function TriggerNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-amber-400" : ""}`}>
      <div className="studio-node-header bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.trigger && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 inline-block">
            {String(data.config.trigger)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="studio-handle !bg-amber-500" />
    </div>
  );
}

function LLMNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-violet-400" : ""}`}>
      <Handle type="target" position={Position.Top} className="studio-handle !bg-violet-500" />
      <div className="studio-node-header bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-b border-violet-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.model && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 inline-block">
            {String(data.config.model)}
          </div>
        )}
        {data.config?.prompt && (
          <p className="mt-1 text-[10px] text-text-secondary italic truncate max-w-[160px]">
            &quot;{String(data.config.prompt).slice(0, 40)}...&quot;
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="studio-handle !bg-violet-500" />
    </div>
  );
}

function ToolNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-electric-400" : ""}`}>
      <Handle type="target" position={Position.Top} className="studio-handle !bg-electric-500" />
      <div className="studio-node-header bg-gradient-to-r from-electric-500/20 to-cyan-500/20 border-b border-electric-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-electric-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.toolName && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-electric-500/10 text-electric-400 font-mono inline-block">
            {String(data.config.toolName)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="studio-handle !bg-electric-500" />
    </div>
  );
}

function ConditionNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-teal-400" : ""}`}>
      <Handle type="target" position={Position.Top} className="studio-handle !bg-teal-500" />
      <div className="studio-node-header bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border-b border-teal-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.condition && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono inline-block">
            {String(data.config.condition)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" className="studio-handle !bg-emerald-500 !left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="no" className="studio-handle !bg-rose-500 !left-[70%]" />
    </div>
  );
}

function MemoryNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-indigo-400" : ""}`}>
      <Handle type="target" position={Position.Top} className="studio-handle !bg-indigo-500" />
      <div className="studio-node-header bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-b border-indigo-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.operation && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 inline-block">
            {String(data.config.operation)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="studio-handle !bg-indigo-500" />
    </div>
  );
}

function OutputNode({ data, selected }: { data: StudioNodeData; selected?: boolean }) {
  return (
    <div className={`studio-node ${selected ? "ring-2 ring-emerald-400" : ""}`}>
      <Handle type="target" position={Position.Top} className="studio-handle !bg-emerald-500" />
      <div className="studio-node-header bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-b border-emerald-500/20">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{data.label}</span>
      </div>
      <div className="studio-node-body">
        <p className="text-[10px] text-text-muted">{data.description}</p>
        {data.config?.format && (
          <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 inline-block">
            {String(data.config.format)}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Preset Agent Templates
// ═══════════════════════════════════════════════

const PRESET_TEMPLATES = [
  {
    name: "Fraud Detection Agent",
    icon: "🛡️",
    description: "Real-time transaction monitoring with risk scoring",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 0 }, data: { label: "Trigger", type: "trigger", icon: "⚡", color: "", description: "Webhook: transaction.created", config: { trigger: "Webhook" } } },
      { id: "l1", type: "llm", position: { x: 250, y: 120 }, data: { label: "LLM Call", type: "llm", icon: "🧠", color: "", description: "Analyze transaction risk", config: { model: "gpt-4o", prompt: "Analyze this transaction for fraud indicators..." } } },
      { id: "c1", type: "condition", position: { x: 250, y: 260 }, data: { label: "Condition", type: "condition", icon: "🔀", color: "", description: "Risk > 0.7?", config: { condition: "riskScore > 0.7" } } },
      { id: "to1", type: "tool", position: { x: 80, y: 400 }, data: { label: "Tool", type: "tool", icon: "🔧", color: "", description: "Block transaction", config: { toolName: "block_transaction" } } },
      { id: "to2", type: "tool", position: { x: 420, y: 400 }, data: { label: "Tool", type: "tool", icon: "🔧", color: "", description: "Log & approve", config: { toolName: "approve_transaction" } } },
      { id: "o1", type: "output", position: { x: 250, y: 540 }, data: { label: "Output", type: "output", icon: "📤", color: "", description: "Alert compliance team", config: { format: "Alert" } } },
    ] as StudioNode[],
    edges: [
      { id: "e1", source: "t1", target: "l1", animated: true },
      { id: "e2", source: "l1", target: "c1", animated: true },
      { id: "e3", source: "c1", target: "to1", sourceHandle: "yes", label: "High Risk" },
      { id: "e4", source: "c1", target: "to2", sourceHandle: "no", label: "Low Risk" },
      { id: "e5", source: "to1", target: "o1" },
      { id: "e6", source: "to2", target: "o1" },
    ] as Edge[],
  },
  {
    name: "Customer Onboarding",
    icon: "👋",
    description: "Automated KYC, account setup, and welcome flow",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 0 }, data: { label: "Trigger", type: "trigger", icon: "⚡", color: "", description: "Webhook: customer.created", config: { trigger: "Webhook" } } },
      { id: "to1", type: "tool", position: { x: 250, y: 120 }, data: { label: "Tool", type: "tool", icon: "🔧", color: "", description: "Verify identity (KYC)", config: { toolName: "verify_identity" } } },
      { id: "l1", type: "llm", position: { x: 250, y: 260 }, data: { label: "LLM Call", type: "llm", icon: "🧠", color: "", description: "Assess risk profile", config: { model: "gpt-4o", prompt: "Based on the KYC results, assess the customer risk..." } } },
      { id: "m1", type: "memory", position: { x: 250, y: 400 }, data: { label: "Memory", type: "memory", icon: "💾", color: "", description: "Store customer profile", config: { operation: "Save to Memory" } } },
      { id: "o1", type: "output", position: { x: 250, y: 540 }, data: { label: "Output", type: "output", icon: "📤", color: "", description: "Send welcome email", config: { format: "Email Report" } } },
    ] as StudioNode[],
    edges: [
      { id: "e1", source: "t1", target: "to1", animated: true },
      { id: "e2", source: "to1", target: "l1", animated: true },
      { id: "e3", source: "l1", target: "m1", animated: true },
      { id: "e4", source: "m1", target: "o1", animated: true },
    ] as Edge[],
  },
  {
    name: "Daily Report Generator",
    icon: "📊",
    description: "Aggregate metrics and generate executive reports",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 0 }, data: { label: "Trigger", type: "trigger", icon: "⚡", color: "", description: "Schedule: Daily 8 AM", config: { trigger: "Schedule (Cron)" } } },
      { id: "to1", type: "tool", position: { x: 250, y: 120 }, data: { label: "Tool", type: "tool", icon: "🔧", color: "", description: "Query analytics DB", config: { toolName: "query_database" } } },
      { id: "l1", type: "llm", position: { x: 250, y: 260 }, data: { label: "LLM Call", type: "llm", icon: "🧠", color: "", description: "Generate insight summary", config: { model: "gpt-4o-mini", prompt: "Summarize the key metrics and trends..." } } },
      { id: "o1", type: "output", position: { x: 250, y: 400 }, data: { label: "Output", type: "output", icon: "📤", color: "", description: "Email PDF report", config: { format: "Email Report" } } },
    ] as StudioNode[],
    edges: [
      { id: "e1", source: "t1", target: "to1", animated: true },
      { id: "e2", source: "to1", target: "l1", animated: true },
      { id: "e3", source: "l1", target: "o1", animated: true },
    ] as Edge[],
  },
];

// ═══════════════════════════════════════════════
// Agent Studio Page
// ═══════════════════════════════════════════════

export default function AgentStudioPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<StudioNode | null>(null);
  const [agentName, setAgentName] = useState("Untitled Agent");
  const [showTemplates, setShowTemplates] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      llm: LLMNode,
      tool: ToolNode,
      condition: ConditionNode,
      memory: MemoryNode,
      output: OutputNode,
    }),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "rgba(99, 102, 241, 0.5)", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(99, 102, 241, 0.5)" },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/studionode");
      if (!type) return;

      const template = NODE_TEMPLATES.find((t) => t.type === type);
      if (!template) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 30,
      };

      const newNode: StudioNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: template.label,
          type: template.type,
          icon: template.icon,
          color: template.color,
          description: template.description,
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: StudioNode) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeConfig = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
            : n
        )
      );
      setSelectedNode((prev) =>
        prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, [key]: value } } } : null
      );
    },
    [selectedNode, setNodes]
  );

  const loadTemplate = useCallback(
    (template: (typeof PRESET_TEMPLATES)[0]) => {
      setNodes(template.nodes);
      setEdges(template.edges);
      setAgentName(template.name);
      setShowTemplates(false);
    },
    [setNodes, setEdges]
  );

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setAgentName("Untitled Agent");
  }, [setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus(null);

    // Build the agent config from the graph
    const agentConfig = {
      name: agentName,
      source: "studio",
      graph: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          label: typeof e.label === "string" ? e.label : undefined,
        })),
      },
    };

    // Simulate save (in production → POST /api/agents)
    await new Promise((r) => setTimeout(r, 1200));
    console.log("Agent config:", JSON.stringify(agentConfig, null, 2));

    setSaveStatus("Agent saved successfully!");
    setIsSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  }, [agentName, nodes, edges]);

  // Auto-hide templates when nodes exist
  useEffect(() => {
    if (nodes.length > 0) setShowTemplates(false);
  }, [nodes.length]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-navy-900/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h1 className="text-lg font-bold text-text-primary">Agent Studio</h1>
          </div>
          <div className="h-5 w-px bg-border" />
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="bg-transparent text-sm text-text-secondary font-medium border-none outline-none focus:text-text-primary transition-colors w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-emerald-400 animate-fade-in">{saveStatus}</span>
          )}
          <button
            onClick={() => { setShowTemplates(true); clearCanvas(); }}
            className="px-3 py-1.5 text-xs text-text-secondary border border-border rounded-lg hover:bg-white/5 transition-colors"
          >
            Templates
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 text-xs text-text-secondary border border-border rounded-lg hover:bg-white/5 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || nodes.length === 0}
            className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Deploy Agent →"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette (Left) */}
        <div className="w-52 border-r border-border bg-navy-950/50 p-3 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
            Drag to Canvas
          </div>
          {NODE_TEMPLATES.map((template) => (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/studionode", template.type);
                e.dataTransfer.effectAllowed = "move";
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing border ${template.border} ${template.bg} hover:scale-[1.02] transition-all duration-150 group`}
            >
              <span className="text-base">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary group-hover:text-white transition-colors">
                  {template.label}
                </div>
                <div className="text-[10px] text-text-muted truncate">{template.description}</div>
              </div>
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-border">
            <div className="text-[10px] text-text-muted px-1 leading-relaxed">
              <strong className="text-text-secondary">Tips:</strong>
              <br />• Drag nodes to canvas
              <br />• Connect handles to link
              <br />• Click node to configure
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {/* Template Overlay */}
          {showTemplates && nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm">
              <div className="max-w-2xl w-full px-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">Start Building Your Agent</h2>
                  <p className="text-sm text-text-secondary">
                    Choose a template to start quickly, or drag nodes from the palette to build from scratch.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {PRESET_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => loadTemplate(template)}
                      className="glass-card p-5 text-left group hover:border-electric-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="text-3xl mb-3">{template.icon}</div>
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-electric-400 transition-colors mb-1">
                        {template.name}
                      </h3>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{template.description}</p>
                      <div className="mt-3 text-[10px] text-electric-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Template →
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="mt-6 text-sm text-text-muted hover:text-text-primary transition-colors w-full text-center"
                >
                  or start with an empty canvas →
                </button>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "rgba(99, 102, 241, 0.4)", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(99, 102, 241, 0.5)" },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
            <Controls
              className="!bg-navy-800 !border-border !rounded-xl !shadow-xl"
              showInteractive={false}
            />
            <MiniMap
              className="!bg-navy-900 !border-border !rounded-xl"
              nodeColor="#3b82f6"
              maskColor="rgba(0, 0, 0, 0.6)"
            />
            <Panel position="bottom-center">
              <div className="bg-navy-800/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 text-[11px] text-text-muted flex items-center gap-4">
                <span>{nodes.length} nodes</span>
                <span className="text-border">•</span>
                <span>{edges.length} connections</span>
                {selectedNode && (
                  <>
                    <span className="text-border">•</span>
                    <span className="text-electric-400">Selected: {selectedNode.data.label}</span>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Config Panel (Right) */}
        {selectedNode && (
          <div className="w-72 border-l border-border bg-navy-950/50 p-4 overflow-y-auto shrink-0 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedNode.data.icon}</span>
                <h3 className="text-sm font-bold text-text-primary">{selectedNode.data.label}</h3>
              </div>
              <button
                onClick={deleteNode}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs"
                title="Delete node"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-text-secondary mb-4">{selectedNode.data.description}</p>

            {/* Node-specific config */}
            <div className="space-y-3">
              {selectedNode.type === "trigger" && (
                <>
                  <ConfigField label="Trigger Type">
                    <select
                      value={String(selectedNode.data.config?.trigger || "")}
                      onChange={(e) => updateNodeConfig("trigger", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select trigger...</option>
                      {NODE_TEMPLATES[0].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="Description">
                    <input
                      type="text"
                      value={String(selectedNode.data.config?.desc || "")}
                      onChange={(e) => updateNodeConfig("desc", e.target.value)}
                      placeholder="e.g. On new transaction..."
                      className="studio-input"
                    />
                  </ConfigField>
                </>
              )}

              {selectedNode.type === "llm" && (
                <>
                  <ConfigField label="Model">
                    <select
                      value={String(selectedNode.data.config?.model || "")}
                      onChange={(e) => updateNodeConfig("model", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select model...</option>
                      {NODE_TEMPLATES[1].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="System Prompt">
                    <textarea
                      value={String(selectedNode.data.config?.prompt || "")}
                      onChange={(e) => updateNodeConfig("prompt", e.target.value)}
                      placeholder="You are a specialized AI agent..."
                      rows={4}
                      className="studio-input resize-none"
                    />
                  </ConfigField>
                  <ConfigField label="Temperature">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={Number(selectedNode.data.config?.temperature || 0.7)}
                      onChange={(e) => updateNodeConfig("temperature", parseFloat(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="text-[10px] text-text-muted text-right mt-0.5">
                      {Number(selectedNode.data.config?.temperature || 0.7).toFixed(1)}
                    </div>
                  </ConfigField>
                </>
              )}

              {selectedNode.type === "tool" && (
                <>
                  <ConfigField label="Tool">
                    <select
                      value={String(selectedNode.data.config?.toolName || "")}
                      onChange={(e) => updateNodeConfig("toolName", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select tool...</option>
                      {NODE_TEMPLATES[2].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="Parameters (JSON)">
                    <textarea
                      value={String(selectedNode.data.config?.params || "{}")}
                      onChange={(e) => updateNodeConfig("params", e.target.value)}
                      rows={3}
                      className="studio-input resize-none font-mono text-[11px]"
                    />
                  </ConfigField>
                </>
              )}

              {selectedNode.type === "condition" && (
                <>
                  <ConfigField label="Condition Type">
                    <select
                      value={String(selectedNode.data.config?.conditionType || "")}
                      onChange={(e) => updateNodeConfig("conditionType", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select type...</option>
                      {NODE_TEMPLATES[3].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="Expression">
                    <input
                      type="text"
                      value={String(selectedNode.data.config?.condition || "")}
                      onChange={(e) => updateNodeConfig("condition", e.target.value)}
                      placeholder="e.g. riskScore > 0.7"
                      className="studio-input font-mono"
                    />
                  </ConfigField>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-text-muted">True path</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-text-muted">False path</span>
                    </div>
                  </div>
                </>
              )}

              {selectedNode.type === "memory" && (
                <>
                  <ConfigField label="Operation">
                    <select
                      value={String(selectedNode.data.config?.operation || "")}
                      onChange={(e) => updateNodeConfig("operation", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select operation...</option>
                      {NODE_TEMPLATES[4].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="Key / Query">
                    <input
                      type="text"
                      value={String(selectedNode.data.config?.key || "")}
                      onChange={(e) => updateNodeConfig("key", e.target.value)}
                      placeholder="e.g. customer_profile"
                      className="studio-input font-mono"
                    />
                  </ConfigField>
                </>
              )}

              {selectedNode.type === "output" && (
                <>
                  <ConfigField label="Output Format">
                    <select
                      value={String(selectedNode.data.config?.format || "")}
                      onChange={(e) => updateNodeConfig("format", e.target.value)}
                      className="studio-input"
                    >
                      <option value="">Select format...</option>
                      {NODE_TEMPLATES[5].configs.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </ConfigField>
                  <ConfigField label="Destination">
                    <input
                      type="text"
                      value={String(selectedNode.data.config?.destination || "")}
                      onChange={(e) => updateNodeConfig("destination", e.target.value)}
                      placeholder="e.g. compliance@acme.com"
                      className="studio-input"
                    />
                  </ConfigField>
                </>
              )}

              {/* Node ID (readonly) */}
              <div className="pt-3 border-t border-border">
                <div className="text-[10px] text-text-muted font-mono">ID: {selectedNode.id}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Config Field Helper
// ═══════════════════════════════════════════════

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
