<script lang="ts">
	import type { Article } from '$lib/articles';

	type Props = {
		article: Pick<Article, 'slug' | 'status' | 'releaseDate' | 'releaseDateLabel'>;
	};

	let { article }: Props = $props();
	let releaseDate = $state(article.releaseDate ?? '');
	let copied = $state(false);

	const frontmatterSnippet = $derived.by(() => {
		const status = releaseDate ? 'scheduled' : 'draft';
		const lines = [`status: "${status}"`];
		if (releaseDate) lines.push(`release_date: "${releaseDate}"`);
		return lines.join('\n');
	});

	async function copySnippet() {
		copied = false;
		await navigator.clipboard?.writeText(frontmatterSnippet);
		copied = true;
		window.setTimeout(() => {
			copied = false;
		}, 1800);
	}
</script>

<div class="draft-schedule-controls" aria-label={`Schedule controls for ${article.slug}`}>
	<label>
		<span>Release date</span>
		<input type="date" bind:value={releaseDate} />
	</label>

	<pre>{frontmatterSnippet}</pre>

	<div class="draft-schedule-actions">
		<button type="button" onclick={copySnippet}>Copy frontmatter</button>
		{#if copied}
			<span role="status">Copied</span>
		{/if}
	</div>

	<p>
		Set <code>status: "scheduled"</code> plus <code>release_date</code>. The daily GitHub workflow
		rebuilds and promotes it after that date.
	</p>
</div>

<style>
	.draft-schedule-controls {
		display: grid;
		gap: 10px;
		padding: 14px;
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 35%, transparent);
		border-radius: 18px;
		background: color-mix(in srgb, var(--article-accent, var(--accent)) 8%, transparent);
	}

	.draft-schedule-controls label {
		display: grid;
		gap: 6px;
		font-size: 0.86rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.draft-schedule-controls input {
		font: inherit;
		padding: 9px 10px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 35%, transparent);
		background: rgba(0, 0, 0, 0.22);
		color: inherit;
	}

	.draft-schedule-controls pre {
		margin: 0;
		padding: 10px;
		border-radius: 10px;
		overflow: auto;
		font-size: 0.83rem;
		background: rgba(0, 0, 0, 0.28);
	}

	.draft-schedule-actions {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.draft-schedule-actions button {
		border: 0;
		border-radius: 999px;
		padding: 9px 13px;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
		color: #071019;
		background: var(--article-accent, var(--accent));
	}

	.draft-schedule-controls p {
		margin: 0;
		font-size: 0.86rem;
		opacity: 0.8;
	}
</style>
