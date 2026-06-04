<script lang="ts">
	import { page } from '$app/state';
	import type { Article } from '$lib/articles';
	import { base } from '$app/paths';

	type Props = { article: Article };
	let { article }: Props = $props();

	const diffLines = $derived(computeDiff(article.previousBody ?? '', article.body));

	const fromUrl = $derived(`${base}/${article.slug}?version=${article.previousVersion ?? '1.0.0'}`);
	const toUrl = $derived(`${base}/${article.slug}?version=${article.version}`);
	const noDiffUrl = $derived(`${base}/${article.slug}`);

	const addedLines = $derived(diffLines.filter(l => l.kind === 'add').length);
	const removedLines = $derived(diffLines.filter(l => l.kind === 'remove').length);
	const unchangedLines = $derived(diffLines.filter(l => l.kind === 'same').length);

	function computeDiff(before: string, after: string): { kind: 'same' | 'add' | 'remove'; text: string; lineA: number; lineB: number }[] {
		const linesA = before.split('\n');
		const linesB = after.split('\n');
		const result: { kind: 'same' | 'add' | 'remove'; text: string; lineA: number; lineB: number }[] = [];

		// Simple LCS-based line diff
		const dp: number[][] = Array.from({ length: linesA.length + 1 }, () => Array(linesB.length + 1).fill(0));
		for (let i = 1; i <= linesA.length; i++) {
			for (let j = 1; j <= linesB.length; j++) {
				dp[i][j] = linesA[i - 1] === linesB[j - 1]
					? dp[i - 1][j - 1] + 1
					: Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}

		// Backtrack
		let i = linesA.length, j = linesB.length;
		const stack: { kind: 'same' | 'add' | 'remove'; text: string; lineA: number; lineB: number }[] = [];

		while (i > 0 || j > 0) {
			if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
				stack.push({ kind: 'same', text: linesA[i - 1], lineA: i, lineB: j });
				i--; j--;
			} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
				stack.push({ kind: 'add', text: linesB[j - 1], lineA: 0, lineB: j });
				j--;
			} else if (i > 0) {
				stack.push({ kind: 'remove', text: linesA[i - 1], lineA: i, lineB: 0 });
				i--;
			}
		}

		// Reverse to chronological order
		result.push(...stack.reverse());
		return result;
	}

	function escHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
</script>

<svelte:head>
	<title>Diff: {article.title} v{article.version} · blog.ryanspice.com</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="diff-page">
	<header class="diff-header">
		<a href={noDiffUrl} class="diff-back">&larr; Back to article</a>
		<h1>Article Diff: {article.title}</h1>
		<div class="diff-meta">
			<span class="diff-version">From <strong>v{article.previousVersion ?? '—'}</strong> to <strong>v{article.version}</strong></span>
			<span class="diff-stats">
				<span class="stat-add">+{addedLines} added</span>
				<span class="stat-remove">&minus;{removedLines} removed</span>
				<span class="stat-same">{unchangedLines} unchanged</span>
			</span>
		</div>
		<div class="diff-links">
			<a href={fromUrl}>View v{article.previousVersion ?? '—'}</a>
			<a href={toUrl}>View v{article.version}</a>
		</div>
	</header>

	<div class="diff-body">
		{#each diffLines as line, i (i)}
			{@const lineNum = i + 1}
			<div class="diff-line diff-{line.kind}">
				<span class="diff-gutter">{line.lineA || ''}</span>
				<span class="diff-gutter">{line.lineB || ''}</span>
				<span class="diff-marker">{line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}</span>
				<span class="diff-text">{@html escHtml(line.text) || ' '}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.diff-page {
		max-width: 960px;
		margin: 0 auto;
		padding: 24px 16px 64px;
		font-family: 'Fira Code', 'SFMono-Regular', Consolas, monospace;
		font-size: 13px;
		line-height: 1.55;
		color: #e2e8f0;
		background: #0f172a;
		min-height: 100vh;
	}
	.diff-header {
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.diff-back {
		color: #53b8ff;
		font-size: 14px;
		text-decoration: none;
	}
	.diff-back:hover { text-decoration: underline; }
	.diff-header h1 {
		margin: 8px 0;
		font-size: 20px;
		font-weight: 700;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}
	.diff-meta {
		display: flex;
		gap: 24px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 8px;
		font-size: 13px;
	}
	.diff-version { color: #94a3b8; }
	.diff-stats { display: flex; gap: 12px; }
	.stat-add { color: #4ade80; }
	.stat-remove { color: #f87171; }
	.stat-same { color: #64748b; }
	.diff-links { display: flex; gap: 12px; }
	.diff-links a {
		color: #53b8ff;
		font-size: 12px;
		text-decoration: none;
	}
	.diff-links a:hover { text-decoration: underline; }
	.diff-body {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		overflow: hidden;
	}
	.diff-line {
		display: flex;
		gap: 0;
		padding: 0;
		min-height: 21px;
	}
	.diff-same { background: transparent; }
	.diff-add { background: rgba(74, 222, 128, 0.08); }
	.diff-remove { background: rgba(248, 113, 113, 0.08); }
	.diff-gutter {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		width: 40px;
		padding: 0 8px;
		color: #475569;
		font-size: 11px;
		user-select: none;
		text-align: right;
	}
	.diff-marker {
		display: inline-flex;
		align-items: center;
		width: 20px;
		color: #64748b;
		font-weight: 700;
		user-select: none;
	}
	.diff-add .diff-marker { color: #4ade80; }
	.diff-remove .diff-marker { color: #f87171; }
	.diff-text {
		flex: 1;
		white-space: pre-wrap;
		word-break: break-word;
		padding: 0 4px;
	}
	.diff-add .diff-text { color: #bbf7d0; }
	.diff-remove .diff-text { color: #fecaca; }
</style>
