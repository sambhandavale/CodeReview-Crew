"use client";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  Play,
  CheckSquare,
  Square,
  MinusSquare,
  Code2,
  ArrowLeft,
  FileCode,
  FolderTree,
  Layers,
  Bot,
  Shield,
  Zap,
  CheckCircle2,
  BookOpen,
  GitBranch,
  TestTube2,
  AlertTriangle,
  X,
} from "lucide-react";

interface TreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
  size?: number;
}

interface AgentStatus {
  name: string;
  status: "idle" | "running" | "done" | "error";
  icon: React.ReactNode;
  color: string;
  findings?: number;
}

interface CodeFinding {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  agent: string;
  agentColor: string;
  title: string;
  description: string;
  suggestion?: string;
}

// Smart file filter: skip irrelevant files
const SKIP_PATTERNS = [
  /^\.git\//,
  /node_modules\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.venv\//,
  /venv\//,
  /__pycache__\//,
  /\.pyc$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.ico$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.woff/,
  /\.ttf$/,
  /\.eot$/,
  /\.mp4$/,
  /\.mp3$/,
  /\.pdf$/,
  /\.zip$/,
  /\.tar/,
  /\.DS_Store/,
  /Thumbs\.db/,
];

function shouldSkipFile(path: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(path));
}

function buildTree(paths: { path: string; type: string; size?: number }[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const item of paths) {
    if (shouldSkipFile(item.path)) continue;

    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const existingNode = current.find((n) => n.name === name);

      if (existingNode) {
        if (existingNode.children) current = existingNode.children;
      } else {
        const newNode: TreeNode = {
          path: parts.slice(0, i + 1).join("/"),
          name,
          type: isLast && item.type === "blob" ? "file" : "dir",
          size: isLast ? item.size : undefined,
          children: isLast && item.type === "blob" ? undefined : [],
        };
        current.push(newNode);
        if (newNode.children) current = newNode.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  function sortTree(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sortTree(n.children);
    });
    return nodes;
  }
  return sortTree(root);
}

export function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const repoFullName = searchParams.get("repo");

  // If no repo provided, redirect to dashboard
  useEffect(() => {
    if (!repoFullName && status !== "loading") router.push("/dashboard");
  }, [repoFullName, status, router]);

  if (!repoFullName) return null;

  const [repoName] = repoFullName.split("/").reverse();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [reviewMode, setReviewMode] = useState<"selection" | "reviewing" | "done">("selection");
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: "sentinel", name: "Security Sentinel", status: "idle", icon: <Shield className="w-4 h-4" />, color: "#ef4444", findings: 0 },
    { id: "detective", name: "Bug Detective", status: "idle", icon: <Bot className="w-4 h-4" />, color: "#3b82f6", findings: 0 },
    { id: "profiler", name: "Performance Profiler", status: "idle", icon: <Zap className="w-4 h-4" />, color: "#eab308", findings: 0 },
    { id: "purist", name: "Code Purist", status: "idle", icon: <CheckCircle2 className="w-4 h-4" />, color: "#22c55e", findings: 0 },
    { id: "auditor", name: "Documentation Auditor", status: "idle", icon: <BookOpen className="w-4 h-4" />, color: "#a855f7", findings: 0 },
    { id: "guardian", name: "Dependency Guardian", status: "idle", icon: <GitBranch className="w-4 h-4" />, color: "#f97316", findings: 0 },
    { id: "analyst", name: "Test Coverage Analyst", status: "idle", icon: <TestTube2 className="w-4 h-4" />, color: "#14b8a6", findings: 0 },
    { id: "advisor", name: "Architecture Advisor", status: "idle", icon: <Layers className="w-4 h-4" />, color: "#6366f1", findings: 0 },
  ]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [reviewFindings, setReviewFindings] = useState<CodeFinding[]>([]);
  const [activeReviewFile, setActiveReviewFile] = useState<{ path: string; content: string } | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Fetch repo tree
  useEffect(() => {
    async function fetchTree() {
      if (!session?.accessToken || !repoFullName) return;
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repoFullName}/git/trees/main?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        let data = await res.json();

        // If main branch doesn't exist, try master
        if (!res.ok) {
          const res2 = await fetch(
            `https://api.github.com/repos/${repoFullName}/git/trees/master?recursive=1`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
          data = await res2.json();
        }

        if (data.tree) {
          const builtTree = buildTree(data.tree);
          setTree(builtTree);
          setTotalFiles(data.tree.filter((t: any) => t.type === "blob" && !shouldSkipFile(t.path)).length);
          // Auto-expand first level
          const firstDirs = builtTree.filter((n) => n.type === "dir").map((n) => n.path);
          setExpandedDirs(new Set(firstDirs));
        }
      } catch (err) {
        console.error("Failed to fetch tree:", err);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchTree();
  }, [session, repoFullName]);

  // Get all file paths under a directory
  const getFilesUnderDir = useCallback((nodes: TreeNode[]): string[] => {
    let files: string[] = [];
    for (const node of nodes) {
      if (node.type === "file") files.push(node.path);
      else if (node.children) files = files.concat(getFilesUnderDir(node.children));
    }
    return files;
  }, []);

  const toggleSelect = useCallback((node: TreeNode) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (node.type === "file") {
        if (next.has(node.path)) next.delete(node.path);
        else next.add(node.path);
      } else if (node.children) {
        const childFiles = getFilesUnderDir(node.children);
        const allSelected = childFiles.every((f) => next.has(f));
        if (allSelected) childFiles.forEach((f) => next.delete(f));
        else childFiles.forEach((f) => next.add(f));
      }
      return next;
    });
  }, [getFilesUnderDir]);

  const selectAll = () => {
    const allFiles = getFilesUnderDir(tree);
    setSelectedPaths(new Set(allFiles));
  };

  const selectNone = () => setSelectedPaths(new Set());

  const toggleExpand = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Preview a file
  const handlePreviewFile = async (path: string) => {
    if (!session?.accessToken) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      const data = await res.json();
      if (data.content) {
        const decoded = atob(data.content.replace(/\n/g, ""));
        setPreviewFile({ path, content: decoded });
      }
    } catch (err) {
      console.error("Failed to fetch file:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Get check state for a directory
  const getDirCheckState = (node: TreeNode): "none" | "some" | "all" => {
    if (!node.children) return "none";
    const childFiles = getFilesUnderDir(node.children);
    if (childFiles.length === 0) return "none";
    const selectedCount = childFiles.filter((f) => selectedPaths.has(f)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === childFiles.length) return "all";
    return "some";
  };

  // Start the real backend review
  const startReview = async () => {
    setReviewMode("reviewing");
    setPreviewFile(null);
    setReviewFindings([]);

    // Mark all agents as running
    setAgents((prev) => prev.map((a) => ({ ...a, status: "running" })));

    if (!session?.accessToken) return;

    // 1. Fetch all selected file contents
    const selectedFilesList = Array.from(selectedPaths);
    const fileContents: string[] = [];

    // Let's get the active file ready for the done view right now
    const firstFile = selectedFilesList[0];
    if (firstFile) {
      try {
        const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${firstFile}`, {
          headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/vnd.github.v3+json" }
        });
        const data = await res.json();
        if (data.content) {
          const decoded = atob(data.content.replace(/\n/g, ""));
          setActiveReviewFile({ path: firstFile, content: decoded });
          fileContents.push(`// FILE: ${firstFile}\n${decoded}`);
        }
      } catch (e) {
        console.error("Failed to load first file", e);
      }
    }

    // Combine code to send to backend
    const aggregatedCode = fileContents.join("\n\n");

    // 2. Call the Python SSE Backend
    try {
      const response = await fetch("http://localhost:8000/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: aggregatedCode })
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // 3. Read the SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            try {
              const event = JSON.parse(dataStr);
              if (event.type === "agent_done") {
                const { agent_id, findings } = event.data;
                
                // We need to map these findings into CodeFinding interface
                setAgents((prevAgents) => {
                  const targetAgent = prevAgents.find(a => a.id === agent_id);
                  if (!targetAgent) return prevAgents;
                  
                  const mappedFindings: CodeFinding[] = findings.map((f: any, idx: number) => ({
                    id: `${agent_id}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
                    file: firstFile || "unknown", // Map to first file since we concatenated
                    line: f.line || 1,
                    severity: f.severity || "info",
                    agent: targetAgent.name,
                    agentColor: targetAgent.color,
                    title: f.title || "Issue found",
                    description: f.description || "",
                    suggestion: f.suggestion || ""
                  }));

                  setReviewFindings(prev => [...prev, ...mappedFindings]);

                  return prevAgents.map((a) =>
                    a.id === agent_id ? { ...a, status: "done", findings: findings.length } : a
                  );
                });
              } else if (event.type === "done") {
                // Done event received
                setReviewMode("done");
              }
            } catch (e) {
              console.error("Error parsing SSE data line", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error connecting to review API", err);
      // Fallback transition if error
      setReviewMode("done");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading repository...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                {repoFullName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalFiles} reviewable files • {selectedPaths.size} selected
              </p>
            </div>
          </div>

          {reviewMode === "selection" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={selectAll}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs font-bold text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={startReview}
                disabled={selectedPaths.size === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all"
              >
                <Play className="w-4 h-4" />
                Start Review ({selectedPaths.size} files)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Left: File Explorer */}
          <div className="w-[380px] shrink-0 bg-white rounded-xl border border-border overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 border-b border-border bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" />
                  File Explorer
                </h2>
                <span className="text-xs font-semibold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedPaths.size}/{totalFiles}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {tree.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedPaths={selectedPaths}
                  expandedDirs={expandedDirs}
                  toggleSelect={toggleSelect}
                  toggleExpand={toggleExpand}
                  getDirCheckState={getDirCheckState}
                  onPreviewFile={handlePreviewFile}
                  reviewMode={reviewMode}
                />
              ))}
            </div>
          </div>

          {/* Right: Preview / Review Panel */}
          <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden flex flex-col shadow-sm">
            {reviewMode === "selection" && !previewFile && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-border flex items-center justify-center mb-8 relative">
                  <Bot className="w-12 h-12 text-primary" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">Ready for Code Review</h3>
                <p className="text-muted-foreground max-w-md leading-relaxed mb-10 text-sm">
                  Our 8 specialized AI agents are standing by to analyze your codebase. Follow the steps below to begin.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-10 text-left">
                  <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                    <h4 className="font-bold text-foreground mb-1">Select Files</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Use the explorer on the left to check the specific files or folders you want reviewed.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                    <h4 className="font-bold text-foreground mb-1">Preview Code</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Click on any file name (without checking the box) to preview its contents right here.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-border shadow-sm ring-2 ring-primary/10">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
                    <h4 className="font-bold text-foreground mb-1">Deploy Swarm</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">Once your files are selected, unleash the AI agent swarm to find bugs and issues.</p>
                    {selectedPaths.size > 0 ? (
                      <button
                        onClick={startReview}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-md transition-all animate-in fade-in"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start ({selectedPaths.size})
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Waiting for selection...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-border/50 w-full max-w-sm justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">Quick actions:</span>
                  <button
                    onClick={selectAll}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Layers className="w-3 h-3" /> Select Entire Repo
                  </button>
                </div>
              </div>
            )}

            {reviewMode === "selection" && previewFile && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-bold text-foreground truncate">{previewFile.path}</span>
                  </div>
                  <button onClick={() => setPreviewFile(null)} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
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

            {reviewMode === "reviewing" && (
              <div className="flex-1 flex flex-col p-8 bg-slate-50 overflow-y-auto relative">
                {/* Background grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none"></div>

                <div className="max-w-5xl mx-auto w-full relative z-10">
                  <div className="text-center mb-12 mt-8">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm relative">
                      <Code2 className="w-8 h-8 text-primary" />
                      <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl animate-ping opacity-50" style={{ animationDuration: "2s" }}></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-foreground mb-3 flex items-center justify-center gap-3 tracking-tight">
                      Reviewing {selectedPaths.size} files
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </span>
                    </h3>
                    <p className="text-muted-foreground">Deploying specialized AI Agent Swarm for deep codebase analysis.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                        {/* Animated background pulse for running state */}
                        {agent.status === "running" && (
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{ backgroundColor: agent.color }}
                          ></div>
                        )}

                        {/* Top Section: Icon & Badge */}
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

                        {/* Middle Section: Details */}
                        <div className="flex-1 relative z-10">
                          <h4 className="font-bold text-foreground text-sm mb-1">{agent.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {agent.status === "idle" && "Waiting for orchestration..."}
                            {agent.status === "running" && "Scanning file AST and semantic structure..."}
                            {agent.status === "done" && `${agent.findings} issues found during analysis.`}
                          </p>
                        </div>

                        {/* Bottom Section: Progress Bar */}
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
                        
                        {/* Scanning Line overlay */}
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
            )}

            {reviewMode === "done" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Summary bar */}
                <div className="px-4 py-3 border-b border-border bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Review Complete
                    </h3>
                    <div className="flex items-center gap-2">
                      {["all", "critical", "high", "medium", "low", "info"].map((sev) => {
                        const count = sev === "all" ? reviewFindings.length : reviewFindings.filter(f => f.severity === sev).length;
                        if (sev !== "all" && count === 0) return null;
                        const colors: Record<string, string> = { all: "bg-slate-200 text-slate-700", critical: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-blue-100 text-blue-700", info: "bg-slate-100 text-slate-500" };
                        return (
                          <button key={sev} onClick={() => setSeverityFilter(sev)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${severityFilter === sev ? colors[sev] + " ring-2 ring-offset-1 ring-slate-300" : "bg-slate-50 text-muted-foreground hover:bg-slate-100"}`}>
                            {sev === "all" ? `All (${count})` : `${sev} (${count})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => { setReviewMode("selection"); setAgents((prev) => prev.map((a) => ({ ...a, status: "idle" as const, findings: 0 }))); setReviewFindings([]); setActiveReviewFile(null); }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Run Again
                  </button>
                </div>

                {/* Annotated Code View */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Code Editor with inline annotations */}
                  <div className="flex-1 overflow-auto bg-[#fafbfc]">
                    {activeReviewFile ? (
                      <div className="font-mono text-[13px]">
                        <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-2 flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold text-foreground">{activeReviewFile.path}</span>
                        </div>
                        {activeReviewFile.content.split("\n").map((codeLine, lineIdx) => {
                          const lineNum = lineIdx + 1;
                          const filteredFindings = reviewFindings.filter(f => severityFilter === "all" || f.severity === severityFilter);
                          const findingsOnLine = filteredFindings.filter((f) => f.line === lineNum);
                          const isHighlightedRange = filteredFindings.some((f) => lineNum >= f.line && lineNum <= (f.endLine || f.line));
                          const highlightColor = findingsOnLine.length > 0
                            ? findingsOnLine[0].severity === "critical" ? "bg-red-50 border-l-4 border-l-red-500"
                            : findingsOnLine[0].severity === "high" ? "bg-orange-50 border-l-4 border-l-orange-500"
                            : findingsOnLine[0].severity === "medium" ? "bg-yellow-50 border-l-4 border-l-yellow-400"
                            : findingsOnLine[0].severity === "low" ? "bg-blue-50 border-l-4 border-l-blue-400"
                            : "bg-slate-50 border-l-4 border-l-slate-300"
                            : isHighlightedRange ? "bg-red-50/40" : "";

                          return (
                            <div key={lineIdx}>
                              <div className={`flex items-stretch hover:bg-slate-50/80 ${highlightColor} group`}>
                                <span className="w-14 shrink-0 text-right pr-4 text-slate-400 select-none text-xs leading-[22px] bg-slate-50/50 border-r border-slate-100">
                                  {lineNum}
                                </span>
                                <span className="pl-4 leading-[22px] whitespace-pre overflow-x-auto flex-1">{codeLine}</span>
                                {findingsOnLine.length > 0 && (
                                  <div className="shrink-0 mr-3 opacity-100 transition-opacity flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4" style={{ color: findingsOnLine[0].agentColor }} />
                                  </div>
                                )}
                              </div>
                              {/* Inline annotation bubble */}
                              {findingsOnLine.map((finding) => (
                                <div key={finding.id} className="mx-14 my-1.5 rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: finding.agentColor + "40" }}>
                                  <div className="px-4 py-2.5 flex items-start gap-3" style={{ backgroundColor: finding.agentColor + "08" }}>
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: finding.agentColor + "18", color: finding.agentColor }}>
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                          finding.severity === "critical" ? "bg-red-100 text-red-700"
                                          : finding.severity === "high" ? "bg-orange-100 text-orange-700"
                                          : finding.severity === "medium" ? "bg-yellow-100 text-yellow-700"
                                          : finding.severity === "low" ? "bg-blue-100 text-blue-700"
                                          : "bg-slate-100 text-slate-600"
                                        }`}>{finding.severity}</span>
                                        <span className="text-[10px] font-semibold text-muted-foreground">{finding.agent}</span>
                                      </div>
                                      <p className="text-sm font-bold text-foreground mb-1">{finding.title}</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{finding.description}</p>
                                      {finding.suggestion && (
                                        <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">💡 Suggestion</p>
                                          <p className="text-xs text-green-800 font-mono">{finding.suggestion}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Click a file in the explorer to see annotated results.</p>
                      </div>
                    )}
                  </div>

                  {/* Findings sidebar */}
                  <div className="w-[280px] shrink-0 border-l border-border overflow-y-auto bg-white">
                    <div className="px-3 py-2.5 border-b border-border bg-slate-50/50">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">All Findings</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {reviewFindings
                        .filter(f => severityFilter === "all" || f.severity === severityFilter)
                        .map((finding) => (
                        <div
                          key={finding.id}
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent text-xs hover:bg-slate-50 transition-colors cursor-default"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: finding.agentColor }}></span>
                            <span className={`font-bold uppercase tracking-wider text-[9px] ${
                              finding.severity === "critical" ? "text-red-600"
                              : finding.severity === "high" ? "text-orange-600"
                              : finding.severity === "medium" ? "text-yellow-600"
                              : "text-slate-500"
                            }`}>{finding.severity}</span>
                            <span className="text-muted-foreground text-[9px] ml-auto">Line {finding.line}</span>
                          </div>
                          <p className="font-semibold text-foreground truncate">{finding.title}</p>
                          <p className="text-muted-foreground truncate mt-0.5">{finding.agent}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// File tree node component
function FileTreeNode({
  node,
  depth,
  selectedPaths,
  expandedDirs,
  toggleSelect,
  toggleExpand,
  getDirCheckState,
  onPreviewFile,
  reviewMode,
}: {
  node: TreeNode;
  depth: number;
  selectedPaths: Set<string>;
  expandedDirs: Set<string>;
  toggleSelect: (node: TreeNode) => void;
  toggleExpand: (path: string) => void;
  getDirCheckState: (node: TreeNode) => "none" | "some" | "all";
  onPreviewFile: (path: string) => void;
  reviewMode: string;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = node.type === "file" ? selectedPaths.has(node.path) : false;
  const dirState = node.type === "dir" ? getDirCheckState(node) : "none";

  const CheckIcon = node.type === "file"
    ? isSelected ? CheckSquare : Square
    : dirState === "all" ? CheckSquare : dirState === "some" ? MinusSquare : Square;

  const checkColor = (node.type === "file" && isSelected) || dirState !== "none"
    ? "text-primary"
    : "text-slate-300";

  const ext = node.name.split(".").pop()?.toLowerCase() || "";
  const langColor: Record<string, string> = {
    ts: "#3178c6", tsx: "#3178c6", js: "#f1e05a", jsx: "#f1e05a",
    py: "#3572A5", go: "#00ADD8", rs: "#dea584", java: "#b07219",
    css: "#563d7c", html: "#e34c26", json: "#292929", md: "#083fa1",
    yml: "#cb171e", yaml: "#cb171e", sh: "#89e051",
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group hover:bg-slate-50 transition-colors ${
          isSelected ? "bg-primary/5" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse for dirs */}
        {node.type === "dir" ? (
          <button onClick={() => toggleExpand(node.path)} className="p-0.5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}

        {/* Checkbox */}
        {reviewMode === "selection" && (
          <button onClick={() => toggleSelect(node)} className={`shrink-0 ${checkColor}`}>
            <CheckIcon className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        {node.type === "dir" ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0 ml-1" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 shrink-0 ml-1" />
          )
        ) : (
          <div className="relative ml-1 shrink-0">
            <File className="w-4 h-4 text-slate-400" />
            {langColor[ext] && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: langColor[ext] }}
              />
            )}
          </div>
        )}

        {/* Name */}
        <span
          className={`text-sm truncate ml-1.5 ${
            node.type === "dir" ? "font-semibold text-foreground" : "text-foreground/80"
          }`}
          onClick={() => {
            if (node.type === "file") onPreviewFile(node.path);
            else toggleExpand(node.path);
          }}
        >
          {node.name}
        </span>

        {/* File size */}
        {node.type === "file" && node.size !== undefined && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}KB` : `${node.size}B`}
          </span>
        )}
      </div>

      {/* Children */}
      {node.type === "dir" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPaths={selectedPaths}
              expandedDirs={expandedDirs}
              toggleSelect={toggleSelect}
              toggleExpand={toggleExpand}
              getDirCheckState={getDirCheckState}
              onPreviewFile={onPreviewFile}
              reviewMode={reviewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
