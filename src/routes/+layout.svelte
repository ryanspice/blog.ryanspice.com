<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import '../app.css';

	onNavigate((navigation) => {
		if (typeof document.startViewTransition !== 'function') return;

		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	let { children, data } = $props();
</script>

<div class="site-shell" style={`--accent: ${data?.siteAccent ?? '#1e9bff'}`}>
	{@render children()}
</div>
