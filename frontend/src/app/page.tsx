"use client";

import { useState } from "react";
import { Bot, Code2, Play, Sparkles } from "lucide-react";

export default function Home() {
  const [code, setCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSummon = () => {
    setIsAnalyzing(true);
    // TODO: implement API call and SSE stream
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 relative overflow-hidden w-full">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <main className="z-10 flex w-full max-w-4xl flex-col items-center gap-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-sm text-gray-300 font-medium mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Powered by Gemini 3.5 Flash</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Code Review <span className="text-primary">Crew</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Summon an elite swarm of AI agents to analyze your code for bugs, security flaws, performance issues, and style—all in real-time.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full space-y-6">
          <div className="glass-panel overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50 shadow-2xl">
            <div className="flex items-center px-4 py-3 bg-[#0d1117]/80 border-b border-border gap-2">
              <Code2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300 font-mono">workspace.ts</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your code here..."
              className="w-full h-80 bg-[#0d1117]/50 p-6 text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder:text-gray-600"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSummon}
              disabled={!code.trim() || isAnalyzing}
              className={`group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 
                ${code.trim() && !isAnalyzing ? 'bg-primary hover:bg-primary-hover text-white shadow-[0_0_40px_rgba(88,101,242,0.4)] hover:shadow-[0_0_60px_rgba(88,101,242,0.6)] hover:-translate-y-1' : 'bg-card text-gray-500 cursor-not-allowed border border-border'}
              `}
            >
              {isAnalyzing ? (
                <>
                  <Bot className="w-6 h-6 animate-pulse" />
                  Agents Deploying...
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 group-hover:text-white transition-colors" />
                  Summon the Crew
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
