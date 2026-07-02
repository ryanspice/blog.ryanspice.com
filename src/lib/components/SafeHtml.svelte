<script lang="ts">
	import type { SafeHtml } from '$lib/safe-html';

	type SafeHtmlElement = 'article' | 'div' | 'p' | 'span';

	type Props = {
		html: SafeHtml;
		as?: SafeHtmlElement;
		class?: string;
		id?: string;
	};

	let { html, as = 'div', class: className = undefined, id = undefined }: Props = $props();
</script>

<svelte:element this={as} class={className} {id}>{@html html}</svelte:element>
