import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Initialize client. Assumes GEMINI_API_KEY is in environment.
client = genai.Client()

MODEL_FLASH = "gemini-2.5-flash"

async def run_security_agent(code: str) -> str:
    prompt = f"""You are the Security Agent for Code Review Crew.
Analyze this code for vulnerabilities, injections, hardcoded secrets, and insecure practices.
Provide a concise list of findings. If none, say "No security issues found."
Code to review:
{code}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt
    )
    return response.text

async def run_bug_agent(code: str) -> str:
    prompt = f"""You are the Bug Hunter Agent for Code Review Crew.
Analyze this code for edge cases, off-by-one errors, null pointers, and logical flaws.
Provide a concise list of findings. If none, say "No bugs found."
Code to review:
{code}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt
    )
    return response.text

async def run_quality_agent(code: str) -> str:
    prompt = f"""You are the Code Quality Agent for Code Review Crew.
Analyze this code for readability, SOLID principles, naming conventions, and dead code.
Provide a concise list of findings.
Code to review:
{code}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt
    )
    return response.text

async def run_performance_agent(code: str) -> str:
    prompt = f"""You are the Performance Agent for Code Review Crew.
Analyze this code for Big O complexity, memory leaks, and inefficient loops.
Provide a concise list of findings.
Code to review:
{code}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt
    )
    return response.text

async def run_lead_agent(code: str, sec: str, bug: str, qual: str, perf: str) -> str:
    prompt = f"""You are the Lead Reviewer Agent for Code Review Crew.
Synthesize the findings from your team into a final Markdown report.
Assign a final grade (e.g. A, B+, C-) at the top.
Remove duplicates and resolve conflicting advice.

Original Code:
{code}

Security Findings:
{sec}

Bug Findings:
{bug}

Quality Findings:
{qual}

Performance Findings:
{perf}

Output the final Markdown report now. Do not include any polite conversational fluff, just the report.
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt
    )
    return response.text
