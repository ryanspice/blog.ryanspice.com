import { describe, expect, it } from 'vitest';
import { isMonetizationSlotVisible } from '../../src/lib/monetization';
import { siteConfigs } from '../../src/lib/site-config';

describe('publication monetization slots', () => {
	it('keeps Ryan free of an empty reader-visible slot', () => {
		expect(siteConfigs.ryan.monetization.mode).toBe('none');
	});

	it('configures one restrained Canopy house slot at article end', () => {
		const slot = siteConfigs.canopy.monetization;
		expect(slot.mode).toBe('house');
		expect(slot.position).toBe('article-end');
		expect(slot.title).toBeTruthy();
		expect(slot.body).toBeTruthy();
		expect(slot.link.href).toBe('https://canopydigital.ca/#contact');
	});

	it('does not activate display or affiliate advertising', () => {
		expect([siteConfigs.ryan.monetization.mode, siteConfigs.canopy.monetization.mode]).not.toContain('display');
		expect([siteConfigs.ryan.monetization.mode, siteConfigs.canopy.monetization.mode]).not.toContain('affiliate');
	});

	it.each(['none', 'house', 'display', 'affiliate'] as const)('renders only a complete %s slot', (mode) => {
		const slot = { ...siteConfigs.canopy.monetization, mode };
		expect(isMonetizationSlotVisible(slot)).toBe(mode !== 'none');
	});

	it('does not emit a visible shell when a configured slot is incomplete', () => {
		expect(
			isMonetizationSlotVisible({
				...siteConfigs.canopy.monetization,
				link: { label: '', href: '' }
			})
		).toBe(false);
	});
});
