<script lang="ts">
	import { onMount } from 'svelte';
	import { authState, loadAuthState, signIn, signOut } from '$lib/auth';

	type Props = {
		returnTo?: string;
	};

	let { returnTo = '/' }: Props = $props();
	let busy = $state(false);

	onMount(() => {
		void loadAuthState();
	});

	async function handleAction() {
		if (busy) return;
		busy = true;

		try {
			if ($authState.authenticated && $authState.draftsAllowed) {
				await signOut();
			} else {
				await signIn(returnTo);
			}
		} finally {
			busy = false;
		}
	}
</script>

<div class="footer-auth" aria-label="Private access actions">
	{#if $authState.loading}
		<span class="footer-auth-state">Checking access</span>
	{:else}
		<button type="button" class="footer-auth-link" onclick={handleAction} disabled={busy}>
			{busy
				? $authState.authenticated && $authState.draftsAllowed
					? 'Logging out…'
					: 'Opening Microsoft…'
				: $authState.authenticated
					? $authState.draftsAllowed
						? 'Logout'
						: 'Try another account'
					: 'Sign in with Microsoft'}
		</button>
	{/if}
</div>
