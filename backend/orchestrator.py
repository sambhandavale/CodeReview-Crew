import asyncio
import json
from agents import AGENTS, run_agent

async def run_code_review_swarm(code: str):
    def make_event(event_type, data):
        return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n"

    # We do not yield an initialization status here, as the frontend UI handles the "Reviewing X files" state.
    # We will immediately start yielding results as agents finish.
    
    tasks = []
    stagger_delay = 0.0
    for agent_id, info in AGENTS.items():
        # Create an async task for each agent that returns (agent_id, JSON string of findings)
        async def agent_task(a_id=agent_id, a_name=info["name"], a_focus=info["focus"], delay=stagger_delay):
            if delay > 0:
                await asyncio.sleep(delay)
            result_json = await run_agent(a_id, a_name, a_focus, code)
            return a_id, result_json
        
        tasks.append(asyncio.create_task(agent_task()))
        stagger_delay += 1.5 # Stagger each agent start by 1.5 seconds

    # Yield as each agent completes
    for completed_task in asyncio.as_completed(tasks):
        a_id, result_json = await completed_task
        try:
            # Parse the JSON returned by the model
            parsed_result = json.loads(result_json)
        except json.JSONDecodeError:
            parsed_result = {"findings": []}
            
        # Yield the specific agent's findings to the frontend
        yield make_event("agent_done", {
            "agent_id": a_id,
            "findings": parsed_result.get("findings", [])
        })

    yield make_event("done", True)
