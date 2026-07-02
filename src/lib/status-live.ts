export type LiveStatus = {
	ok: boolean;
	serverTimeUtc?: string;
	releases?: { count: number; latest?: string | null };
	backups?: { count: number; latest?: string | null; totalBytes?: number };
	error?: string;
};

export async function fetchLiveStatus(endpoint: string): Promise<LiveStatus> {
	const response = await fetch(endpoint, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Live status unavailable (${response.status})`);
	}
	return (await response.json()) as LiveStatus;
}
