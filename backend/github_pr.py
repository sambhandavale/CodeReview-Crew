import httpx
import base64
import uuid
from google import genai
from google.genai import types
import os

client = genai.Client()
MODEL_FLASH = "gemini-2.5-flash"

def apply_diff_deterministic(original_content: str, diff: str) -> str | None:
    """
    A very naive deterministic patcher. It looks for the exact block of removed lines
    and replaces them with the added lines. If it can't find an exact match, returns None.
    """
    lines = diff.split('\n')
    removed_lines = []
    added_lines = []
    
    for line in lines:
        if line.startswith('---') or line.startswith('+++') or line.startswith('@@'):
            continue
        if line.startswith('-'):
            removed_lines.append(line[1:])
        elif line.startswith('+'):
            added_lines.append(line[1:])
        elif line.startswith(' '):
            # Context line
            removed_lines.append(line[1:])
            added_lines.append(line[1:])
            
    removed_block = '\n'.join(removed_lines)
    added_block = '\n'.join(added_lines)
    
    if removed_block and removed_block in original_content:
        return original_content.replace(removed_block, added_block, 1)
        
    return None

async def apply_diff_with_gemini(original_content: str, diff: str) -> str:
    prompt = f"""You are an expert code editor. Apply the following unified diff to the original file content.
Output ONLY the full, completely modified file content. Do not output any markdown formatting, backticks, or explanations. Just the raw code.

--- ORIGINAL FILE ---
{original_content}

--- UNIFIED DIFF ---
{diff}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_FLASH,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.0)
    )
    
    new_content = response.text
    if new_content.startswith("```"):
        # Strip markdown blocks if Gemini stubbornly includes them
        lines = new_content.split('\n')
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].strip() == "```":
            lines = lines[:-1]
        new_content = '\n'.join(lines)
        
    return new_content

async def create_pull_request(repo_name: str, github_token: str, file_path: str, diff: str, title: str) -> str:
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    async with httpx.AsyncClient() as http_client:
        # 1. Get original file
        url = f"https://api.github.com/repos/{repo_name}/contents/{file_path}"
        resp = await http_client.get(url, headers=headers)
        if resp.status_code != 200:
            raise Exception(f"Failed to fetch file: {resp.text}")
            
        file_data = resp.json()
        original_content = base64.b64decode(file_data['content']).decode('utf-8')
        file_sha = file_data['sha']
        
        # 2. Apply patch (Deterministic first, then Gemini)
        new_content = apply_diff_deterministic(original_content, diff)
        if not new_content:
            print("Deterministic patch failed, falling back to Gemini...")
            new_content = await apply_diff_with_gemini(original_content, diff)
            
        # 3. Get default branch (assume main, fallback to master if main fails)
        branch_name = "main"
        resp = await http_client.get(f"https://api.github.com/repos/{repo_name}/git/refs/heads/main", headers=headers)
        if resp.status_code != 200:
            branch_name = "master"
            resp = await http_client.get(f"https://api.github.com/repos/{repo_name}/git/refs/heads/master", headers=headers)
            if resp.status_code != 200:
                raise Exception("Could not find main or master branch")
                
        base_sha = resp.json()['object']['sha']
        
        # 4. Create new branch
        new_branch = f"crc-fix-{uuid.uuid4().hex[:8]}"
        create_ref_url = f"https://api.github.com/repos/{repo_name}/git/refs"
        resp = await http_client.post(create_ref_url, headers=headers, json={
            "ref": f"refs/heads/{new_branch}",
            "sha": base_sha
        })
        if resp.status_code != 201:
            raise Exception(f"Failed to create branch: {resp.text}")
            
        # 5. Commit new file to new branch
        commit_url = f"https://api.github.com/repos/{repo_name}/contents/{file_path}"
        commit_msg = f"Fix: {title}\n\nApplied by Code Review Crew."
        resp = await http_client.put(commit_url, headers=headers, json={
            "message": commit_msg,
            "content": base64.b64encode(new_content.encode('utf-8')).decode('utf-8'),
            "sha": file_sha,
            "branch": new_branch
        })
        if resp.status_code not in [200, 201]:
            raise Exception(f"Failed to commit file: {resp.text}")
            
        # 6. Create Pull Request
        pr_url = f"https://api.github.com/repos/{repo_name}/pulls"
        resp = await http_client.post(pr_url, headers=headers, json={
            "title": f"Code Review Crew Fix: {title}",
            "body": "Automated fix applied by Code Review Crew.\n\n### Diff Summary:\n```diff\n" + diff + "\n```",
            "head": new_branch,
            "base": branch_name
        })
        if resp.status_code != 201:
            raise Exception(f"Failed to create PR: {resp.text}")
            
        return resp.json()['html_url']
