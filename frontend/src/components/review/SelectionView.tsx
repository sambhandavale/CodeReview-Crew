import { TreeNode, AgentStatus } from "./types";
import { CheckSquare, Network, Maximize2, Layers, X, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const RepoGraph = dynamic(() => import("@/components/RepoGraph"), { ssr: false });

interface SelectionViewProps {
  tree: TreeNode[];
  agents: AgentStatus[];
  isGraphModalOpen: boolean;
  setIsGraphModalOpen: (open: boolean) => void;
  previewFile: { path: string; content: string } | null;
  setPreviewFile: (file: null) => void;
  loadingPreview: boolean;
}

export function SelectionView({
  tree,
  agents,
  isGraphModalOpen,
  setIsGraphModalOpen,
  previewFile,
  setPreviewFile,
  loadingPreview,
}: SelectionViewProps) {
  return (
    <>
      {!previewFile ? (
        <div className="block pb-12">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome to Code Review Crew</h2>
              <p className="text-sm text-muted-foreground font-medium">Select files and configure your AI swarm.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 min-h-[280px] bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" /> Quick Start Guide
              </h3>
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                  <h4 className="font-bold text-sm text-slate-800 mb-1">Select Files</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Check the specific files in the left explorer you want reviewed.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                  <h4 className="font-bold text-sm text-slate-800 mb-1">Preview Code</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Click any file name (without checking) to quickly preview it.</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex flex-col justify-center ring-1 ring-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
                  <h4 className="font-bold text-sm text-primary mb-1">Deploy Swarm</h4>
                  <p className="text-xs text-primary/80 leading-relaxed">Hit Start Review to unleash the 8-agent swarm on your code.</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setIsGraphModalOpen(true)}
              className="lg:col-span-1 min-h-[280px] bg-white rounded-3xl border border-border shadow-sm overflow-hidden relative cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all hover:shadow-md flex flex-col"
            >
              <div className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none duration-500">
                {tree.length > 0 && <RepoGraph tree={tree} />}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col justify-end p-6 pointer-events-none z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Network className="w-5 h-5 text-primary" /> Architecture</h3>
                    <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Click to expand</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-md flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <h3 className="font-bold text-white mb-6 flex items-center gap-2 z-10"><Layers className="w-5 h-5 text-primary" /> The AI Agent Swarm</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 z-10">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${agent.color}20`, color: agent.color }}>
                      {agent.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{agent.name}</h4>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Standing by</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{previewFile.path}</span>
            </div>
            <button onClick={() => setPreviewFile(null)} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {loadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <pre className="p-4 text-sm font-mono text-foreground whitespace-pre overflow-x-auto leading-relaxed">
                {previewFile.content.split("\n").map((line, i) => (
                  <div key={i} className="flex hover:bg-slate-50">
                    <span className="w-12 shrink-0 text-right pr-4 text-muted-foreground/50 select-none text-xs leading-6">{i + 1}</span>
                    <span className="leading-6">{line}</span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      )}

      {isGraphModalOpen && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col">
          <div className="px-6 py-4 border-b border-border bg-white/50 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                Repository Architecture
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Interactive Physics Graph</p>
            </div>
            <button
              onClick={() => setIsGraphModalOpen(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full bg-slate-50/50">
            {tree.length > 0 && <RepoGraph tree={tree} />}
          </div>
        </div>
      )}
    </>
  );
}
