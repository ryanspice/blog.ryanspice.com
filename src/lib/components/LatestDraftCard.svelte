<script lang="ts">
	import { articleHref } from '$lib/article-links';
	import type { Article } from '$lib/articles';

	type Props = {
		latestDraft: Article | null;
		accent: string;
	};

	let { latestDraft, accent }: Props = $props();
</script>

<aside class="hero-card home-hero-card" aria-label="Latest draft" style:--article-accent={accent}>
	<strong>Latest draft</strong>
	{#if latestDraft}
		<h2><a href={articleHref(latestDraft)}>{latestDraft.title}</a></h2>
		<p>{latestDraft.summary}</p>
		<dl class="hero-meta" aria-label="Latest draft metadata">
			<div>
				<dt>Updated</dt>
				<dd><time datetime={latestDraft.date}>{latestDraft.dateLabel}</time></dd>
			</div>
			<div>
				<dt>Read time</dt>
				<dd>{latestDraft.readingMinutes} min</dd>
			</div>
			<div>
				<dt>State</dt>
				<dd>{latestDraft.releaseDateLabel ? 'Scheduled' : 'Draft'}</dd>
			</div>
		</dl>
		{#if latestDraft.releaseDateLabel}
			<p class="home-hero-note">Scheduled release: {latestDraft.releaseDateLabel}</p>
		{/if}
	{:else}
		<p>No drafts yet.</p>
	{/if}
</aside>
