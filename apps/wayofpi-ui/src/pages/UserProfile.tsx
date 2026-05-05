import { useState, useEffect } from "react";
import type { UiMode } from "../hooks/useUiMode";
import { UiModeToggle } from "../components/UiModeToggle";

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  jobTitle: string;
  tenantId: string;
}

export function UserProfilePage({ uiMode, setUiMode }: { uiMode: UiMode; setUiMode: (m: UiMode) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [pinChange, setPinChange] = useState({ oldPin: "", newPin: "", confirmPin: "" });
  const [showPinChange, setShowPinChange] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const token = localStorage.getItem("wop_token");
      const res = await fetch("/api/portal/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 503) {
          setError(errorData.error || "Not authenticated. Please log in to view your profile.");
        } else {
          throw new Error(errorData.error || "Failed to load profile");
        }
        return;
      }
      const data = await res.json();
      setProfile(data);
      setFormData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      const token = localStorage.getItem("wop_token");
      if (!token) {
        setError("Not authenticated. Please log in to update your profile.");
        return;
      }
      // TODO: Implement PUT /api/portal/me
      console.log("Save profile:", formData);
      setProfile({ ...profile, ...formData } as UserProfile);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function changePin() {
    if (pinChange.newPin !== pinChange.confirmPin) {
      setError("New PINs do not match");
      return;
    }
    if (pinChange.newPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    try {
      const token = localStorage.getItem("wop_token");
      if (!token) {
        setError("Not authenticated. Please log in to change your PIN.");
        setShowPinChange(false);
        return;
      }
      // TODO: Implement POST /api/portal/change-pin
      console.log("Change PIN");
      setShowPinChange(false);
      setPinChange({ oldPin: "", newPin: "", confirmPin: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change PIN");
    }
  }


      <div className="flex items-center justify-between mb-8 border-b border-[#3c3c3c] pb-4">
        <div className="flex items-center gap-6">
          <UiModeToggle uiMode={uiMode} onUiModeChange={setUiMode} />
          <h1 className="text-2xl font-bold text-[#cccccc]">User Profile</h1>
        </div>
        <button
          onClick={() => { window.location.pathname = "/"; }}
          className="rounded px-3 py-1.5 text-xs text-[#858585] hover:bg-[#3c3c3c]"
        >
          ← Back to App
        </button>
      </div>

      <div className="max-w-2xl mx-auto rounded-lg border border-[#3c3c3c] bg-[#252526] p-6">
        {!isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-[#585858]">Full Name</p>
                <p className="text-sm text-[#cccccc]">{profile.fullName || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-[#585858]">Username</p>
                <p className="text-sm text-[#cccccc]">{profile.username}</p>
              </div>
              <div>
                <p className="text-xs text-[#585858]">Email</p>
                <p className="text-sm text-[#cccccc]">{profile.email || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-[#585858]">Phone</p>
                <p className="text-sm text-[#cccccc]">{profile.phone || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-[#585858]">Role</p>
                <p className="text-sm text-[#ea580c]">{profile.role}</p>
              </div>
              <div>
                <p className="text-xs text-[#585858]">Job Title</p>
                <p className="text-sm text-[#cccccc]">{profile.jobTitle || "Not set"}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded bg-[#ea580c] px-4 py-2 text-sm font-medium text-white hover:bg-[#c2410c]"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowPinChange(!showPinChange)}
                className="rounded border border-[#ea580c] px-4 py-2 text-sm text-[#ea580c] hover:bg-[#ea580c] hover:text-white"
              >
                Change PIN
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#585858] mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName || ""}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#585858] mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#585858] mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveProfile}
                className="rounded bg-[#ea580c] px-4 py-2 text-sm font-medium text-white hover:bg-[#c2410c]"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded border border-[#3c3c3c] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#3c3c3c]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showPinChange && (
          <div className="mt-6 pt-6 border-t border-[#3c3c3c]">
            <h3 className="text-sm font-semibold text-[#cccccc] mb-4">Change PIN</h3>
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs text-[#585858] mb-1">Current PIN</label>
                <input
                  type="password"
                  value={pinChange.oldPin}
                  onChange={(e) => setPinChange({ ...pinChange, oldPin: e.target.value })}
                  maxLength={4}
                  className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#585858] mb-1">New PIN</label>
                <input
                  type="password"
                  value={pinChange.newPin}
                  onChange={(e) => setPinChange({ ...pinChange, newPin: e.target.value })}
                  maxLength={4}
                  className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#585858] mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={pinChange.confirmPin}
                  onChange={(e) => setPinChange({ ...pinChange, confirmPin: e.target.value })}
                  maxLength={4}
                  className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-sm text-[#cccccc] focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <button
                onClick={changePin}
                className="rounded bg-[#ea580c] px-4 py-2 text-sm font-medium text-white hover:bg-[#c2410c]"
              >
                Change PIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
