<script lang="ts">
	import '../app.css';

	let { children, data } = $props();
</script>

<div class="site-shell" style={`--accent: ${data?.siteAccent ?? '#1e9bff'}`}>
	{@render children()}
</div>
