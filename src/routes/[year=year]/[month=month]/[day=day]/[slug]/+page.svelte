<script lang="ts">
	import ArticleRoutePage from '../../../../[slug]/+page.svelte';

	let { data } = $props();
</script>

<ArticleRoutePage {data} />
