"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import {
  GitBranch,
  Star,
  Lock,
  Globe,
  ArrowRight,
  Search,
  Loader2,
  FolderGit2,
  Code2,
} from "lucide-react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchRepos() {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(
          "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (err) {
        console.error("Failed to fetch repos:", err);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchRepos();
  }, [session]);

  const filteredRepos = repos.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "public" && !repo.private) ||
      (filter === "private" && repo.private);
    return matchesSearch && matchesFilter;
  });

  const languageColors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#f34b7d",
    C: "#555555",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Dart: "#00B4AB",
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">
              Loading your repositories...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const publicCount = repos.filter((r) => !r.private).length;
  const privateCount = repos.filter((r) => r.private).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2">
              Your Repositories
            </h1>
            <p className="text-muted-foreground">
              Select a repository to run the AI Code Review Crew on it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-foreground">
                {repos.length}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Total</p>
            </div>
            <div className="glass-panel px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-green-600">
                {publicCount}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Public
              </p>
            </div>
            <div className="glass-panel px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-orange-500">
                {privateCount}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Private
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-white text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "public", "private"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-muted-foreground border border-border hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Repo Grid */}
        {filteredRepos.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <FolderGit2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No repositories found</h3>
            <p className="text-muted-foreground">
              {search
                ? "Try a different search term."
                : "No repos match this filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() =>
                  router.push(
                    `/review?repo=${encodeURIComponent(repo.full_name)}`
                  )
                }
                className="glass-panel p-6 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Code2 className="w-5 h-5 text-primary shrink-0" />
                    <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {repo.name}
                    </h3>
                  </div>
                  {repo.private ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                  {repo.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              languageColors[repo.language] || "#6b7280",
                          }}
                        ></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" />
                      {repo.forks_count}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
