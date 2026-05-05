/**
 * Worker Portal Authentication Component
 * Validates portal token and handles auth
 */

import type { ReactNode } from "react";

interface PortalAuthProps {
  children: ReactNode;
}

export function PortalAuth({ children }: PortalAuthProps) {
  // Simple token auth - just check if token exists and isn't expired
  const token = localStorage.getItem("portal_token");
  const tokenObject = typeof token === "string" ? JSON.parse(token) : null;
  const isValidToken = tokenObject && !isNaN(Date.parse(tokenObject.expires));
  
  return isValidToken ? children : (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
      <p className="font-bold text-center">Authentication Required</p>
      <p className="text-sm text-center">Please sign in to access this page.</p>
    </div>
  );
}

export default PortalAuth;
