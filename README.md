<div align="center">
  <div style="background: rgba(14, 165, 233, 0.1); padding: 20px; border-radius: 24px; display: inline-block; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 3rem; color: #0ea5e9;">🤖 Code Review Crew</h1>
  </div>
  <h3>The Ultimate Agentic Swarm for Deep Codebase Analysis</h3>
  <p><b>Built for the Gemini API Hackathon</b></p>
</div>

---

## 🏆 Gemini API Hackathon Spotlight
This project was built from the ground up to showcase the immense power, speed, and tooling capabilities of the Gemini ecosystem. Here is how we leveraged it:

1. **The New Official SDK (`google-genai`):** We strictly utilized the brand new official Google GenAI Python SDK. We took full advantage of its typed schemas, streaming capabilities, and native asynchronous support to orchestrate our massive swarm.
2. **Gemini 2.5 Flash for Swarm Intelligence:** A true Multi-Agent Swarm requires calling the LLM dozens of times concurrently. We chose **Gemini 2.5 Flash** because its unprecedented speed and massive context window make parallel codebase analysis not just possible, but blisteringly fast and economical.
3. **Retrieval-Augmented Generation (RAG):** We heavily utilize RAG to inject deep repository context into our workflow, ensuring the swarm delivers hyper-accurate, project-specific insights rather than generic advice.
4. **Intelligent Auto-Fix Engine:** We built a two-step resilient patching engine that leverages Gemini 2.5 Flash as a fallback merge engine to perfectly weave fixes into your code before automatically pushing Pull Requests to GitHub.

---

## 🌟 What is Code Review Crew?
Code Review Crew is an intelligent, multi-agent code review platform that unleashes a **9-Agent Hierarchical Swarm** on your GitHub repositories. Rather than relying on a single AI prompt to superficially scan your code, we deploy specialized, highly-focused AI personas—ranging from a *Security Sentinel* to a *Performance Profiler*—to aggressively analyze every inch of your codebase in true parallel.

## 🎯 Who is it for?
- **Engineering Teams:** Looking to automate mundane PR reviews while maintaining high architectural and security standards.
- **Tech Leads / Staff Engineers:** Wanting an automated "second pair of eyes" to enforce custom team guidelines and clean architecture.
- **Solo Developers:** Needing specialized feedback on edge-case bugs, or vulnerability risks before pushing to production.

---

## 🚀 Swarm Architecture Diagram

```mermaid
graph TD
    User([👨‍💻 User]) --> |1. Selects Repo & Files| Frontend(🖥️ Next.js Frontend)
    
    subgraph GitHub Ecosystem
    Frontend --> |OAuth Authentication| GitHubAPI[("🐙 GitHub API")]
    Backend -.-> |Create Branch & Pull Request| GitHubAPI
    Backend --> |RAG Context Fetch| GitHubAPI
    end

    Frontend --> |2. Start Review| Backend(⚙️ FastAPI Backend)
    Backend -.-> |3. Server-Sent Events Stream| Frontend
    
    subgraph Swarm Orchestrator[🤖 Agentic Swarm]
        Advisor[Architecture Advisor]
        
        subgraph Parallel Workers
            Security[🛡️ Security]
            Bugs[🐛 Bugs]
            Perf[⚡ Performance]
            Docs[📝 Docs]
            Deps[📦 Dependencies]
            Test[🧪 Tests]
            Purist[✨ Purist]
        end
        
        Lead[Lead Reviewer]
        
        Advisor --> |Sets Global Context| Parallel Workers
        Parallel Workers --> |Raw Findings| Lead
    end
    
    Backend <--> Swarm Orchestrator
    
    subgraph Google Cloud & AI[✨ Google GenAI]
        Flash[⚡ Gemini 2.5 Flash]
        MergeEngine[🔧 Intelligent Fallback Patcher]
    end
    
    Parallel Workers <--> |Parallel Async Calls| Flash
    Lead <--> |Synthesize Findings| Flash
    
    Frontend --> |4. One-Click Apply Fix| FixEngine(🏗️ Auto-Fix Pipeline)
    FixEngine <--> MergeEngine
    FixEngine --> |Push Patch & PR| GitHubAPI
```

---

## 🧠 Core Concepts & Innovations

### 1. Hierarchical Agentic Swarms
Instead of a monolithic AI, we use a structured swarm:
- **The Architect (Synchronous):** Analyzes the global scope of the repository first to establish the big picture.
- **The Workers (Parallel):** 7 independent agents execute concurrently. Each agent is given a strict, narrow "focus area" (e.g., only looking for SQL injections) to prevent LLM hallucination and context-loss.
- **The Lead Reviewer (Synthesizer):** Runs last to aggregate, deduplicate, and finalize the reports into a single, cohesive JSON response.

### 2. Interactive 2D Architecture Graph
Rendering an entire enterprise repository can be overwhelming. We integrated `react-force-graph-2d` using the HTML5 Canvas API to render an interactive, physics-based repository dependency graph so developers can visualize their codebase instantly.

### 3. Real-time Server-Sent Events (SSE)
We built a custom SSE streaming pipeline from the Python FastAPI backend to the Next.js frontend. As soon as an individual agent finishes its analysis, the finding is instantly streamed and rendered on the UI, resulting in a blazing-fast, staggered UI reveal.

### 4. One-Click Pull Request Auto-Fixes
Identifying a bug is only half the battle. Our platform automatically generates unified Git diffs. If you agree with the finding, click "Apply Fix" and our backend intercept the diff, perfectly weaves it into the original file (using a deterministic patcher and Gemini fallback), creates a new branch, and instantly opens a Pull Request directly on your GitHub repository.

---

## 🛠️ Tech Stack & Architecture

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 15` (App Router) | Core React framework for building the UI and routing. |
| **Styling & UI** | `Tailwind CSS`, `lucide-react` | Utility-first styling and beautiful SVG icon sets. |
| **Visualization** | `react-force-graph-2d` | HTML5 Canvas-based 2D Physics Graph for architecture visualization. |
| **Authentication** | `NextAuth.js` | Managing secure GitHub OAuth login flows. |
| **Backend API** | `Python 3.12`, `FastAPI` | High-performance asynchronous backend server. |
| **AI Integration** | `google-genai` SDK | Official Gemini SDK to interact with `Gemini 2.5 Flash`. |
| **Concurrency** | `asyncio` | Python library to run the Swarm in true parallel. |
| **Data Streaming** | `Server-Sent Events (SSE)` | Streaming agent findings in real-time to the frontend. |
| **Deployment** | `Google Cloud Run` | Serverless container hosting for both Frontend and Backend. |
| **CI/CD** | `Google Cloud Build` | Continuous automated deployment from the GitHub repository. |

---

## 💻 Running Locally

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install uv
uv pip install -r pyproject.toml
```
Create a `.env` in the `backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key
```
Start the server:
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` in the `frontend` directory:
```env
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_random_secure_string
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Start the frontend:
```bash
npm run dev
```
