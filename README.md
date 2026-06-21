<div align="center">
  <div style="background: rgba(14, 165, 233, 0.1); padding: 20px; border-radius: 24px; display: inline-block; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 3rem; color: #0ea5e9;">🤖 Code Review Crew</h1>
  </div>
  <h3>The Ultimate AI Agent Swarm for Deep Codebase Analysis</h3>
  <p>Powered by Gemini 3.5 Flash & Next.js</p>
</div>

---

## 🌟 What is Code Review Crew?
Code Review Crew is an intelligent, multi-agent code review platform that unleashes a **9-Agent Hierarchical Swarm** on your GitHub repositories. Rather than relying on a single AI to superficially scan your code, we deploy specialized personas—ranging from a *Security Sentinel* to a *Performance Profiler*—to aggressively analyze every inch of your codebase in parallel.

## 🎯 Who is it for?
- **Engineering Teams:** Looking to automate mundane PR reviews while maintaining high architectural and security standards.
- **Tech Leads / Staff Engineers:** Wanting an automated "second pair of eyes" to enforce custom team guidelines and coding conventions.
- **Solo Developers:** Needing specialized feedback on performance bottlenecks, edge-case bugs, or vulnerability risks before pushing to production.

## 💡 Why is it required?
1. **The Context Problem:** Standard LLMs lose focus when asked to review thousands of lines of code. By using a *Swarm Architecture*, each agent only focuses on one specific domain (e.g. only looking for SQL injections, or only looking for Big-O inefficiencies).
2. **The "Fix It For Me" Gap:** Identifying a bug is only half the battle. Our agents automatically generate unified Git diffs so you can fix issues with a single click.
3. **The Interrogation Problem:** Ever disagree with an AI's review? We built a real-time chat interface that lets you argue, interrogate, or ask for clarification directly from the specific agent that flagged the line of code.

## 🚀 How Does It Do It? (The Architecture)

### 1. Context Gathering (GitHub RAG)
The backend authenticates with the GitHub API and pulls down your selected files, along with global repository context (like your `README.md`).

### 2. The Hierarchical Swarm Execution
We built a highly resilient, asynchronous orchestrator in Python using `asyncio`:
- **Step 1:** The `Architecture Advisor` runs synchronously first to map out the high-level system design.
- **Step 2:** **7 Worker Agents** execute in true parallel. Each agent receives the exact same codebase, but uses a highly specialized system prompt to isolate issues in their domain:
  - 🛡️ Security Sentinel
  - 🐛 Bug Detective
  - ⚡ Performance Profiler
  - 📝 Documentation Auditor
  - 📦 Dependency Guardian
  - 🧪 Test Coverage Analyst
  - ✨ Code Purist
- **Step 3:** The `Lead Reviewer` runs last, synthesizing all the reports, deduplicating repetitive issues, and streaming the final unified JSON back to the frontend via Server-Sent Events (SSE).

### 3. Graceful Rate-Limiting
To survive the brutal constraints of free-tier AI APIs, the backend utilizes an `asyncio.Semaphore` combined with exponential backoff. If Gemini throws a `429` (Rate Limit) or `503` (Overloaded), the specific agent gracefully sleeps and retries without crashing the rest of the swarm.

---

## ✨ Key Features

- **Interactive Architecture Graph:** Visualize your entire GitHub repository as a physics-based interactive node graph before you begin reviewing.
- **Custom Team Guidelines:** Enforce specific rules (e.g. "Do not use Classes, use functional programming only").
- **Live Swarm Visualization:** Watch the agents light up in real-time as they scan your code AST.
- **Inline Unified Diffs:** Agents don't just complain—they write the fix. View syntax-highlighted git diffs right next to the broken code.
- **Context-Aware Chat:** Click "Chat" on any finding to open a persistent websocket connection with the specific agent (e.g. Security Sentinel) who flagged it. The chat is pre-loaded with the exact lines of code and context of the finding.

## 🛠️ Tech Stack
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend:** Python, FastAPI, asyncio, Server-Sent Events (SSE)
- **AI / LLM:** Google Gemini 3.5 Flash SDK (`google-genai`)
- **Authentication:** NextAuth.js (GitHub OAuth)
- **Deployment:** Google Cloud Run (Docker)

---

## 💻 Running Locally

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install uv
uv pip install -r pyproject.toml
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env.local` in the `frontend` directory:
```env
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_string
```

Create a `.env` in the `backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key
```
