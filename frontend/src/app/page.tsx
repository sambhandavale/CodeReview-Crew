"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Shield, Zap, Bot, ArrowRight, CheckCircle2, ChevronDown, Code2, FileSearch, GitBranch, BookOpen, TestTube2, Layers } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {status === "loading" ? (
          <div className="flex justify-center mt-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <LandingPage />
        )}
      </main>

      <Footer />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-semibold text-primary mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Powered by Google Gemini 3.5 Flash
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-8">
          Ship Better Code with <br className="hidden md:block"/>
          <span className="text-primary">AI-Powered Swarms</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
          From bug detection to auto-fixing with live Git Diffs. Automate your entire code review process with a hierarchical, RAG-enabled team of autonomous agents.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="px-8 py-4 rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary-hover shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all">
            Get Started for Free <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-8 py-4 rounded-lg border-2 border-border font-bold text-lg hover:bg-muted text-foreground transition-all">
            View Demo
          </button>
        </div>
      </section>

      {/* Swarm Animation Section */}
      <SwarmVisualization />

      {/* Social Proof */}
      <section className="py-12 bg-muted border-y border-border">
        <p className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">Trusted by forward-thinking engineering teams</p>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
           <span className="text-2xl font-black">Google</span>
           <span className="text-2xl font-black">Meta</span>
           <span className="text-2xl font-black">Stripe</span>
           <span className="text-2xl font-black">Netflix</span>
           <span className="text-2xl font-black">Vercel</span>
        </div>
      </section>

      {/* How it works - The Workflow */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">How The Swarm Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Traditional code review takes days. Our multi-agent architecture uses concurrent AI processing to deliver comprehensive feedback in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-8xl font-black text-slate-100/50">1</div>
            <h3 className="text-2xl font-bold mb-4 relative z-10">Connect & Select</h3>
            <p className="text-muted-foreground relative z-10 leading-relaxed">Link your GitHub account and select the exact repository and files you want to review. No more copying and pasting messy code snippets manually.</p>
          </div>
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-8xl font-black text-slate-100/50">2</div>
            <h3 className="text-2xl font-bold mb-4 relative z-10">Concurrent Analysis</h3>
            <p className="text-muted-foreground relative z-10 leading-relaxed">Powered by Gemini 3.5 Flash, our Orchestrator dispatches eight highly specialized worker agents. They analyze your code in parallel across security, bugs, performance, style, docs, dependencies, testing, and architecture.</p>
          </div>
          <div className="glass-panel p-8 relative overflow-hidden border-t-4 border-t-primary">
            <div className="absolute top-0 right-0 p-4 text-8xl font-black text-slate-100/50">3</div>
            <h3 className="text-2xl font-bold mb-4 relative z-10">Lead Synthesis & Auto-Fix</h3>
            <p className="text-muted-foreground relative z-10 leading-relaxed">The Lead Reviewer Agent collects findings from all 8 workers, removes duplicates, and generates a unified report card complete with one-click Git Diff auto-fixes.</p>
          </div>
        </div>
      </section>

      {/* Meet the Agents Section */}
      <section className="py-24 px-6 bg-muted border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Meet the Code Review Crew</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We don&apos;t use a single generic AI prompt. We deploy a swarm of nine distinct, specialized AI personas — each an expert in its domain — to ensure nothing slips through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Security */}
            <div className="glass-panel p-8 border-t-4 border-t-red-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                <Shield className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Security Sentinel</h3>
              <p className="text-xs font-bold text-red-500 mb-3 uppercase tracking-widest">Vulnerabilities & OWASP</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Scans for SQL injections, XSS, exposed secrets, insecure deserialization, and OWASP Top 10 risks before they hit production.</p>
            </div>
            {/* Bug Hunter */}
            <div className="glass-panel p-8 border-t-4 border-t-blue-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                <Bot className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Bug Detective</h3>
              <p className="text-xs font-bold text-blue-500 mb-3 uppercase tracking-widest">Logic & Edge Cases</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Traces execution flow to catch null pointer exceptions, race conditions, unhandled promises, and off-by-one errors.</p>
            </div>
            {/* Performance */}
            <div className="glass-panel p-8 border-t-4 border-t-yellow-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-yellow-100 transition-colors">
                <Zap className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Performance Profiler</h3>
              <p className="text-xs font-bold text-yellow-500 mb-3 uppercase tracking-widest">Big O & Memory</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Hunts down O(n²) loops, memory leaks, N+1 queries, unnecessary re-renders, and suggests optimal data structures.</p>
            </div>
            {/* Code Quality */}
            <div className="glass-panel p-8 border-t-4 border-t-green-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Code Purist</h3>
              <p className="text-xs font-bold text-green-500 mb-3 uppercase tracking-widest">Style & SOLID</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Enforces coding standards, meaningful naming, DRY/SOLID principles, and ensures long-term readability and maintainability.</p>
            </div>
            {/* Documentation */}
            <div className="glass-panel p-8 border-t-4 border-t-purple-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
                <BookOpen className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Documentation Auditor</h3>
              <p className="text-xs font-bold text-purple-500 mb-3 uppercase tracking-widest">Docs & Comments</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Flags missing JSDoc, outdated README sections, undocumented public APIs, and enforces inline comment quality standards.</p>
            </div>
            {/* Dependency */}
            <div className="glass-panel p-8 border-t-4 border-t-orange-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                <GitBranch className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Dependency Guardian</h3>
              <p className="text-xs font-bold text-orange-500 mb-3 uppercase tracking-widest">Supply Chain & CVEs</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Audits package.json, requirements.txt, and lock files for outdated packages, known CVEs, and license compliance issues.</p>
            </div>
            {/* Testing */}
            <div className="glass-panel p-8 border-t-4 border-t-teal-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-100 transition-colors">
                <TestTube2 className="w-7 h-7 text-teal-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Test Coverage Analyst</h3>
              <p className="text-xs font-bold text-teal-500 mb-3 uppercase tracking-widest">Testing & Coverage</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Identifies untested code paths, suggests missing unit/integration tests, and validates edge-case coverage across critical modules.</p>
            </div>
            {/* Architecture */}
            <div className="glass-panel p-8 border-t-4 border-t-indigo-500 hover:-translate-y-1 transition-transform cursor-default group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <Layers className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">Architecture Advisor</h3>
              <p className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-widest">Design Patterns</p>
              <p className="text-muted-foreground text-sm leading-relaxed">Evaluates coupling, cohesion, separation of concerns, circular dependencies, and recommends scalable design patterns.</p>
            </div>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <div className="glass-panel p-10 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-200 text-center shadow-lg relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-100 rounded-full opacity-30"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-100 rounded-full opacity-30"></div>
              <h3 className="text-3xl font-extrabold mb-4 relative z-10">👑 The Lead Orchestrator</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10">
                The master planner. Dispatches tasks to all 8 specialist agents, collects their raw findings, deduplicates conflicting advice, assigns severity grades, and synthesizes a single, pristine Markdown report card.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ArchitectureDiagram />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <section className="py-24 bg-primary text-white text-center px-6">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-8">Build a Faster, Smarter Codebase Today.</h2>
        <button className="px-10 py-5 rounded-lg bg-white text-primary font-bold text-xl hover:bg-gray-100 shadow-xl flex items-center gap-2 mx-auto transition-all hover:-translate-y-1">
          Connect Your GitHub <ArrowRight className="w-6 h-6" />
        </button>
      </section>
    </div>
  );
}

function SwarmVisualization() {
  const agents = [
    { name: "Security", icon: <Shield className="w-5 h-5" />, color: "rgb(239,68,68)", angle: 0 },
    { name: "Bugs", icon: <Bot className="w-5 h-5" />, color: "rgb(59,130,246)", angle: 45 },
    { name: "Performance", icon: <Zap className="w-5 h-5" />, color: "rgb(234,179,8)", angle: 90 },
    { name: "Style", icon: <CheckCircle2 className="w-5 h-5" />, color: "rgb(34,197,94)", angle: 135 },
    { name: "Docs", icon: <BookOpen className="w-5 h-5" />, color: "rgb(168,85,247)", angle: 180 },
    { name: "Dependencies", icon: <GitBranch className="w-5 h-5" />, color: "rgb(249,115,22)", angle: 225 },
    { name: "Testing", icon: <TestTube2 className="w-5 h-5" />, color: "rgb(20,184,166)", angle: 270 },
    { name: "Architecture", icon: <Layers className="w-5 h-5" />, color: "rgb(99,102,241)", angle: 315 },
  ];

  const radius = 200; // px from center
  const cx = 300;
  const cy = 260;

  return (
    <section className="px-6 pb-24 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-border shadow-2xl bg-gradient-to-b from-slate-50 to-white p-8 md:p-12 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Live Architecture Visualization
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            9 Agents Active
          </div>
        </div>

        <div className="flex justify-center">
          <svg width="600" height="520" viewBox="0 0 600 520" className="w-full max-w-[600px]">
            {/* Orbit ring */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6,4" />
            <circle cx={cx} cy={cy} r={radius - 40} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,6" opacity="0.6" />

            {/* Connection lines + animated packets for each agent */}
            {agents.map((agent, i) => {
              const rad = (agent.angle * Math.PI) / 180;
              const ax = cx + radius * Math.cos(rad);
              const ay = cy + radius * Math.sin(rad);
              return (
                <g key={i}>
                  <line x1={ax} y1={ay} x2={cx} y2={cy} stroke={agent.color} strokeWidth="1.5" opacity="0.15" />
                  <circle r="4" fill={agent.color} opacity="0.9">
                    <animateMotion
                      dur={`${1.8 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${ax},${ay} L${cx},${cy}`}
                    />
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                  <circle r="8" fill={agent.color} opacity="0.15">
                    <animateMotion
                      dur={`${1.8 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${ax},${ay} L${cx},${cy}`}
                    />
                    <animate attributeName="opacity" values="0;0.3;0.3;0" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

            {/* Center orchestrator glow */}
            <circle cx={cx} cy={cy} r="55" fill="rgba(37,99,235,0.05)" />
            <circle cx={cx} cy={cy} r="45" fill="rgba(37,99,235,0.08)" />
            <circle cx={cx} cy={cy} r="35" fill="white" stroke="#2563eb" strokeWidth="3" />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize="22">🧠</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">Orchestrator</text>

            {/* Agent nodes around the circle */}
            {agents.map((agent, i) => {
              const rad = (agent.angle * Math.PI) / 180;
              const ax = cx + radius * Math.cos(rad);
              const ay = cy + radius * Math.sin(rad);
              return (
                <g key={`node-${i}`}>
                  <circle cx={ax} cy={ay} r="28" fill="white" stroke={agent.color} strokeWidth="2.5" className="drop-shadow-md" />
                  <foreignObject x={ax - 10} y={ay - 14} width="20" height="20">
                    <div style={{ color: agent.color }} className="flex items-center justify-center w-full h-full">
                      {agent.icon}
                    </div>
                  </foreignObject>
                  <text x={ax} y={ay + 18} textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">{agent.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs font-semibold text-muted-foreground">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }}></span>
              {agent.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureDiagram() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto border-y border-border bg-[#fafbfc]">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">System Architecture</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A powerful hierarchical pipeline with global codebase context.
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-6 font-mono text-sm">
        {/* User Input */}
        <div className="bg-white border-2 border-slate-300 p-4 rounded-xl shadow-sm w-72 text-center font-bold">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Step 1</div>
          User Selects Repo & Files
        </div>
        
        <div className="w-0.5 h-8 bg-slate-300"></div>
        
        {/* Context & Planning */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center">
          <div className="bg-indigo-50 border-2 border-indigo-200 p-5 rounded-xl shadow-sm text-center flex-1">
             <div className="text-xs text-indigo-600 font-bold mb-2 uppercase tracking-widest">1. Architecture Advisor</div>
             <p className="text-indigo-900 leading-relaxed text-xs font-sans">Runs first to analyze structural patterns and sets the architectural context for all other agents.</p>
          </div>
          <div className="bg-slate-800 text-white border-2 border-slate-700 p-5 rounded-xl shadow-sm text-center flex-1 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:10px_10px]"></div>
             <div className="text-xs text-slate-300 font-bold mb-2 uppercase tracking-widest relative z-10">2. Tool Retrieval (RAG)</div>
             <p className="text-slate-200 leading-relaxed text-xs font-sans relative z-10">Agents use GitHub API tools to search the entire codebase and read files on-demand for global context.</p>
          </div>
        </div>

        <div className="w-0.5 h-8 bg-slate-300"></div>

        {/* Worker Swarm */}
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl shadow-sm w-full max-w-4xl text-center">
          <div className="text-xs text-blue-600 font-bold mb-5 uppercase tracking-widest">3. Parallel Execution Swarm (Gemini 3.5 Flash)</div>
          <div className="flex flex-wrap justify-center gap-3">
             {["Security", "Bugs", "Performance", "Style", "Docs", "Dependencies", "Testing"].map(agent => (
                <div key={agent} className="bg-white px-4 py-2 border border-blue-100 rounded-lg shadow-sm font-semibold text-slate-700">
                  {agent}
                </div>
             ))}
          </div>
        </div>

        <div className="w-0.5 h-8 bg-slate-300"></div>

        {/* Lead Reviewer */}
        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-xl shadow-sm w-full max-w-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-teal-400"></div>
          <div className="text-xs text-emerald-700 font-bold mb-2 uppercase tracking-widest">4. Lead Reviewer</div>
          <p className="text-emerald-900 mb-4 font-sans text-sm font-semibold">Deduplicates, Resolves Conflicts, and Generates Git Diffs</p>
          <div className="bg-slate-900 px-4 py-3 border border-emerald-900/50 rounded-lg font-mono text-xs text-left overflow-x-auto shadow-inner">
             <div className="text-red-400">- const result = processData(data);</div>
             <div className="text-green-400">+ const result = useMemo(() =&gt; processData(data), [data]);</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "How does the multi-agent swarm actually work?",
      a: "When you submit a repository, our Lead Orchestrator analyzes the file structure and dispatches eight specialized Gemini 3.5 Flash agents in parallel. Each agent has a distinct system prompt laser-focused on one domain (security, bugs, performance, style, docs, dependencies, testing, architecture). Results are collected, deduplicated, and synthesized into a single graded report."
    },
    {
      q: "Why 8 agents instead of one?",
      a: "A single LLM prompt suffers from attention dilution — it can't be an expert in everything simultaneously. By splitting responsibilities across 8 specialized agents, each one goes deeper into its domain than a generalist ever could, and they all run concurrently so you get results faster."
    },
    {
      q: "Does this replace my CI/CD pipeline?",
      a: "No. Code Review Crew is designed to augment your existing CI/CD tools (like SonarQube, ESLint, or Snyk) by providing intelligent, context-aware, human-like feedback before you even open a pull request. Think of it as a senior engineer reviewing your code before CI even runs."
    },
    {
      q: "Is my source code secure?",
      a: "Absolutely. We only request read access to repositories you explicitly select. Your code is processed entirely in memory via Google Cloud infrastructure, is never stored on disk, and is never used to train any models."
    },
    {
      q: "Which programming languages are supported?",
      a: "Because we leverage the deep reasoning capabilities of Gemini 3.5 Flash, the swarm natively understands 40+ programming languages including Python, TypeScript, Go, Rust, Java, C++, Ruby, PHP, Swift, and Kotlin."
    },
    {
      q: "Can I review an entire repository at once?",
      a: "Yes! Our smart file scanner automatically identifies important files (source code, configs, tests) while skipping irrelevant ones (node_modules, build artifacts, binary files). For large repos, you can also manually select specific files or folders to focus the review."
    },
    {
      q: "How is the final report structured?",
      a: "The Lead Orchestrator produces a Markdown report card with an overall letter grade (A+ to F), individual category scores, a prioritized list of findings sorted by severity (Critical → Info), and actionable fix suggestions with code snippets."
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-muted-foreground">Everything you need to know about the architecture and privacy.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
            <button 
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full px-6 py-6 text-left flex items-center justify-between font-bold text-xl hover:bg-slate-50 transition-colors"
            >
              {faq.q}
              <ChevronDown className={`w-6 h-6 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === i && (
              <div className="px-6 pb-6 text-muted-foreground text-lg leading-relaxed border-t border-border pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}



function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-border pt-20 pb-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-lg tracking-tight text-foreground">CodeReview<span className="text-primary">Crew</span></span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            An elite swarm of autonomous AI agents designed to automate your entire code review process. Built for the modern developer.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
          <ul className="space-y-4 text-sm text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Resources</h4>
          <ul className="space-y-4 text-sm text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Community Blog</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Open Source</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Legal</h4>
          <ul className="space-y-4 text-sm text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground font-medium">
        <p>© 2026 Code Review Crew. Built for the Gemini Hackathon.</p>
        <div className="flex items-center gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="#" className="hover:text-foreground transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
