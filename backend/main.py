from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from orchestrator import run_code_review_swarm
from agents import stream_chat_with_agent
from github_pr import create_pull_request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    code: str
    custom_instructions: str | None = None
    github_token: str | None = None
    repo_name: str | None = None

class FixRequest(BaseModel):
    repo_name: str
    github_token: str
    file_path: str
    diff: str
    title: str

class ChatRequest(BaseModel):
    agent_name: str
    code_snippet: str
    finding_title: str
    finding_description: str
    message: str
    history: list = []

@app.post("/api/review")
async def review_code(request: ReviewRequest):
    return StreamingResponse(
        run_code_review_swarm(request.code, request.custom_instructions, request.github_token, request.repo_name),
        media_type="text/event-stream"
    )

@app.post("/api/chat")
async def chat_code(request: ChatRequest):
    async def event_generator():
        async for chunk in stream_chat_with_agent(
            request.agent_name, 
            request.code_snippet, 
            request.finding_title, 
            request.finding_description, 
            request.message, 
            request.history
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/plain"
    )

@app.post("/api/apply-fix")
async def apply_fix_endpoint(request: FixRequest):
    try:
        pr_url = await create_pull_request(
            request.repo_name, request.github_token, request.file_path, request.diff, request.title
        )
        return {"success": True, "pr_url": pr_url}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
