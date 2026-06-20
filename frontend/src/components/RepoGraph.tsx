import React, { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface TreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
  size?: number;
}

interface RepoGraphProps {
  tree: TreeNode[];
}

const getExtensionColor = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const colors: Record<string, string> = {
    ts: "#3178c6", tsx: "#3178c6", js: "#f1e05a", jsx: "#f1e05a",
    py: "#3572A5", go: "#00ADD8", rs: "#dea584", java: "#b07219",
    css: "#563d7c", html: "#e34c26", json: "#292929", md: "#083fa1",
    yml: "#cb171e", yaml: "#cb171e", sh: "#89e051",
  };
  return colors[ext || ""] || "#94a3b8"; // default slate-400
};

export default function RepoGraph({ tree }: RepoGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Add an artificial root node to connect top-level folders
    nodes.push({ id: "root", name: "Repository", type: "root", color: "#6366f1", val: 8 });

    const traverse = (nodesList: TreeNode[], parentId: string) => {
      nodesList.forEach((n) => {
        const isDir = n.type === "dir";
        nodes.push({
          id: n.path,
          name: n.name,
          type: n.type,
          color: isDir ? "#eab308" : getExtensionColor(n.name), // yellow-500 for folders
          val: isDir ? 4 : 2 // size of node
        });
        
        links.push({ source: parentId, target: n.path });

        if (n.children) {
          traverse(n.children, n.path);
        }
      });
    };

    traverse(tree, "root");
    return { nodes, links };
  }, [tree]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[350px] bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none bg-white/90 px-3 py-3 rounded-xl shadow-sm border border-slate-200 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-2">Repository Architecture</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 max-w-[220px]">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#6366f1]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Root</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#eab308]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Folder</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3178c6]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">TS/JS</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3572A5]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Python</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#292929]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Config</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#94a3b8]"></div><span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Other</span></div>
        </div>
      </div>
      {dimensions.width > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={4}
          linkColor={() => "#cbd5e1"} // slate-300
          linkWidth={1.5}
          d3VelocityDecay={0.2}
          onNodeDragEnd={(node: any) => {
            // pin node on drag end
            node.fx = node.x;
            node.fy = node.y;
          }}
        />
      )}
    </div>
  );
}
