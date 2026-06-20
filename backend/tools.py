import httpx
import base64

def get_agent_tools(repo_name: str | None, github_token: str | None):
    """Returns a list of callable tools bound to the specific user repo and token."""
    
    if not repo_name or not github_token:
        # If no credentials, return an empty list of tools
        return []

    async def search_codebase(query: str) -> str:
        """
        Searches the entire GitHub repository for a specific string query, variable, or function name.
        Returns a list of file paths and matching lines.
        """
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        url = f"https://api.github.com/search/code?q={query}+repo:{repo_name}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                return f"Error searching codebase: HTTP {response.status_code} - {response.text}"
            
            data = response.json()
            items = data.get("items", [])
            if not items:
                return f"No results found in repository for query: {query}"
                
            results = []
            for item in items[:5]: # limit to top 5 files to save tokens
                results.append(f"File: {item['path']}")
            return "Search results:\n" + "\n".join(results) + "\n\nUse read_file on these paths to see the exact code."

    async def read_file(path: str) -> str:
        """
        Reads the full content of a specific file in the repository.
        """
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        url = f"https://api.github.com/repos/{repo_name}/contents/{path}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                return f"Error reading file {path}: HTTP {response.status_code}"
            
            data = response.json()
            content = data.get("content", "")
            if content:
                decoded = base64.b64decode(content).decode('utf-8', errors='replace')
                # truncate if extremely long
                if len(decoded) > 10000:
                    decoded = decoded[:10000] + "\n...[TRUNCATED]"
                return f"--- Content of {path} ---\n{decoded}"
            return f"Error: File {path} has no readable content."

    return [search_codebase, read_file]
