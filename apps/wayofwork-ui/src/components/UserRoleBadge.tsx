import { useUserRole } from "../hooks/useUserRole";

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-red-700 text-white",
  ADMIN: "bg-orange-600 text-white",
  LEADER: "bg-amber-600 text-white",
  WORKER: "bg-blue-700 text-white",
  CLIENT: "bg-green-700 text-white",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "SUPER",
  ADMIN: "ADMIN",
  LEADER: "LEADER",
  WORKER: "WORKER",
  CLIENT: "CLIENT",
};

export function UserRoleBadge() {
  const user = useUserRole();
  if (!user?.role) return null;

  const style = roleStyles[user.role] || "bg-zinc-600 text-white";
  const label = roleLabels[user.role] || user.role;

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style}`}
      title={`Role: ${user.role} · ID: ${user.id}`}
    >
      {label}
    </span>
  );
}
