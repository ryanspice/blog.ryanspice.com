<script lang="ts">
	import ArticlePage from '../../[slug]/+page.svelte';

	let { data } = $props();
</script>

<ArticlePage {data} />
