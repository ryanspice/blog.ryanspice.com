import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	PublicClientApplication,
	type AccountInfo,
	type Configuration,
	type EndSessionRequest,
	type RedirectRequest
} from '@azure/msal-browser';

export type AuthState = {
	loading: boolean;
	available: boolean;
	authenticated: boolean;
	draftsAllowed: boolean;
	userName: string | null;
	userEmail: string | null;
	identityProvider: string | null;
	userRoles: string[];
	loginHref: string;
	logoutHref: string;
	error: string | null;
};

const storageKey = 'blog-auth-return-to';
const draftsAccessEmail = 'spice.ryan@hotmail.com';

export const msalClientId = normalizeValue(import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined);
export const msalTenantId = normalizeValue(import.meta.env.VITE_MSAL_TENANT_ID as string | undefined) || 'common';
export const msalAuthority = `https://login.microsoftonline.com/${msalTenantId}`;
export const msalScopes = ['User.Read'];

const initialState: AuthState = {
	loading: true,
	available: false,
	authenticated: false,
	draftsAllowed: false,
	userName: null,
	userEmail: null,
	identityProvider: null,
	userRoles: [],
	loginHref: authLoginHref('/drafts/'),
	logoutHref: authLogoutHref('/'),
	error: null
};

export const authState = writable<AuthState>(initialState);

let client: PublicClientApplication | undefined;
let initPromise: Promise<PublicClientApplication> | null = null;
let statePromise: Promise<AuthState> | null = null;

function createConfig(): Configuration {
	assertClientConfig();

	return {
		auth: {
			clientId: msalClientId!,
			authority: msalAuthority,
			redirectUri: getMsalRedirectUri(),
			postLogoutRedirectUri: browser ? getMsalRedirectUri() : 'http://localhost:5173/auth/callback'
		},
		cache: {
			cacheLocation: 'localStorage'
		}
	};
}

export function assertClientConfig(): void {
	if (!msalClientId || msalClientId.includes('00000000-0000')) {
		throw new Error(
			'Missing VITE_MSAL_CLIENT_ID. Add your Microsoft Entra app client ID to .env and restart the dev server.'
		);
	}
}

export async function getMsalClient(): Promise<PublicClientApplication> {
	if (!browser) {
		throw new Error('MSAL browser client can only run in the browser.');
	}

	if (client) return client;

	if (!initPromise) {
		client = new PublicClientApplication(createConfig());
		initPromise = client.initialize().then(() => client!);
	}

	return initPromise;
}

export async function loadAuthState(): Promise<AuthState> {
	if (!browser) {
		const next = buildUnauthenticatedState(false, 'Browser auth state is only available on the client.');
		authState.set(next);
		return next;
	}

	if (!statePromise) {
		statePromise = refreshAuthState().finally(() => {
			statePromise = null;
		});
	}

	return statePromise;
}

export async function refreshAuthState(): Promise<AuthState> {
	authState.update((state) => ({
		...state,
		loading: true,
		error: null
	}));

	try {
		if (!msalClientId) {
			const next = buildUnauthenticatedState(
				false,
				'Missing VITE_MSAL_CLIENT_ID. Copy .env.example to .env and add your Microsoft Entra client ID.'
			);
			authState.set(next);
			return next;
		}

		const app = await getMsalClient();
		const result = await app.handleRedirectPromise();

		if (result?.account) {
			app.setActiveAccount(result.account);
		} else {
			const existing = getActiveAccount(app);
			if (existing) app.setActiveAccount(existing);
		}

		const activeAccount = getActiveAccount(app);
		const next = activeAccount ? buildAuthenticatedState(activeAccount) : buildUnauthenticatedState(true);
		authState.set(next);
		return next;
	} catch (error_) {
		const next = buildUnauthenticatedState(true, errorMessage(error_));
		authState.set(next);
		return next;
	}
}

export function authLoginHref(returnTo = '/drafts/'): string {
	const target = normalizeReturnTo(returnTo, '/drafts/');
	return `/login?returnTo=${encodeURIComponent(target)}`;
}

export function authLogoutHref(returnTo = '/'): string {
	const target = normalizeReturnTo(returnTo, '/');
	return target;
}

export function canAccessDrafts(state: Pick<AuthState, 'authenticated' | 'draftsAllowed'>): boolean {
	return state.authenticated && state.draftsAllowed;
}

export function rememberAuthReturnTo(returnTo: string): void {
	if (!browser) return;
	window.sessionStorage.setItem(storageKey, normalizeReturnTo(returnTo, '/'));
}

export function consumeAuthReturnTo(defaultReturnTo = '/'): string {
	if (!browser) return normalizeReturnTo(defaultReturnTo, '/');

	const stored = window.sessionStorage.getItem(storageKey);
	window.sessionStorage.removeItem(storageKey);
	return normalizeReturnTo(stored ?? defaultReturnTo, defaultReturnTo);
}

export async function signIn(returnTo = '/drafts/'): Promise<void> {
	rememberAuthReturnTo(returnTo);
	const app = await getMsalClient();
	const request: RedirectRequest = {
		scopes: [...msalScopes],
		redirectUri: getMsalRedirectUri(),
		prompt: 'select_account'
	};

	await app.loginRedirect(request);
}

export async function signOut(): Promise<void> {
	const app = await getMsalClient();
	const account = getActiveAccount(app);
	rememberAuthReturnTo('/');
	const request: EndSessionRequest = {
		account: account ?? undefined,
		postLogoutRedirectUri: getMsalRedirectUri()
	};

	await app.logoutRedirect(request);
}

export function getActiveAccount(app?: PublicClientApplication): AccountInfo | null {
	if (!app) return null;
	return app.getActiveAccount() ?? app.getAllAccounts()[0] ?? null;
}

function buildAuthenticatedState(account: AccountInfo): AuthState {
	const userEmail = account.username?.trim() || null;
	return {
		loading: false,
		available: true,
		authenticated: true,
		draftsAllowed: canAccessDraftMailbox(userEmail),
		userName: account.name?.trim() || account.username?.trim() || null,
		userEmail,
		identityProvider: account.environment || account.tenantId || 'Microsoft',
		userRoles: extractRoles(account),
		loginHref: authLoginHref('/drafts/'),
		logoutHref: authLogoutHref('/'),
		error: null
	};
}

function buildUnauthenticatedState(available: boolean, error: string | null = null): AuthState {
	return {
		loading: false,
		available,
		authenticated: false,
		draftsAllowed: false,
		userName: null,
		userEmail: null,
		identityProvider: null,
		userRoles: [],
		loginHref: authLoginHref('/drafts/'),
		logoutHref: authLogoutHref('/'),
		error
	};
}

function extractRoles(account: AccountInfo): string[] {
	const claims = account.idTokenClaims as { roles?: unknown; groups?: unknown } | null | undefined;
	const roles = Array.isArray(claims?.roles) ? claims.roles.map((role) => String(role)).filter(Boolean) : [];
	return roles;
}

function normalizeReturnTo(value: string | null | undefined, fallback: string): string {
	const target = (value ?? '').trim();
	if (!target) return fallback;
	if (!target.startsWith('/')) return fallback;
	if (target.startsWith('//')) return fallback;
	return target;
}

function normalizeValue(value: string | undefined): string {
	return typeof value === 'string' ? value.trim() : '';
}

function canAccessDraftMailbox(email: string | null): boolean {
	return normalizeEmail(email) === normalizeEmail(draftsAccessEmail);
}

function normalizeEmail(value: string | null): string {
	return (value ?? '').trim().toLowerCase();
}

function getMsalRedirectUri(): string {
	const configured = normalizeValue(import.meta.env.VITE_MSAL_REDIRECT_URI as string | undefined);
	if (configured) return configured;
	if (browser) return `${window.location.origin}/auth/callback`;
	return 'http://localhost:5173/auth/callback';
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return 'Microsoft sign-in failed.';
}
