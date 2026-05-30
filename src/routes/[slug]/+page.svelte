<script lang="ts">
	import ArticleView from '$lib/components/ArticleView.svelte';

	let { data } = $props();
</script>

<ArticleView article={data.article} />
