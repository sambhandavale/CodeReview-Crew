import { TreeNode } from "./types";
import { FolderTree, File, Folder, FolderOpen, ChevronRight, ChevronDown, CheckSquare, Square, MinusSquare, AlertTriangle, Play } from "lucide-react";
import { getFilesUnderDir } from "./utils";

interface FileExplorerProps {
  tree: TreeNode[];
  totalFiles: number;
  selectedPaths: Set<string>;
  expandedDirs: Set<string>;
  reviewMode: string;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
  toggleSelect: (node: TreeNode) => void;
  toggleExpand: (path: string) => void;
  onPreviewFile: (path: string) => void;
  startReview: () => void;
}

export function FileExplorer({
  tree,
  totalFiles,
  selectedPaths,
  expandedDirs,
  reviewMode,
  customInstructions,
  setCustomInstructions,
  toggleSelect,
  toggleExpand,
  onPreviewFile,
  startReview
}: FileExplorerProps) {
  
  const getDirCheckState = (node: TreeNode): "none" | "some" | "all" => {
    if (!node.children) return "none";
    const childFiles = getFilesUnderDir(node.children);
    if (childFiles.length === 0) return "none";
    const selectedCount = childFiles.filter((f) => selectedPaths.has(f)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === childFiles.length) return "all";
    return "some";
  };

  return (
    <div className="w-[380px] shrink-0 bg-white rounded-xl border border-border flex flex-col shadow-sm overflow-hidden sticky top-6 max-h-[calc(100vh-60px)]">
      <div className="px-4 py-3 border-b border-border bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-primary" />
            File Explorer
          </h2>
          <span className="text-xs font-semibold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
            {selectedPaths.size}/{totalFiles}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 border-b border-border">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedPaths={selectedPaths}
            expandedDirs={expandedDirs}
            toggleSelect={toggleSelect}
            toggleExpand={toggleExpand}
            getDirCheckState={getDirCheckState}
            onPreviewFile={onPreviewFile}
            reviewMode={reviewMode}
          />
        ))}
      </div>

      {reviewMode === "selection" && (
        <div className="p-4 bg-slate-50 shrink-0">
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
            Custom Team Guidelines (Optional)
          </label>
          <textarea 
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Enforce strict functional programming, no classes. Use DOMPurify for XSS."
            className="w-full h-20 p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none mb-3"
          />
          
          {selectedPaths.size > 5 && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-red-700 leading-relaxed font-semibold">
                Max 5 files per review batch to avoid token exhaustion.
              </p>
            </div>
          )}

          <button
            onClick={startReview}
            disabled={selectedPaths.size === 0 || selectedPaths.size > 5}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            Start Review
          </button>
        </div>
      )}
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  selectedPaths,
  expandedDirs,
  toggleSelect,
  toggleExpand,
  getDirCheckState,
  onPreviewFile,
  reviewMode,
}: {
  node: TreeNode;
  depth: number;
  selectedPaths: Set<string>;
  expandedDirs: Set<string>;
  toggleSelect: (node: TreeNode) => void;
  toggleExpand: (path: string) => void;
  getDirCheckState: (node: TreeNode) => "none" | "some" | "all";
  onPreviewFile: (path: string) => void;
  reviewMode: string;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = node.type === "file" ? selectedPaths.has(node.path) : false;
  const dirState = node.type === "dir" ? getDirCheckState(node) : "none";

  const CheckIcon = node.type === "file"
    ? isSelected ? CheckSquare : Square
    : dirState === "all" ? CheckSquare : dirState === "some" ? MinusSquare : Square;

  const checkColor = (node.type === "file" && isSelected) || dirState !== "none"
    ? "text-primary"
    : "text-slate-300";

  const ext = node.name.split(".").pop()?.toLowerCase() || "";
  const langColor: Record<string, string> = {
    ts: "#3178c6", tsx: "#3178c6", js: "#f1e05a", jsx: "#f1e05a",
    py: "#3572A5", go: "#00ADD8", rs: "#dea584", java: "#b07219",
    css: "#563d7c", html: "#e34c26", json: "#292929", md: "#083fa1",
    yml: "#cb171e", yaml: "#cb171e", sh: "#89e051",
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group hover:bg-slate-50 transition-colors ${
          isSelected ? "bg-primary/5" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === "dir" ? (
          <button onClick={() => toggleExpand(node.path)} className="p-0.5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}

        {reviewMode === "selection" && (
          <button onClick={() => toggleSelect(node)} className={`shrink-0 ${checkColor}`}>
            <CheckIcon className="w-4 h-4" />
          </button>
        )}

        {node.type === "dir" ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0 ml-1" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 shrink-0 ml-1" />
          )
        ) : (
          <div className="relative ml-1 shrink-0">
            <File className="w-4 h-4 text-slate-400" />
            {langColor[ext] && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: langColor[ext] }}
              />
            )}
          </div>
        )}

        <span
          className={`text-sm truncate ml-1.5 ${
            node.type === "dir" ? "font-semibold text-foreground" : "text-foreground/80"
          }`}
          onClick={() => {
            if (node.type === "file") onPreviewFile(node.path);
            else toggleExpand(node.path);
          }}
        >
          {node.name}
        </span>

        {node.type === "file" && node.size !== undefined && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}KB` : `${node.size}B`}
          </span>
        )}
      </div>

      {node.type === "dir" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPaths={selectedPaths}
              expandedDirs={expandedDirs}
              toggleSelect={toggleSelect}
              toggleExpand={toggleExpand}
              getDirCheckState={getDirCheckState}
              onPreviewFile={onPreviewFile}
              reviewMode={reviewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
