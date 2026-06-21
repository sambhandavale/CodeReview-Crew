import { CodeFinding, ChatMessage } from "./types";
import { CheckCircle2, FileCode, AlertTriangle, GitBranch, MessageCircle, X, Send } from "lucide-react";
import { useState } from "react";

interface ReviewResultsViewProps {
  reviewFindings: CodeFinding[];
  severityFilter: string;
  setSeverityFilter: (val: string) => void;
  reviewedFiles: { path: string; content: string }[];
  activeReviewFile: { path: string; content: string } | null;
  setActiveReviewFile: (file: { path: string; content: string }) => void;
  activeChatFinding: CodeFinding | null;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatting: boolean;
  startChat: (finding: CodeFinding) => void;
  closeChat: () => void;
  sendChatMessage: () => void;
  resetReview: () => void;
  repoName: string;
  githubToken: string;
}

export function ReviewResultsView({
  reviewFindings,
  severityFilter,
  setSeverityFilter,
  reviewedFiles,
  activeReviewFile,
  setActiveReviewFile,
  activeChatFinding,
  chatMessages,
  chatInput,
  setChatInput,
  isChatting,
  startChat,
  closeChat,
  sendChatMessage,
  resetReview,
  repoName,
  githubToken
}: ReviewResultsViewProps) {
  const [fixingFinding, setFixingFinding] = useState<CodeFinding | null>(null);
  const [fixStatus, setFixStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [fixMessage, setFixMessage] = useState("");
  const [prUrl, setPrUrl] = useState("");

  const handleApplyFix = async (finding: CodeFinding) => {
    setFixingFinding(finding);
    setFixStatus("loading");
    setFixMessage("Initializing auto-fix...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/apply-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken,
          file_path: finding.file,
          diff: finding.suggested_diff,
          title: finding.title
        })
      });
      const data = await res.json();
      if (data.success) {
        setFixStatus("success");
        setPrUrl(data.pr_url);
        setFixMessage("Pull Request created successfully!");
      } else {
        setFixStatus("error");
        setFixMessage(data.error || "Failed to create PR.");
      }
    } catch (e: any) {
      setFixStatus("error");
      setFixMessage(e.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Auto-fix Modal */}
      {fixingFinding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                GitHub Integration
              </h3>
              {fixStatus !== "loading" && (
                <button onClick={() => setFixingFinding(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center">
              {fixStatus === "loading" && (
                <>
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-slate-700">{fixMessage}</p>
                  <p className="text-xs text-slate-500 mt-2">Creating branch, applying diff, and opening Pull Request...</p>
                </>
              )}
              {fixStatus === "success" && (
                <>
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">{fixMessage}</p>
                  <a href={prUrl} target="_blank" rel="noreferrer" className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                    View Pull Request
                  </a>
                </>
              )}
              {fixStatus === "error" && (
                <>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Error Creating PR</p>
                  <p className="text-xs text-red-600 mt-3 bg-red-50 p-3 rounded border border-red-100 max-h-32 overflow-auto w-full font-mono text-left">{fixMessage}</p>
                  <button onClick={() => setFixingFinding(null)} className="mt-5 px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-200">
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
          onClick={resetReview}
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
              <div className="sticky top-0 z-10 bg-white border-b border-border flex items-center overflow-x-auto">
                {reviewedFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setActiveReviewFile(file)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeReviewFile.path === file.path
                        ? "border-primary text-foreground bg-slate-50"
                        : "border-transparent text-muted-foreground hover:bg-slate-50"
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${activeReviewFile.path === file.path ? "text-primary" : "text-muted-foreground"}`} />
                    {file.path.split('/').pop()}
                  </button>
                ))}
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
                                <p className="text-xs text-green-800 font-mono whitespace-pre-wrap">{finding.suggestion}</p>
                              </div>
                            )}
                            {finding.suggested_diff && (
                              <div className="mt-2 border border-slate-200 rounded-md overflow-hidden text-[11px] font-mono shadow-sm">
                                <div className="bg-slate-100 px-3 py-1.5 flex justify-between items-center border-b border-slate-200">
                                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1.5"><GitBranch className="w-3 h-3"/> Suggested Fix</span>
                                  <button 
                                    onClick={() => handleApplyFix(finding)}
                                    className="bg-primary hover:bg-primary/90 text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors shadow-sm"
                                  >
                                    Apply Fix
                                  </button>
                                </div>
                                <div className="bg-[#fafbfc] p-3 overflow-x-auto leading-relaxed">
                                  {finding.suggested_diff.split('\n').map((line, i) => (
                                    <div key={i} className={`whitespace-pre px-2 -mx-2 ${
                                      line.startsWith('+') ? 'text-green-700 bg-green-100/50' : 
                                      line.startsWith('-') ? 'text-red-700 bg-red-100/50' : 
                                      'text-slate-600'
                                    }`}>
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex justify-end">
                              <button 
                                onClick={() => startChat(finding)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat with {finding.agent.split(' ')[0]}
                              </button>
                            </div>
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

        {/* Right Sidebar (Findings or Chat) */}
        <div className="w-[320px] shrink-0 border-l border-border bg-white flex flex-col h-full">
          {!activeChatFinding ? (
            <>
              <div className="px-4 py-3 border-b border-border bg-slate-50/50">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">All Findings</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {reviewFindings
                  .filter(f => severityFilter === "all" || f.severity === severityFilter)
                  .map((finding) => (
                  <div
                    key={finding.id}
                    onClick={() => {
                      const file = reviewedFiles.find(f => f.path === finding.file);
                      if (file) setActiveReviewFile(file);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${activeReviewFile?.path === finding.file ? "border-slate-200 bg-slate-50" : "border-transparent hover:bg-slate-50"}`}
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
            </>
          ) : (
            <div className="flex flex-col h-full bg-slate-50/30">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeChatFinding.agentColor }}></span>
                  <p className="text-sm font-bold text-foreground">{activeChatFinding.agent}</p>
                </div>
                <button onClick={closeChat} className="p-1 hover:bg-slate-100 rounded-md text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Chat Context Snippet */}
              <div className="px-4 py-2 border-b border-border bg-slate-100/50 text-xs">
                <p className="font-semibold text-slate-700 truncate">{activeChatFinding.title}</p>
                <p className="text-slate-500 truncate mt-0.5">Line {activeChatFinding.line}</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex flex-col gap-1 items-start">
                  <div className="px-3 py-2 rounded-lg rounded-tl-none bg-white border border-slate-200 text-sm text-slate-700 shadow-sm">
                    Hi! I flagged this issue. How can I help you fix it?
                  </div>
                </div>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[90%] shadow-sm whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.content || (isChatting && i === chatMessages.length - 1 ? "Typing..." : "")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-border">
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask the agent..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isChatting}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
