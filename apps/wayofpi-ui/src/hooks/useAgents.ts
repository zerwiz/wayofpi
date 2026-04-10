import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface AgentMeta {
	name: string;
	description: string;
	tools: string;
	skills: string;
	relativePath: string;
}

export interface AgentsResponse {
	agents: AgentMeta[];
	teams: Record<string, string[]>;
	teamsPath: string | null;
}

export function useAgents() {
	const [data, setData] = useState<AgentsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		apiGet<AgentsResponse>("/api/agents")
			.then(setData)
			.catch((e) => setError(e instanceof Error ? e.message : String(e)))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		reload();
	}, [reload]);

	return { data, loading, error, reload };
}
