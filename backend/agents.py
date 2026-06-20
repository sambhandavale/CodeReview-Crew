import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

client = genai.Client()
MODEL_FLASH = "gemini-3.5-flash"

import asyncio
api_semaphore = asyncio.Semaphore(1)

async def rate_limited_chat_send(chat, prompt, agent_name):
    for attempt in range(5):
        try:
            async with api_semaphore:
                response = await chat.send_message(prompt)
                await asyncio.sleep(2) # Minimum delay between requests
                return response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                delay = 8 + (attempt * 4)
                print(f"Agent {agent_name} hit rate/demand limit in research. Retrying in {delay}s... (Attempt {attempt+1}/5)")
                await asyncio.sleep(delay)
            else:
                raise e
    raise Exception("Rate limit retries exhausted")

async def rate_limited_generate(contents, config, agent_name):
    for attempt in range(5):
        try:
            async with api_semaphore:
                response = await client.aio.models.generate_content(
                    model=MODEL_FLASH,
                    contents=contents,
                    config=config
                )
                await asyncio.sleep(2)
                return response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                delay = 8 + (attempt * 4)
                print(f"Agent {agent_name} hit rate limit in review. Retrying in {delay}s... (Attempt {attempt+1}/5)")
                await asyncio.sleep(delay)
            else:
                raise e
    raise Exception("Rate limit retries exhausted")

class Finding(BaseModel):
    line: int = Field(description="The line number where the issue or suggestion occurs")
    title: str = Field(description="A short, descriptive title of the finding")
    description: str = Field(description="A detailed explanation of the issue")
    severity: str = Field(description="The severity of the issue: 'critical', 'high', 'medium', 'low', or 'info'")
    suggestion: str = Field(description="A code snippet or actionable advice to fix the issue")
    suggested_diff: str | None = Field(default=None, description="A unified git diff format string showing the exact lines to remove and add. Leave null if no direct code fix is applicable.")

class FindingList(BaseModel):
    findings: list[Finding]

async def run_agent(agent_id: str, agent_name: str, agent_focus: str, code: str, custom_instructions: str | None = None, architecture_context: str | None = None, github_token: str | None = None, repo_name: str | None = None) -> str:
    """Runs a single Gemini model call for a specific agent persona."""
    from tools import get_agent_tools
    agent_tools = get_agent_tools(repo_name, github_token)

    research_notes = ""
    if agent_tools:
        research_prompt = f"""You are the {agent_name} Agent for Code Review Crew. Your focus is: {agent_focus}.
You are preparing to review the following code:
{code}

You have tools to search the repository and read files.
Use the tools to investigate anything you need to understand the code better (e.g., where functions are defined, what imports do).
When you have finished your research, output a brief summary of your findings. DO NOT output JSON.
"""
        if custom_instructions:
            research_prompt += f"\nCRITICAL TEAM GUIDELINES / CUSTOM INSTRUCTIONS:\n{custom_instructions}\n"
        if architecture_context:
            research_prompt += f"\nARCHITECTURE CONTEXT (Provided by Architecture Advisor):\n{architecture_context}\n"
            
        try:
            chat = client.aio.chats.create(
                model=MODEL_FLASH, 
                config=types.GenerateContentConfig(tools=agent_tools, temperature=0.2)
            )
            research_response = await rate_limited_chat_send(chat, research_prompt, agent_name)
            research_notes = f"\n\n--- RESEARCH NOTES FROM CODEBASE SEARCH ---\n{research_response.text}\n-------------------------------------------\n\n"
        except Exception as e:
            print(f"Research phase failed for {agent_name}: {e}")
            pass

    prompt = f"""You are the {agent_name} Agent for Code Review Crew.
Your specialized focus is: {agent_focus}

You must review the provided code and return a JSON object with a list of findings.
For any finding that can be fixed with code, provide a precise `suggested_diff` in unified diff format (lines starting with - for removal and + for addition).
Do NOT output anything except valid JSON matching the schema.

"""
    if custom_instructions:
        prompt += f"\nCRITICAL TEAM GUIDELINES / CUSTOM INSTRUCTIONS:\n{custom_instructions}\n\nYou MUST adhere to these guidelines during your review.\n\n"

    if architecture_context:
        prompt += f"\nARCHITECTURE CONTEXT (Provided by Architecture Advisor):\n{architecture_context}\n\nUse this context to inform your review.\n\n"

    prompt += f"""Code to review:
{code}
"""
    if research_notes:
        prompt += research_notes
    try:
        response = await rate_limited_generate(
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FindingList,
            ),
            agent_name=agent_name
        )
        return response.text
    except Exception as e:
        print(f"Agent {agent_name} failed: {e}")
        return '{"findings": []}'

async def run_lead_reviewer(code: str, all_findings: list[dict], custom_instructions: str | None = None) -> str:
    """Runs the Lead Reviewer agent to synthesize and deduplicate findings."""
    import json
    findings_str = json.dumps(all_findings, indent=2)
    
    prompt = f"""You are the Lead Reviewer for Code Review Crew.
Your job is to take the findings from 8 specialized AI agents and synthesize them.
You must:
1. Deduplicate similar findings.
2. Resolve conflicting advice.
3. Prioritize the most important issues.
4. Merge any `suggested_diff`s if multiple agents suggested fixes for the same lines.
5. Return a cohesive final JSON list of findings matching the required schema.

"""
    if custom_instructions:
        prompt += f"\nCRITICAL TEAM GUIDELINES / CUSTOM INSTRUCTIONS:\n{custom_instructions}\n\nYou MUST adhere to these guidelines.\n\n"

    prompt += f"""Code that was reviewed:
{code}

Raw Findings from Agents:
{findings_str}
"""
    try:
        response = await rate_limited_generate(
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FindingList,
            ),
            agent_name="Lead Reviewer"
        )
        return response.text
    except Exception as e:
        print(f"Lead Reviewer failed: {e}")
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

async def stream_chat_with_agent(agent_name: str, code_snippet: str, finding_title: str, finding_description: str, message: str, history: list):
    # Find agent focus
    agent_focus = "Code quality and architecture."
    for info in AGENTS.values():
        if info["name"] == agent_name:
            agent_focus = info["focus"]
            break

    system_instruction = f"""You are the {agent_name} Agent for Code Review Crew.
Your specialized focus is: {agent_focus}

You are currently discussing this specific code finding with the user:
Title: {finding_title}
Description: {finding_description}

Code context:
```
{code_snippet}
```

Answer the user's question about this finding. Be extremely concise, helpful, and provide code examples if asked how to fix it. Keep responses short and conversational.
"""

    # Format history for Gemini API
    # history is a list of {"role": "user"|"model", "content": "..."}
    formatted_history = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        formatted_history.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))

    formatted_history.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    try:
        response_stream = await client.aio.models.generate_content_stream(
            model=MODEL_FLASH,
            contents=formatted_history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        async for chunk in response_stream:
            yield chunk.text
    except Exception as e:
        print(f"Chat stream failed: {e}")
        yield "\n\n[Error: Unable to generate response. Rate limit or connection issue.]"

