import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

client = genai.Client()
MODEL_FLASH = "gemini-3.5-flash"

class Finding(BaseModel):
    line: int = Field(description="The line number where the issue or suggestion occurs")
    title: str = Field(description="A short, descriptive title of the finding")
    description: str = Field(description="A detailed explanation of the issue")
    severity: str = Field(description="The severity of the issue: 'critical', 'high', 'medium', 'low', or 'info'")
    suggestion: str = Field(description="A code snippet or actionable advice to fix the issue")

class FindingList(BaseModel):
    findings: list[Finding]

async def run_agent(agent_id: str, agent_name: str, focus: str, code: str) -> str:
    prompt = f"""You are the {agent_name} Agent for Code Review Crew.
Your specialized focus is: {focus}

Analyze this code and provide a list of findings specifically related to your focus area.
If there are no issues in your area, return an empty list of findings.

Code to review:
{code}
"""
    for attempt in range(5):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_FLASH,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FindingList,
                )
            )
            return response.text
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                delay = 5 + (attempt * 3) # Progressive backoff: 5s, 8s, 11s, 14s
                print(f"Agent {agent_name} hit rate/demand limit. Retrying in {delay}s... (Attempt {attempt+1}/5)")
                import asyncio
                await asyncio.sleep(delay)
            else:
                print(f"Agent {agent_name} failed: {e}")
                return '{"findings": []}'
                
    print(f"Agent {agent_name} failed after retries.")
    return '{"findings": []}'

# The 8 Agent definitions mapped by ID
AGENTS = {
    "purist": {
        "name": "Code Purist",
        "focus": "Code readability, SOLID principles, naming conventions, formatting, and stylistic consistency."
    },
    "detective": {
        "name": "Bug Detective",
        "focus": "Logic errors, edge cases, off-by-one errors, null pointers, and state management bugs."
    },
    "sentinel": {
        "name": "Security Sentinel",
        "focus": "Security vulnerabilities, injection risks, hardcoded secrets, and insecure data handling."
    },
    "profiler": {
        "name": "Performance Profiler",
        "focus": "Big O time/space complexity, memory leaks, inefficient loops, and rendering bottlenecks."
    },
    "auditor": {
        "name": "Documentation Auditor",
        "focus": "Missing comments, outdated documentation, unclear function signatures, and docstring quality."
    },
    "guardian": {
        "name": "Dependency Guardian",
        "focus": "Outdated imports, vulnerable packages, heavy bundle sizes, and unused dependencies."
    },
    "analyst": {
        "name": "Test Coverage Analyst",
        "focus": "Missing unit tests, fragile test conditions, untested edge cases, and mocked data flaws."
    },
    "advisor": {
        "name": "Architecture Advisor",
        "focus": "System design, component coupling, folder structure, design patterns, and scalability."
    }
}

