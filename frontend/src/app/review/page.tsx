"use client";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Code2, Loader2, Play } from "lucide-react";
import { Network, Shield, Bot, Zap, CheckCircle2, BookOpen, GitBranch, TestTube2, Layers } from "lucide-react";

import { AgentStatus, CodeFinding, ChatMessage, TreeNode } from "@/components/review/types";
import { buildTree, getFilesUnderDir, shouldSkipFile } from "@/components/review/utils";
import { FileExplorer } from "@/components/review/FileExplorer";
import { SelectionView } from "@/components/review/SelectionView";
import { ReviewProgressView } from "@/components/review/ReviewProgressView";
import { ReviewResultsView } from "@/components/review/ReviewResultsView";

export function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const repoFullName = searchParams.get("repo");

  // If no repo provided, redirect to dashboard
  useEffect(() => {
    if (!repoFullName && status !== "loading") router.push("/dashboard");
  }, [repoFullName, status, router]);

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [reviewMode, setReviewMode] = useState<"selection" | "reviewing" | "done">("selection");
  
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: "lead", name: "Lead Reviewer", status: "idle", icon: <Network className="w-4 h-4" />, color: "#0ea5e9", findings: 0 },
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
  const [reviewedFiles, setReviewedFiles] = useState<{ path: string; content: string }[]>([]);
  const [activeReviewFile, setActiveReviewFile] = useState<{ path: string; content: string } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  // Chat States
  const [activeChatFinding, setActiveChatFinding] = useState<CodeFinding | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const startChat = (finding: CodeFinding) => {
    setActiveChatFinding(finding);
    setChatMessages([]);
    setChatInput("");
    setIsChatting(false);
  };

  const closeChat = () => {
    setActiveChatFinding(null);
    setChatMessages([]);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeChatFinding || isChatting) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }, { role: "model", content: "" }]);
    setIsChatting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: activeChatFinding.agent,
          code_snippet: reviewedFiles.find(f => f.path === activeChatFinding.file)?.content || activeReviewFile?.content || "",
          finding_title: activeChatFinding.title,
          finding_description: activeChatFinding.description,
          message: userMessage,
          history: chatMessages.filter(m => m.content) // send previous history
        })
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let modelResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        modelResponse += chunk;
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "[Error: Could not connect to agent]";
        return newMessages;
      });
    } finally {
      setIsChatting(false);
    }
  };

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
  }, []);

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

  // Start the real backend review
  const startReview = async () => {
    const selectedFilesList = Array.from(selectedPaths);
    
    // Hard limit 5 files
    if (selectedFilesList.length > 5) {
      alert("For optimal AI performance and to prevent token exhaustion, please select up to 5 files per review batch.");
      return;
    }

    setReviewMode("reviewing");
    setPreviewFile(null);
    setReviewFindings([]);

    // Mark all agents as running
    setAgents((prev) => prev.map((a) => ({ ...a, status: "running" })));

    if (!session?.accessToken) return;

    // 1. Fetch all selected file contents concurrently
    const fileContents: string[] = [];
    const fetchedFiles: { path: string; content: string }[] = [];

    await Promise.all(selectedFilesList.map(async (file) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${file}`, {
          headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/vnd.github.v3+json" }
        });
        const data = await res.json();
        if (data.content) {
          const decoded = atob(data.content.replace(/\n/g, ""));
          fetchedFiles.push({ path: file, content: decoded });
        }
      } catch (e) {
        console.error(`Failed to load file ${file}`, e);
      }
    }));

    if (fetchedFiles.length > 0) {
      setReviewedFiles(fetchedFiles);
      setActiveReviewFile(fetchedFiles[0]);
      fetchedFiles.forEach(f => fileContents.push(`// FILE: ${f.path}\n${f.content}`));
    }

    // Auto-fetch README for global context
    const readmeNode = tree.find((t) => t.type === "file" && t.name.toLowerCase() === "readme.md");
    let readmeContext = "";
    if (readmeNode) {
      try {
        const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${readmeNode.path}`, {
          headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/vnd.github.v3+json" }
        });
        const data = await res.json();
        if (data.content) {
          const decoded = atob(data.content.replace(/\n/g, ""));
          readmeContext = `\n\n<Repository Context>\nREADME.md:\n${decoded}\n</Repository Context>\n\n`;
        }
      } catch (e) {
        console.error("Failed to fetch README", e);
      }
    }

    // Combine code to send to backend
    const aggregatedCode = readmeContext + fileContents.join("\n\n");

    // 2. Call the Python SSE Backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: aggregatedCode,
          custom_instructions: customInstructions.trim() || null,
          github_token: session?.accessToken || null,
          repo_name: repoFullName
        })
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
                    file: f.file_path || (fetchedFiles.length > 0 ? fetchedFiles[0].path : "unknown"), // Map to file
                    line: f.line || 1,
                    severity: f.severity || "info",
                    agent: targetAgent.name,
                    agentColor: targetAgent.color,
                    title: f.title || "Issue found",
                    description: f.description || "",
                    suggestion: f.suggestion || "",
                    suggested_diff: f.suggested_diff || undefined
                  }));

                  setReviewFindings(prev => [...prev, ...mappedFindings]);

                  return prevAgents.map((a) =>
                    a.id === agent_id ? { ...a, status: "done", findings: findings.length } : a
                  );
                });
              } else if (event.type === "lead_done") {
                const { findings } = event.data;
                const mappedFindings: CodeFinding[] = findings.map((f: any, idx: number) => ({
                    id: `lead-${idx}-${Math.random().toString(36).substring(2, 9)}`,
                    file: f.file_path || (fetchedFiles.length > 0 ? fetchedFiles[0].path : "unknown"),
                    line: f.line || 1,
                    severity: f.severity || "info",
                    agent: "Lead Reviewer",
                    agentColor: "#0ea5e9",
                    title: f.title || "Synthesized Issue",
                    description: f.description || "",
                    suggestion: f.suggestion || "",
                    suggested_diff: f.suggested_diff || undefined
                }));
                setReviewFindings(mappedFindings);
                setAgents((prevAgents) => prevAgents.map((a) =>
                    a.id === "lead" ? { ...a, status: "done", findings: mappedFindings.length } : a
                ));
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

  const resetReview = () => {
    setReviewMode("selection");
    setAgents((prev) => prev.map((a) => ({ ...a, status: "idle" as const, findings: 0 })));
    setReviewFindings([]);
    setReviewedFiles([]);
    setActiveReviewFile(null);
  };

  if (!repoFullName) return null;

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
                <button onClick={selectAll} className="text-xs font-bold text-primary hover:underline">Select All</button>
                <span className="text-muted-foreground">|</span>
                <button onClick={selectNone} className="text-xs font-bold text-muted-foreground hover:underline">Clear</button>
              </div>
              <button
                onClick={startReview}
                disabled={selectedPaths.size === 0 || selectedPaths.size > 5}
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
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-6 pb-24">
        <div className="flex gap-6 items-start">
          <FileExplorer 
            tree={tree}
            totalFiles={totalFiles}
            selectedPaths={selectedPaths}
            expandedDirs={expandedDirs}
            reviewMode={reviewMode}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            toggleSelect={toggleSelect}
            toggleExpand={toggleExpand}
            onPreviewFile={handlePreviewFile}
            startReview={startReview}
          />

          <div className={`flex-1 relative ${reviewMode === "selection" && !previewFile ? "bg-transparent" : "bg-white rounded-xl border border-border shadow-sm min-h-[calc(100vh-180px)] overflow-hidden flex flex-col"}`}>
            {reviewMode === "selection" && (
              <SelectionView 
                tree={tree}
                agents={agents}
                isGraphModalOpen={isGraphModalOpen}
                setIsGraphModalOpen={setIsGraphModalOpen}
                previewFile={previewFile}
                setPreviewFile={setPreviewFile as any}
                loadingPreview={loadingPreview}
              />
            )}

            {reviewMode === "reviewing" && (
              <ReviewProgressView 
                agents={agents}
                selectedCount={selectedPaths.size}
              />
            )}

            {reviewMode === "done" && (
              <ReviewResultsView 
                reviewFindings={reviewFindings}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
                reviewedFiles={reviewedFiles}
                activeReviewFile={activeReviewFile}
                setActiveReviewFile={setActiveReviewFile}
                activeChatFinding={activeChatFinding}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isChatting={isChatting}
                startChat={startChat}
                closeChat={closeChat}
                sendChatMessage={sendChatMessage}
                resetReview={resetReview}
                repoName={repoFullName}
                githubToken={session?.accessToken || ""}
              />
            )}
          </div>
        </div>
      </div>
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
