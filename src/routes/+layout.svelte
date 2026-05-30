<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="site-shell">
	{@render children()}
</div>
