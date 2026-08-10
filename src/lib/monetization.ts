import type { MonetizationSlot } from '$lib/site-config';

export function isMonetizationSlotVisible(slot: MonetizationSlot): boolean {
	return slot.mode !== 'none' && Boolean(slot.title && slot.body && slot.link.href && slot.link.label);
}
