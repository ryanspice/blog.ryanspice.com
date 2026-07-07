<script lang="ts">
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import type { Article } from '$lib/articles';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import DraftScheduleControls from '$lib/components/DraftScheduleControls.svelte';

	type Props = {
		draftArticles: Article[];
		visibleDrafts: Article[];
		draftArticleTags: string[];
		selectedTag: string;
		searchQuery: string;
	};

	let { draftArticles, visibleDrafts, draftArticleTags, selectedTag, searchQuery }: Props = $props();
</script>

<form class="article-filter-bar" method="get" action="/drafts/">
	<label class="filter-field">
		<span>Search</span>
		<input type="text" name="q" value={searchQuery} placeholder="Title, summary, tag..." />
	</label>

	<label class="filter-field">
		<span>Tag</span>
		<select name="tag">
			<option value="" selected={!selectedTag}>All tags</option>
			{#each draftArticleTags as tag, index (tag + ':' + index)}
				<option value={tag} selected={selectedTag === tag}>{tag}</option>
			{/each}
		</select>
	</label>

	<div class="filter-actions">
		<button type="submit">Update</button>
		<a class="home-filter-link" href="/drafts/">Reset</a>
	</div>
</form>

<section class="draft-schedule-primer" aria-label="Scheduling instructions">
	<p class="eyebrow">Release scheduling</p>
	<h2>Schedule a draft with frontmatter.</h2>
	<p>
		Use the date control on any draft below, copy the generated frontmatter, paste it into that
		article, and commit. The daily deploy promotes it once the release date is reached.
	</p>
</section>

<style>
	.draft-item {
		display: grid;
		gap: 12px;
	}

	.draft-schedule-primer {
		max-width: min(1120px, calc(100vw - 32px));
		margin: 0 auto 22px;
		padding: 18px;
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
	}

	.draft-schedule-primer h2,
	.draft-schedule-primer p {
		margin: 0;
	}

	.draft-schedule-primer h2 {
		margin-top: 4px;
	}

	.draft-schedule-primer p:not(.eyebrow) {
		margin-top: 8px;
		opacity: 0.82;
	}
</style>

<section id="drafts" class="article-grid" aria-label="Draft articles">
	<div class="section-head">
		<p class="eyebrow">Draft queue</p>
		<h2>Unpublished articles</h2>
		<p class="section-dek">Newest drafts first, with release dates and publish state visible for quick review.</p>
	</div>
	<p class="article-results-meta">Showing {visibleDrafts.length} of {draftArticles.length} drafts.</p>

	{#if visibleDrafts.length}
		{#each visibleDrafts as article, index (article.slug + ':' + index)}
			<div class="draft-item" style:--article-accent={articleAccentColor(article)}>
				<ArticleCard {article} href={articleHref(article)} />
				<DraftScheduleControls {article} />
			</div>
		{/each}
	{:else}
		<div class="article-empty">
			<p class="eyebrow">{draftArticles.length ? 'No matching drafts' : 'No drafts'}</p>
			<h2>{draftArticles.length ? 'Nothing matches the current filters.' : 'The queue is empty.'}</h2>
			<p class="section-dek">
				{draftArticles.length
					? 'Clear the tag or search field to widen the draft list.'
					: 'Add a draft article under src/lib/content/articles to populate this page.'}
			</p>
		</div>
	{/if}
</section>
