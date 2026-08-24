import rawSnapshot from '$lib/data/latest-model-stats.json';

export type ModelStatsRow = {
	model: string;
	capability: number;
	productivity: number;
	note?: string;
};

export type ModelStatsSource = {
	label: string;
	href: string;
};

export type LatestModelStatsSnapshot = {
	title: string;
	updatedAt: string | null;
	methodology: string;
	rows: ModelStatsRow[];
	sources: ModelStatsSource[];
};

export const latestModelStats = rawSnapshot as LatestModelStatsSnapshot;

export function clampModelStat(value: number): number {
	return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function normalizedModelStatsRows(rows: ModelStatsRow[]): Array<ModelStatsRow & { capability: number; productivity: number }> {
	return rows.map((row) => ({
		...row,
		capability: clampModelStat(row.capability),
		productivity: clampModelStat(row.productivity)
	}));
}
