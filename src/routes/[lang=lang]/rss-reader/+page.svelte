<script lang="ts">
	import RssReaderPage from '../../rss-reader/+page.svelte';

	let { data } = $props();
</script>

<RssReaderPage {data} />
