import { AgentStatus } from "./types";
import { Code2 } from "lucide-react";

interface ReviewProgressViewProps {
  agents: AgentStatus[];
  selectedCount: number;
}

export function ReviewProgressView({ agents, selectedCount }: ReviewProgressViewProps) {
  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50 overflow-y-auto relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-12 mt-8">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm relative">
            <Code2 className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl animate-ping opacity-50" style={{ animationDuration: "2s" }}></div>
          </div>
          <h3 className="text-3xl font-extrabold text-foreground mb-3 flex items-center justify-center gap-3 tracking-tight">
            Reviewing {selectedCount} files
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
          </h3>
          <p className="text-muted-foreground">Deploying specialized AI Agent Swarm for deep codebase analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border p-5 relative overflow-hidden transition-all duration-500 flex flex-col ${
                agent.status === "running"
                  ? "shadow-lg scale-[1.02]"
                  : agent.status === "done"
                  ? "shadow-sm border-green-200"
                  : "shadow-sm border-slate-200 opacity-70"
              }`}
              style={{
                borderColor: agent.status === "running" ? agent.color + "50" : undefined,
              }}
            >
              {agent.status === "running" && (
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{ backgroundColor: agent.color }}
                ></div>
              )}

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    agent.status === "running" ? "shadow-md" : ""
                  }`}
                  style={{ 
                    backgroundColor: agent.status === "idle" ? "#f1f5f9" : agent.status === "done" ? "#dcfce7" : agent.color + "15",
                    color: agent.status === "idle" ? "#94a3b8" : agent.status === "done" ? "#16a34a" : agent.color
                  }}
                >
                  {agent.icon}
                </div>
                <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                  agent.status === "idle" ? "bg-slate-100 text-slate-500" :
                  agent.status === "running" ? "bg-white border border-slate-200 shadow-sm" :
                  "bg-green-100 text-green-700"
                }`}
                style={{ color: agent.status === "running" ? agent.color : undefined }}
                >
                  {agent.status === "idle" ? "STANDBY" : agent.status === "running" ? "ANALYZING" : "COMPLETE"}
                </div>
              </div>

              <div className="flex-1 relative z-10">
                <h4 className="font-bold text-foreground text-sm mb-1">{agent.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {agent.status === "idle" && "Waiting for orchestration..."}
                  {agent.status === "running" && "Scanning file AST and semantic structure..."}
                  {agent.status === "done" && `${agent.findings} issues found during analysis.`}
                </p>
              </div>

              <div className="mt-4 relative z-10">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  {agent.status === "running" && (
                    <div 
                      className="h-full rounded-full animate-pulse"
                      style={{ width: '60%', backgroundColor: agent.color, transition: 'width 2s ease-in-out' }}
                    ></div>
                  )}
                  {agent.status === "done" && (
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
              
              {agent.status === "running" && (
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-30 animate-pulse z-0"
                  style={{ 
                    left: '0%', 
                    color: agent.color,
                    animation: 'scan 2s linear infinite'
                  }}
                >
                  <style>{`
                    @keyframes scan {
                      0% { transform: translateX(-10px); }
                      100% { transform: translateX(300px); }
                    }
                  `}</style>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
