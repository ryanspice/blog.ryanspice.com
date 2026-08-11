import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
	buildHeadSnippet,
	isExcludedPath,
	trackPageView
} from '../../src/lib/analytics-core';

describe('analytics core', () => {
	let fakeWindow: { dataLayer?: unknown[] };

	beforeEach(() => {
		fakeWindow = {};
		vi.stubGlobal('window', fakeWindow);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('excludes owner-only and protected routes from tracking', () => {
		for (const path of ['/drafts/', '/login/', '/auth/callback', '/status', '/briefs/', '/_protected/x/']) {
			expect(isExcludedPath(path), path).toBe(true);
		}
	});

	it('keeps public routes trackable', () => {
		for (const path of ['/', '/library/', '/dev-log/', '/2026/08/10/some-article/', '/rss-reader/']) {
			expect(isExcludedPath(path), path).toBe(false);
		}
	});

	it('emits no snippet for an empty measurement id', () => {
		expect(buildHeadSnippet('')).toBe('');
		expect(buildHeadSnippet('   ')).toBe('');
	});

	it('emits gtag loader and consent defaults for a real id', () => {
		const snippet = buildHeadSnippet('G-TEST123456');
		expect(snippet).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST123456');
		expect(snippet).toContain("gtag('config', 'G-TEST123456'");
		expect(snippet).toContain('analytics_storage');
		expect(snippet).toContain('url_passthrough');
	});

	it('covers the EEA/UK regions and guards owner-only paths in the inline snippet', () => {
		const snippet = buildHeadSnippet('G-TEST123456');
		for (const region of ['FR', 'DE', 'GB', 'CH']) {
			expect(snippet).toContain(`"${region}"`);
		}
		expect(snippet).toContain('drafts');
		expect(snippet).toContain('_protected');
	});

	it('pushes page views through the dataLayer for SPA navigations', () => {
		fakeWindow.dataLayer = [];
		trackPageView('G-TEST123456', '/2026/08/10/some-article/');
		expect(fakeWindow.dataLayer).toEqual([
			['config', 'G-TEST123456', { page_path: '/2026/08/10/some-article/' }]
		]);
	});

	it('never pushes for excluded paths or missing ids', () => {
		fakeWindow.dataLayer = [];
		trackPageView('G-TEST123456', '/drafts/');
		trackPageView('', '/');
		expect(fakeWindow.dataLayer).toEqual([]);
	});
});
