import { describe, expect, it } from 'vitest';

import { siteConfigs } from '../../src/lib/site-config';

describe('site config', () => {
	it('keeps the research library public on the Canopy blog build', () => {
		const canopy = siteConfigs.canopy;

		expect(canopy.showLibraryLinks).toBe(true);
		expect(canopy.indexedUtilityRoutes).toContainEqual({
			path: '/library/',
			changefreq: 'monthly',
			priority: 0.6
		});
		expect(canopy.robotsDisallow).not.toContain('/library/');
		expect(canopy.publicRouteExclusions).not.toContain('library');
	});
});
