import asyncio
import json
from agents import (
    run_security_agent,
    run_bug_agent,
    run_quality_agent,
    run_performance_agent,
    run_lead_agent
)

async def run_code_review_swarm(code: str):
    def make_event(event_type, data):
        return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n"

    yield make_event("status", "Initializing swarm...")
    await asyncio.sleep(0.5)

    yield make_event("status", "Worker agents analyzing concurrently...")
    
    sec_task = asyncio.create_task(run_security_agent(code))
    bug_task = asyncio.create_task(run_bug_agent(code))
    qual_task = asyncio.create_task(run_quality_agent(code))
    perf_task = asyncio.create_task(run_performance_agent(code))

    sec_res, bug_res, qual_res, perf_res = await asyncio.gather(
        sec_task, bug_task, qual_task, perf_task
    )

    yield make_event("status", "Workers finished. Lead agent is synthesizing...")
    
    final_report = await run_lead_agent(code, sec_res, bug_res, qual_res, perf_res)

    yield make_event("status", "Review complete!")
    yield make_event("result", final_report)
    yield make_event("done", True)
