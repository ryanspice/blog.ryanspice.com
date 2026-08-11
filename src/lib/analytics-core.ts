export const EEA_REGIONS = [
	'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
	'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO',
	'SK', 'SI', 'ES', 'SE', 'CH', 'GB'
];

export const EXCLUDED_PATHS = ['/drafts/', '/login/', '/auth/', '/status', '/briefs/', '/_protected/'];

export function isExcludedPath(path: string): boolean {
	return EXCLUDED_PATHS.some((prefix) => path.startsWith(prefix));
}

export function buildHeadSnippet(measurementId: string): string {
	const id = measurementId.trim();
	if (!id) return '';
	const regions = JSON.stringify(EEA_REGIONS);
	return [
		`<script>`,
		`window.dataLayer = window.dataLayer || [];`,
		`function gtag(){dataLayer.push(arguments);}`,
		`gtag('js', new Date());`,
		`gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 }, { regions: ${regions} });`,
		`gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });`,
		`gtag('set', 'url_passthrough', true);`,
		`if (!/^\\/(drafts|login|auth|status|briefs|_protected)/.test(window.location.pathname)) {`,
		`  gtag('config', '${id}', { page_path: window.location.pathname });`,
		`}`,
		`</script>`,
		`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`
	].join('\n');
}

export function trackPageView(measurementId: string, path: string): void {
	const id = measurementId.trim();
	if (!id || isExcludedPath(path) || typeof window === 'undefined') return;
	window.dataLayer = window.dataLayer ?? [];
	window.dataLayer.push(['config', id, { page_path: path }]);
}
