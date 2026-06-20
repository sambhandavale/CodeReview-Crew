export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface TreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
  size?: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: "idle" | "running" | "done" | "error";
  icon: React.ReactNode;
  color: string;
  findings?: number;
}

export interface CodeFinding {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  agent: string;
  agentColor: string;
  title: string;
  description: string;
  suggestion?: string;
  suggested_diff?: string;
}
