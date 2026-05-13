/**
 * Time Entries Page - Simple time entry viewer for workers
 */

import { useEffect, useState, Suspense, useMemo } from "react";
import { Clock, User, Project } from "lucide-react";

async function getTimeEntries() {
  const url = new URL(`${window.location.origin}/api/time_entries`);
  return fetch(url).then(res => res.json());
}

function ProjectBadge({ project }: { project?: any }) {
  return project ? <span className="px-2 py-1 text-xs bg-[#3c3c3c] rounded">{project.name}</span> : null;
}

export function TimeEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadEntries() {
      try {
        const data = await getTimeEntries();
        setEntries(data);
      } catch (e) {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, []);
  
  const filteredEntries = useMemo(() => entries.filter(e => e.status === 'pending'), [entries]);
  
  return (
    <div className="time-entries-page">
      <div className="page-header mb-4">
        <h2 className="text-lg font-medium">My Time Entries</h2>
        <span className="text-sm text-[#858585]">{filteredEntries.length} pending, {entries.length - filteredEntries.length} approved</span>
      </div>
      
      <div className="entries-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">No pending time entries to review.</div>
        ) : (
          <div className="entries-grid">
            {filteredEntries.map((e: any) => (
              <div key={e.id} className="entry-card">
                <div className="entry-header flex items-center gap-2">
                  <span className="entry-date flex items-center gap-1">
                    <Clock size={14} />
                    {e.date}
                  </span>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{e.user_id?.substring(0, 6)}</span>
                  </div>
                  <span className={`entry-status ${e.status?.toLowerCase()}`}>{e.status}</span>
                </div>
                <div className="entry-project"><ProjectBadge project={e.project} /></div>
                <div className="entry-hours">{e.hours} hours</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
