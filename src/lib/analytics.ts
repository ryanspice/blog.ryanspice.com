import { env } from '$env/dynamic/public';

import { buildHeadSnippet, isExcludedPath, trackPageView as trackPageViewCore } from './analytics-core';

export const GA_MEASUREMENT_ID: string = (env.PUBLIC_GA_MEASUREMENT_ID ?? '').trim();

export function isAnalyticsEnabled(): boolean {
	return GA_MEASUREMENT_ID.length > 0;
}

export function isAnalyticsExcluded(path: string): boolean {
	return isExcludedPath(path);
}

export function analyticsHeadSnippet(): string {
	return buildHeadSnippet(GA_MEASUREMENT_ID);
}

export function trackPageView(path: string): void {
	trackPageViewCore(GA_MEASUREMENT_ID, path);
}
