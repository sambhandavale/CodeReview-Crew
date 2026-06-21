<div align="center">
  <div style="background: rgba(14, 165, 233, 0.1); padding: 20px; border-radius: 24px; display: inline-block; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 3rem; color: #0ea5e9;">🤖 Code Review Crew</h1>
  </div>
  <h3>The Ultimate AI Agent Swarm for Deep Codebase Analysis</h3>
  <p><b>Built for the Gemini API Hackathon</b></p>
</div>

---

## 🏆 Gemini API Hackathon Spotlight
This project was built from the ground up to showcase the immense power, speed, and tooling capabilities of the Gemini ecosystem. Here is how we leveraged it:

1. **The New Official SDK (`google-genai`):** We strictly utilized the brand new official Google GenAI Python SDK (`google-genai`). We took full advantage of its typed schemas, streaming capabilities, and native asynchronous support to orchestrate our massive swarm.
2. **Gemini 2.5 Flash for Swarm Intelligence:** A true Multi-Agent Swarm requires calling the LLM dozens of times concurrently. We chose **Gemini 2.5 Flash** because its unprecedented speed and massive context window make parallel codebase analysis not just possible, but blisteringly fast and economical.
3. **Native Function Calling (Tools):** We didn't just pass code in a prompt. We equipped the Gemini models with dynamic `Tools` (such as `search_codebase` and `read_file`), allowing the agents to natively trigger GitHub API RAG searches if they lacked context about an imported function.
4. **Google Cloud Platform (GCP) Deployment:** The entire project is natively deployed on Google Cloud. The backend and frontend are containerized and hosted on **Google Cloud Run** using serverless architecture, with **Cloud Build** driving our continuous deployment pipeline.

---

## 🌟 What is Code Review Crew?
Code Review Crew is an intelligent, multi-agent code review platform that unleashes a **9-Agent Hierarchical Swarm** on your GitHub repositories. Rather than relying on a single AI prompt to superficially scan your code, we deploy specialized, highly-focused AI personas—ranging from a *Security Sentinel* to a *Performance Profiler*—to aggressively analyze every inch of your codebase in true parallel.

## 🎯 Who is it for?
- **Engineering Teams:** Looking to automate mundane PR reviews while maintaining high architectural and security standards.
- **Tech Leads / Staff Engineers:** Wanting an automated "second pair of eyes" to enforce custom team guidelines, coding conventions, and clean architecture.
- **Solo Developers:** Needing specialized feedback on performance bottlenecks, edge-case bugs, or vulnerability risks before pushing to production.

---

## 🚀 Swarm Architecture Diagram

```mermaid
graph TD
    User([👨‍💻 User]) --> |Selects Repo & Files| Frontend(🖥️ Next.js Frontend)
    
    subgraph GitHub
    Frontend --> |OAuth Token| GitHubAPI[("🐙 GitHub API")]
    end

    Frontend --> |POST /api/review| Backend(⚙️ FastAPI Backend)
    Backend -.-> |Server-Sent Events Stream| Frontend
    
    Backend --> |Fetch Repo Context| GitHubAPI
    
    subgraph Swarm[🤖 Agentic Swarm Orchestrator]
        Advisor[Layers Architecture Advisor]
        
        subgraph Workers[Parallel Workers]
            Security[🛡️ Security Sentinel]
            Bugs[🐛 Bug Detective]
            Perf[⚡ Performance Profiler]
            Docs[📝 Documentation Auditor]
            Deps[📦 Dependency Guardian]
            Test[🧪 Test Coverage Analyst]
            Purist[✨ Code Purist]
        end
        
        Lead[Network Lead Reviewer]
        
        Advisor --> |Sets Global Context| Workers
        Workers --> |Raw Findings| Lead
    end
    
    Backend --> Swarm
    
    subgraph Gemini[✨ Gemini API Ecosystem]
        Flash[⚡ Gemini 2.5 Flash Model]
        Tools[🛠️ Function Calling / Tools]
        Flash <--> Tools
    end
    
    Workers <--> |Parallel API Calls via asyncio| Gemini
    Lead <--> |Synthesize & Deduplicate| Gemini
    Tools -.-> |Dynamic Code Search| GitHubAPI
```

---

## 🧠 Core Concepts & Innovations

### 1. Hierarchical Agentic Swarms
Instead of a monolithic AI, we use a structured swarm:
- **The Architect (Synchronous):** Analyzes the global scope of the repository first to establish the big picture.
- **The Workers (Parallel):** 7 independent agents execute concurrently. Each agent is given a strict, narrow "focus area" (e.g., only looking for SQL injections, or only looking for Big-O inefficiencies) to prevent LLM hallucination and context-loss.
- **The Lead Reviewer (Synthesizer):** Runs last to aggregate, deduplicate, and finalize the reports from the workers into a single, cohesive JSON response.

### 2. Asynchronous Concurrency & Rate Limiting
To achieve massive parallel execution without hitting API limits, the backend implements a global `asyncio.Semaphore`. Combined with an intelligent exponential backoff algorithm, the orchestrator gracefully queues and throttles API requests, ensuring 100% reliability.

### 3. Real-time Server-Sent Events (SSE)
We built a custom SSE streaming pipeline from the Python FastAPI backend to the Next.js frontend. As soon as an individual agent finishes its analysis, the finding is instantly streamed and rendered on the UI, rather than making the user wait for the entire swarm to finish.

### 4. Auto-Fix (Unified Git Diffs)
Identifying a bug is only half the battle. Our agents automatically generate unified Git diff strings. The frontend parses these strings and renders beautiful, syntax-highlighted inline diffs right next to your broken code, complete with a one-click "Apply Fix" feature.

---

## 🛠️ Tech Stack & Architecture

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 15` (App Router) | Core React framework for building the UI and routing. |
| **Styling & UI** | `Tailwind CSS`, `lucide-react` | Utility-first styling and beautiful SVG icon sets. |
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
