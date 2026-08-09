<script lang="ts">
	import HomePage from '../../+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<HomePage {data} />
