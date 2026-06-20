import asyncio
import json
from agents import AGENTS, run_agent, run_lead_reviewer

async def run_code_review_swarm(code: str, custom_instructions: str | None = None, github_token: str | None = None, repo_name: str | None = None):
    """
    Generator that orchestrates the hierarchical swarm:
    1. Architecture Advisor runs first.
    2. Other agents run in parallel using Architecture context.
    3. Lead Reviewer synthesizes all findings.
    """
    def make_event(event_type, data):
        return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n"

    all_raw_findings = []

    # 1. Run Architecture Advisor first
    arch_info = AGENTS["advisor"]
    arch_result_json = await run_agent("advisor", arch_info["name"], arch_info["focus"], code, custom_instructions, github_token=github_token, repo_name=repo_name)
    
    try:
        arch_parsed = json.loads(arch_result_json)
        arch_findings = arch_parsed.get("findings", [])
    except json.JSONDecodeError:
        arch_findings = []
        
    all_raw_findings.extend(arch_findings)
    
    yield make_event("agent_done", {
        "agent_id": "advisor",
        "findings": arch_findings
    })

    # Prepare context for other agents
    arch_context = json.dumps(arch_findings) if arch_findings else None

    # 2. Run remaining agents in parallel
    tasks = []
    stagger_delay = 0.0
    for agent_id, info in AGENTS.items():
        if agent_id == "advisor":
            continue
            
        async def agent_task(a_id=agent_id, a_name=info["name"], a_focus=info["focus"], delay=stagger_delay):
            if delay > 0:
                await asyncio.sleep(delay)
            result_json = await run_agent(a_id, a_name, a_focus, code, custom_instructions, architecture_context=arch_context, github_token=github_token, repo_name=repo_name)
            return a_id, result_json
        
        tasks.append(asyncio.create_task(agent_task()))
        stagger_delay += 1.5

    for completed_task in asyncio.as_completed(tasks):
        a_id, result_json = await completed_task
        try:
            parsed_result = json.loads(result_json)
            agent_findings = parsed_result.get("findings", [])
        except json.JSONDecodeError:
            agent_findings = []
            
        all_raw_findings.extend(agent_findings)
            
        yield make_event("agent_done", {
            "agent_id": a_id,
            "findings": agent_findings
        })

    # 3. Run Lead Reviewer to synthesize
    lead_result_json = await run_lead_reviewer(code, all_raw_findings, custom_instructions)
    try:
        lead_parsed = json.loads(lead_result_json)
        lead_findings = lead_parsed.get("findings", [])
    except json.JSONDecodeError:
        lead_findings = all_raw_findings # Fallback to raw findings if lead fails

    yield make_event("lead_done", {
        "findings": lead_findings
    })

    yield make_event("done", True)
