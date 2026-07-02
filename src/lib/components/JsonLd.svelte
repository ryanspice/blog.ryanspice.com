<script lang="ts">
	import { jsonLdScriptText } from '$lib/safe-html';

	type Props = {
		value: unknown;
	};

	let { value }: Props = $props();
	const text = $derived(jsonLdScriptText(value));
</script>

<svelte:head>
	<script type="application/ld+json">{text}</script>
</svelte:head>
