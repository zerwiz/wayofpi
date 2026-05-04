import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface WorkerCredentials {
  workerId: string;
  pin: string;
}

interface WorkerFile {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "cad" | "image" | "doc";
  updatedAt: string;
}

interface WorkerTask {
  id: string;
  title: string;
  hours: number;
  status: "not_started" | "in_progress" | "complete";
  progressPct?: number;
}

export function WorkerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "files" | "time">("tasks");

  // Real data from APIs
  const [workerName, setWorkerName] = useState("Worker");
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [files, setFiles] = useState<WorkerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadPortalData();
  }, []);

  async function loadPortalData() {
    try {
      setLoading(true);
      // TODO: Fetch from /api/portal/me, /api/portal/tasks, /api/portal/files
      // const [meRes, tasksRes, filesRes] = await Promise.all([...]);
      // if (meRes.ok) { const data = await meRes.json(); setWorkerName(data.name); }
      // if (tasksRes.ok) setTasks(await tasksRes.json());
      // if (filesRes.ok) setFiles(await filesRes.json());
      setLoadError("API endpoints not yet implemented");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !pin) {
      setError("Please enter Worker ID and PIN");
      return;
    }
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, pin }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid credentials");
        return;
      }
      const data = await res.json();
      localStorage.setItem("wop_token", data.token);
      setIsLoggedIn(true);
      setError("");
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  const handleDownload = (fileId: string) => {
    // TODO: Replace with actual download: GET /api/portal/download/:fileId
    window.open(`/api/portal/download/${fileId}`, "_blank");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setWorkerId("");
    setPin("");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="w-full max-w-sm rounded-lg border border-[#3c3c3c] bg-[#252526] p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-[#cccccc]">WAY OF PI</h1>
            <p className="mt-1 text-sm text-[#858585]">Worker Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-[#858585] mb-1">Worker ID</label>
              <input
                type="text"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="e.g., WORKER-001"
                className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] placeholder-[#585858] focus:border-[#ea580c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#858585] mb-1">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-digit PIN"
                maxLength={4}
                className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] placeholder-[#585858] focus:border-[#ea580c] focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c2410c] transition-colors"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[#585858]">
            Demo: Use PIN "1234"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-4 py-3">
        <div>
          <h1 className="text-sm font-bold text-[#cccccc]">WAY OF PI - WORKER PORTAL</h1>
          <p className="text-xs text-[#858585]">Welcome, {workerName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded px-3 py-1.5 text-xs text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc] transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#3c3c3c] bg-[#252526] px-4">
        {(["tasks", "files", "time"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[#ea580c] text-[#ea580c]"
                : "text-[#858585] hover:text-[#cccccc]"
            }`}
          >
            {tab === "tasks" && "📋 My Tasks"}
            {tab === "files" && "📐 My Files"}
            {tab === "time" && "⏰ Time Entries"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "tasks" && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-[#cccccc]">My Tasks</h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded border border-[#3c3c3c] bg-[#252526] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[#cccccc]">{task.title}</h3>
                      <p className="text-xs text-[#858585]">Estimated: {task.hours}h</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs ${
                      task.status === "complete" ? "bg-green-900/30 text-green-400" :
                      task.status === "in_progress" ? "bg-blue-900/30 text-blue-400" :
                      "bg-[#3c3c3c] text-[#858585]"
                    }`}>
                      {task.status === "complete" && "✅ Complete"}
                      {task.status === "in_progress" && "🚀 In Progress"}
                      {task.status === "not_started" && "⏳ Not Started"}
                    </span>
                  </div>
                  {task.progressPct !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[#858585] mb-1">
                        <span>Progress</span>
                        <span>{task.progressPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#3c3c3c]">
                        <div
                          className="h-full rounded-full bg-[#ea580c]"
                          style={{ width: `${task.progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-[#cccccc]">My Files</h2>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded border border-[#3c3c3c] bg-[#252526] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {file.type === "pdf" && "📐"}
                      {file.type === "cad" && "📐"}
                      {file.type === "image" && "📸"}
                      {file.type === "doc" && "📄"}
                    </span>
                    <div>
                      <p className="text-sm text-[#cccccc]">{file.name}</p>
                      <p className="text-xs text-[#858585]">{file.size} • Updated {file.updatedAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file.id)}
                    className="rounded bg-[#3c3c3c] px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#4c4c4c] transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "time" && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-[#cccccc]">Time Entries</h2>
            <div className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[#ea580c]">6h</p>
                  <p className="text-xs text-[#858585]">Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">2</p>
                  <p className="text-xs text-[#858585]">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">32.5h</p>
                  <p className="text-xs text-[#858585]">This Month</p>
                </div>
              </div>
            </div>

            <button className="w-full rounded border border-[#ea580c] px-4 py-2 text-sm text-[#ea580c] hover:bg-[#ea580c] hover:text-white transition-colors">
              + Log Time Entry
            </button>

            <p className="mt-4 text-center text-xs text-[#585858]">
              Or use WhatsApp: "log 4.5h on A-101" to @WorkTimeBot
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
