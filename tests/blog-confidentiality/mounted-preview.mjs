import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

// This modifies ONLY the isolated synthetic fixture workspace after its public
// build and PHP authorization tests. It never replaces the repository auth code.
export async function testMountedPreviews({ workspaceRoot, logRoot, viteBin, port, record }) {
	await fs.writeFile(path.join(workspaceRoot, 'src/lib/auth.ts'), `
import { writable } from 'svelte/store';
export type AuthState = { loading:boolean; available:boolean; authenticated:boolean;
 draftsAllowed:boolean; userName:string|null; userEmail:string|null; identityProvider:string|null;
 userRoles:string[]; loginHref:string; logoutHref:string; error:string|null };
const state:AuthState={loading:false,available:true,authenticated:true,draftsAllowed:true,
 userName:'Synthetic owner',userEmail:'fixture@example.invalid',identityProvider:'fixture',
 userRoles:[],loginHref:'/login/',logoutHref:'/',error:null};
export const authState=writable(state);
export const ownerAccessLabel='synthetic fixture owner';
export async function loadAuthState(){return state;}
export async function acquireOwnerAccessToken(){return 'synthetic-ui-token';}
export function canAccessDrafts(value:AuthState){return value.draftsAllowed;}
export function authLoginHref(){return '/login/';}
export async function trySignIn(){return null;}
export async function trySignOut(){return null;}
export function consumeAuthReturnTo(){return '/';}
export async function getMsalClient(){return null;}
`);
	const privateRoot = path.join(workspaceRoot, 'output/private-content');
	const article = JSON.parse(await fs.readFile(path.join(privateRoot,
		'articles/synthetic-private-confidentiality-draft.json'), 'utf8')).article;
	const brief = JSON.parse(await fs.readFile(path.join(privateRoot,
		'briefs/synthetic-private-brief.json'), 'utf8')).brief;
	const second = { ...article, slug: 'synthetic-second-private-draft',
		title: 'Second synthetic draft', html: '<p>SECOND_SYNTHETIC_BODY</p>' };
	const manifestEntry = (item) => ({ ...item, html: '', toc: [] });
	const base = `http://127.0.0.1:${port}`;
	// Dependencies are shared read-only with the isolated fixture. Restrict the
	// extra Vite file allowance to those dependencies, on this loopback server.
	const repoNodeModules = path.dirname(path.dirname(path.dirname(viteBin)));
	const uiConfig = path.join(workspaceRoot, 'vite-ui.config.mjs');
	await fs.writeFile(uiConfig, `import { mergeConfig } from 'vite';
import base from './vite.config.ts';
export default mergeConfig(base, { server: { fs: { allow: ${JSON.stringify([workspaceRoot, repoNodeModules])} } } });\n`);
	const fd = fsSync.openSync(path.join(logRoot, 'mounted-preview-vite.log'), 'w');
	const server = spawn(process.execPath, [viteBin, '--config', uiConfig, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
		cwd: workspaceRoot, windowsHide: true, stdio: ['ignore', fd, fd],
		env: { ...process.env, SVELTEKIT_OUTDIR: path.join(workspaceRoot, '.svelte-kit'),
			VITE_CACHE_DIR: path.join(workspaceRoot, 'output/.vite-ui'), PUBLIC_SITE_ID: 'ryan',
			PUBLIC_SITE_URL: 'https://blog.ryanspice.com' }
	});
	let browser;
	let page;
	const errors = [];
	let releaseSlow;
	try {
		await expect.poll(async () => {
			try { return (await fetch(base)).status; } catch { return 0; }
		}, { timeout: 45000 }).toBe(200);
		browser = await chromium.launch();
		const context = await browser.newContext();
		let slow = false;
		const slowGate = new Promise((resolve) => { releaseSlow = resolve; });
		let saveCount = 0;
		await context.route('**/*', async (route) => {
			const url = new URL(route.request().url());
			if (url.origin !== base) return route.abort();
			if (url.pathname === '/drafts/owner/private/') {
				if (route.request().headers().authorization !== 'Bearer synthetic-ui-token') {
					return route.fulfill({ status: 401, json: { ok: false } });
				}
				const slug = url.searchParams.get('slug');
				if (slow && slug === article.slug) await slowGate;
				const json = url.searchParams.get('kind') === 'briefs'
					? (slug ? { ok: true, brief } : { ok: true, briefs: [manifestEntry(brief)] })
					: (slug ? { ok: true, article: slug === second.slug ? second : article }
						: { ok: true, articles: [manifestEntry(article), manifestEntry(second)] });
				return route.fulfill({ json });
			}
			if (route.request().method() === 'POST' && url.pathname.startsWith('/drafts/')) {
				const ok = saveCount++ > 0;
				return route.fulfill({ status: ok ? 200 : 400, json: {
					type: ok ? 'success' : 'failure', status: ok ? 200 : 400,
					data: { metadataSave: { ok, message: ok ? 'Synthetic save accepted' : 'Synthetic save rejected' } }
				} });
			}
			return route.continue();
		});
		page = await context.newPage();
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(`${base}/drafts/`);
		await expect(page.locator(`a[href="/drafts/?slug=${article.slug}"]`).first()).toBeVisible();
		await page.evaluate(() => { window.__fixtureDocumentMarker = 7; });
		await page.locator(`a[href="/drafts/?slug=${article.slug}"]`).first().click();
		await expect(page.getByRole('button', { name: 'Save metadata', exact: true })).toBeVisible();
		record('mounted draft list to preview preserves document', await page.evaluate(() => window.__fixtureDocumentMarker) === 7);
		await page.getByRole('button', { name: 'Save metadata', exact: true }).click();
		await expect(page.getByText('Synthetic save rejected', { exact: true })).toBeVisible();
		record('mounted draft displays failed metadata save in place', new URL(page.url()).searchParams.get('slug') === article.slug);
		await page.getByRole('button', { name: 'Save metadata', exact: true }).click();
		await expect(page.getByText('Synthetic save accepted', { exact: true })).toBeVisible();
		record('mounted draft displays successful metadata save in place', true);
		await page.getByRole('link', { name: 'Back to drafts', exact: true }).click();
		await expect(page.locator(`a[href="/drafts/?slug=${second.slug}"]`).first()).toBeVisible();
		record('mounted draft preview to list clears body', await page.getByRole('button', { name: 'Save metadata', exact: true }).count() === 0);

		// A delayed old response must not replace a newer selection.
		slow = true;
		const oldResponse = page.waitForResponse((response) => response.url().includes(`private/?slug=${article.slug}`));
		await page.locator(`a[href="/drafts/?slug=${article.slug}"]`).first().click();
		await expect(page).toHaveURL(new RegExp(`slug=${article.slug}$`));
		await page.evaluate((href) => {
			const link = document.createElement('a'); link.href = href; link.id = 'fixture-next';
			link.textContent = 'Next synthetic selection'; document.body.append(link);
		}, `/drafts/?slug=${second.slug}`);
		await page.locator('#fixture-next').click();
		await expect(page.getByText('SECOND_SYNTHETIC_BODY', { exact: true })).toBeVisible();
		releaseSlow(); await oldResponse;
		await page.evaluate(() => new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		}));
		await expect(page.getByText('SECOND_SYNTHETIC_BODY', { exact: true })).toBeVisible();
		record('mounted draft ignores stale selection response', true);
		await page.getByRole('link', { name: 'Back to drafts', exact: true }).click();
		await page.evaluate(() => {
			const link = document.createElement('a'); link.href = '/drafts/?q=synthetic-query-filter';
			link.id = 'fixture-filter'; link.textContent = 'Synthetic filter'; document.body.append(link);
		});
		await page.locator('#fixture-filter').click();
		await expect(page.locator('input[name="q"]')).toHaveValue('synthetic-query-filter');
		record('mounted query navigation updates draft filters', true);

		await page.goto(`${base}/briefs/`);
		const briefLink = page.locator(`a[href="/briefs/?slug=${brief.slug}"]`).first();
		await expect(briefLink).toBeVisible(); await briefLink.click();
		await expect(page.getByRole('link', { name: 'Back to briefs', exact: true })).toBeVisible();
		record('mounted brief list to preview updates selection', true);
		await page.getByRole('link', { name: 'Back to briefs', exact: true }).click();
		await expect(page.locator(`a[href="/briefs/?slug=${brief.slug}"]`).first()).toBeVisible();
		record('mounted brief preview to list clears selection', await page.getByRole('link', { name: 'Back to briefs', exact: true }).count() === 0);
		await page.evaluate(() => {
			const link = document.createElement('a'); link.href = '/briefs/?q=synthetic-brief-filter';
			link.id = 'fixture-brief-filter'; link.textContent = 'Synthetic brief filter'; document.body.append(link);
		});
		await page.locator('#fixture-brief-filter').click();
		await expect(page.locator('input[name="q"]')).toHaveValue('synthetic-brief-filter');
		record('mounted query navigation updates brief filters', true);
		record('mounted preview pages have no runtime errors', errors.length === 0, { errors });
	} catch (error) {
		await fs.writeFile(path.join(logRoot, 'mounted-preview-failure.json'), JSON.stringify({
			url: page?.url(), errors, gateText: (await page?.locator('body').innerText())?.slice(0, 3000)
		}, null, 2));
		throw error;
	} finally {
		releaseSlow?.();
		await browser?.close();
		server.kill();
		await new Promise((resolve) => server.exitCode !== null ? resolve() : server.once('exit', resolve));
		fsSync.closeSync(fd);
	}
}
