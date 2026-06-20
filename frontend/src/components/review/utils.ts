import { TreeNode } from "./types";

export const SKIP_PATTERNS = [
  /^\.git\//,
  /node_modules\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.venv\//,
  /venv\//,
  /__pycache__\//,
  /\.pyc$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.ico$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.woff/,
  /\.ttf$/,
  /\.eot$/,
  /\.mp4$/,
  /\.mp3$/,
  /\.pdf$/,
  /\.zip$/,
  /\.tar/,
  /\.DS_Store/,
  /Thumbs\.db/,
];

export function shouldSkipFile(path: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(path));
}

export function buildTree(paths: { path: string; type: string; size?: number }[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const item of paths) {
    if (shouldSkipFile(item.path)) continue;

    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const existingNode = current.find((n) => n.name === name);

      if (existingNode) {
        if (existingNode.children) current = existingNode.children;
      } else {
        const newNode: TreeNode = {
          path: parts.slice(0, i + 1).join("/"),
          name,
          type: isLast && item.type === "blob" ? "file" : "dir",
          size: isLast ? item.size : undefined,
          children: isLast && item.type === "blob" ? undefined : [],
        };
        current.push(newNode);
        if (newNode.children) current = newNode.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  function sortTree(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sortTree(n.children);
    });
    return nodes;
  }
  return sortTree(root);
}

export function getFilesUnderDir(nodes: TreeNode[]): string[] {
  let files: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") files.push(node.path);
    else if (node.children) files = files.concat(getFilesUnderDir(node.children));
  }
  return files;
}
