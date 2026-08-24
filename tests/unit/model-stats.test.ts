import { describe, expect, it } from 'vitest';
import { latestModelStats, normalizedModelStatsRows } from '$lib/model-stats';

describe('latest model stats', () => {
	it('loads the source-backed published snapshot', () => {
		expect(latestModelStats.updatedAt).toBe('2026-08-24');
		expect(latestModelStats.rows).toHaveLength(5);
		expect(latestModelStats.sources.length).toBeGreaterThan(0);
	});

	it('clamps chart values to the documented 0-100 scale', () => {
		expect(
			normalizedModelStatsRows([
				{ model: 'Example', capability: 120, productivity: -10 },
				{ model: 'Broken', capability: Number.NaN, productivity: Number.POSITIVE_INFINITY }
			])
		).toEqual([
			{ model: 'Example', capability: 100, productivity: 0 },
			{ model: 'Broken', capability: 0, productivity: 0 }
		]);
	});
});
