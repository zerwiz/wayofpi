import { useState, useEffect } from "react";
// UiMode imported as string type
// import { WorkBoard } from "./kanban/WorkBoard";

interface TimeEntry {
  id: string;
  workerName: string;
  date: string;
  hours: number;
  project: string;
  status: "pending" | "approved" | "rejected";
}

interface WorkTask {
  id: string;
  title: string;
  assignedTo: string;
  status: "draft" | "in_progress" | "complete" | "cancelled";
  estimatedHours?: number;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export function WorkApp({ uiMode, setUiMode }: { uiMode: string; setUiMode: (m: string) => void }) {
  const [activeTab, setActiveTab] = useState<"time" | "tasks" | "contacts">("tasks");
  const [isLeader, setIsLeader] = useState(false); // TODO: Get from user role via /api/me

  // Real data from APIs
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

   useEffect(() => {
     loadData();
   }, []);

   async function loadData() {
     try {
       setLoading(true);
       const token = localStorage.getItem("wop_token");
       const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
       
       const [timeRes, tasksRes, contactsRes] = await Promise.all([
         fetch("/api/portal/time", { headers }),
         fetch("/api/portal/tasks", { headers }),
         fetch("/api/admin/users", { headers }), // For contacts, we use admin users endpoint
       ]);
       
       if (timeRes.ok) {
         const timeData = await timeRes.json();
         setTimeEntries(timeData.map((t: any) => ({
           id: t.id,
           workerName: t.user_id || "Unknown",
           date: t.date,
           hours: t.hours,
           project: t.project_name || t.project_id || "Unknown",
           status: t.status || "pending",
         })));
       }
       
       if (tasksRes.ok) {
         const tasksData = await tasksRes.json();
         setTasks(tasksData.map((t: any) => ({
           id: t.id,
           title: t.title,
           assignedTo: t.assigned_to || "Unassigned",
           status: t.status,
           estimatedHours: t.estimated_hours,
         })));
       }
       
       if (contactsRes.ok) {
         const contactsData = await contactsRes.json();
         setContacts(contactsData.map((u: any) => ({
           id: u.id,
           name: u.username,
           phone: u.phone || "N/A",
           role: u.role,
         })));
       }
       
       setError("");
     } catch (e) {
       setError(e instanceof Error ? e.message : "Failed to load data");
     } finally {
       setLoading(false);
     }
   }

  const pendingCount = timeEntries.filter(e => e.status === "pending").length;
  const approvedCount = timeEntries.filter(e => e.status === "approved").length;

  return (
    <div className="work-mode flex h-full flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#cccccc]">⏰ WORK MODE</span>
            {isLeader && (
              <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
                Leader
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLeader(!isLeader)}
            className="rounded px-3 py-1.5 text-xs text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc] transition-colors"
          >
            {isLeader ? "Switch to Worker View" : "Switch to Leader View"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#3c3c3c] bg-[#252526] px-4">
        {(["time", "tasks", "contacts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[#ea580c] text-[#ea580c]"
                : "text-[#858585] hover:text-[#cccccc]"
            }`}
          >
            {tab === "time" && `⏰ Time Entries (${pendingCount} pending)`}
            {tab === "tasks" && "📋 Tasks"}
            {tab === "contacts" && "📱 Contacts"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Time Entries Tab */}
        {activeTab === "time" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#cccccc]">Time Entries</h2>
              {!isLeader && (
                <button className="rounded bg-[#ea580c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#c2410c] transition-colors">
                  + Log Time
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="rounded border border-[#3c3c3c] bg-[#252526] p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                <p className="text-xs text-[#858585]">Pending</p>
              </div>
              <div className="rounded border border-[#3c3c3c] bg-[#252526] p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
                <p className="text-xs text-[#858585]">Approved</p>
              </div>
              <div className="rounded border border-[#3c3c3c] bg-[#252526] p-3 text-center">
                <p className="text-2xl font-bold text-[#cccccc]">32.5h</p>
                <p className="text-xs text-[#858585]">This Month</p>
              </div>
            </div>

            {/* Entries List */}
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="rounded border border-[#3c3c3c] bg-[#252526] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[#cccccc]">{entry.workerName}</h3>
                      <p className="text-xs text-[#858585]">{entry.date} • {entry.project}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded px-2 py-1 text-xs ${
                        entry.status === "approved" ? "bg-green-900/30 text-green-400" :
                        entry.status === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                        "bg-red-900/30 text-red-400"
                      }`}>
                        {entry.status === "approved" && "✅ Approved"}
                        {entry.status === "pending" && "🕐 Pending"}
                        {entry.status === "rejected" && "❌ Rejected"}
                      </span>
                      <span className="text-sm font-semibold text-[#cccccc]">{entry.hours}h</span>
                    </div>
                  </div>

                  {/* Leader Actions */}
                  {isLeader && entry.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                        ✅ Approve
                      </button>
                      <button className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="h-full flex flex-col items-center justify-center text-[#858585] text-sm italic">
            {/* <WorkBoard /> */}
            WorkBoard temporarily disabled for build stabilization
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#cccccc]">Team Contacts</h2>
              {isLeader && (
                <button className="rounded bg-[#ea580c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#c2410c] transition-colors">
                  + Add Contact
                </button>
              )}
            </div>

            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded border border-[#3c3c3c] bg-[#252526] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#3c3c3c] p-2">
                        <span className="text-sm text-[#cccccc]">📱</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[#cccccc]">{contact.name}</h3>
                        <p className="text-xs text-[#858585]">{contact.role}</p>
                        <p className="text-xs text-[#585858]">{contact.phone}</p>
                      </div>
                    </div>
                    {isLeader && (
                      <div className="flex gap-2">
                        <button className="rounded bg-[#3c3c3c] px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#4c4c4c] transition-colors">
                          Edit
                        </button>
                        <button className="rounded bg-blue-900/30 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900/50 transition-colors">
                          Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
