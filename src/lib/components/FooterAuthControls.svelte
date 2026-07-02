<script lang="ts">
	import { authLoginHref, authState, loadAuthState, trySignIn, trySignOut } from '$lib/auth';

	type Props = {
		returnTo?: string;
	};

	let { returnTo = '/' }: Props = $props();
	let busy = $state(false);
	let actionError = $state('');
	let mounted = $state(false);
	let authInitialized = $state(false);
	const loginHref = $derived(authLoginHref(returnTo));

	$effect(() => {
		if (authInitialized) return;
		authInitialized = true;
		mounted = true;
		void loadAuthState();
	});

	async function handleAction() {
		if (busy) return;
		busy = true;
		actionError = '';

		try {
			if ($authState.authenticated && $authState.draftsAllowed) {
				actionError = (await trySignOut()) ?? '';
			} else {
				actionError = (await trySignIn(returnTo)) ?? '';
			}
		} finally {
			busy = false;
		}
	}
</script>

<div class="footer-auth" aria-label="Private access actions">
	{#if !mounted}
		<a class="footer-auth-link" href={loginHref}>Sign in with Microsoft</a>
	{:else if $authState.loading}
		<span class="footer-auth-state">Checking access</span>
	{:else}
		<button
			type="button"
			class="footer-auth-link"
			onclick={handleAction}
			disabled={busy || (!$authState.available && !$authState.authenticated)}
		>
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
{#if actionError || $authState.error}
	<p class="footer-auth-error" role="status">{actionError || $authState.error}</p>
{/if}
