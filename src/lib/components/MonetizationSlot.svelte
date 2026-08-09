<script lang="ts">
	import type { MonetizationSlot as MonetizationSlotConfig } from '$lib/site-config';

	let { slot }: { slot: MonetizationSlotConfig } = $props();
	const visible = $derived(slot.mode !== 'none' && Boolean(slot.title && slot.body && slot.link.href));
</script>

{#if visible}
	<aside class="monetization-slot" aria-label={slot.label} data-monetization-mode={slot.mode}>
		<p class="monetization-slot-label">{slot.label}</p>
		<h2>{slot.title}</h2>
		<p>{slot.body}</p>
		<a href={slot.link.href} rel="noreferrer" target="_blank">{slot.link.label}</a>
	</aside>
{/if}
