<script lang="ts">
	import { base } from '$app/paths';
	import type { MorningBrief } from '$lib/morning-briefs';

	type Props = {
		briefs: MorningBrief[];
		visibleBriefs: MorningBrief[];
		briefTags: string[];
		selectedTag: string;
		searchQuery: string;
	};

	let { briefs, visibleBriefs, briefTags, selectedTag, searchQuery }: Props = $props();
</script>

<form class="article-filter-bar" method="get" action="/briefs/">
	<label class="filter-field">
		<span>Search</span>
		<input type="text" name="q" value={searchQuery} placeholder="Focus, project, tag..." />
	</label>

	<label class="filter-field">
		<span>Tag</span>
		<select name="tag">
			<option value="" selected={!selectedTag}>All tags</option>
			{#each briefTags as tag, index (tag + ':' + index)}
				<option value={tag} selected={selectedTag === tag}>{tag}</option>
			{/each}
		</select>
	</label>

	<div class="filter-actions">
		<button type="submit">Update</button>
		<a class="home-filter-link" href="/briefs/">Reset</a>
	</div>
</form>

<section class="article-grid private-brief-grid" aria-label="Morning briefs">
	<div class="section-head">
		<p class="eyebrow">Private briefs</p>
		<h2>Morning brief archive</h2>
		<p class="section-dek">Readable only after owner sign-in. Newest briefs appear first.</p>
	</div>
	<p class="article-results-meta">Showing {visibleBriefs.length} of {briefs.length} briefs.</p>

	{#if visibleBriefs.length}
		{#each visibleBriefs as brief, index (brief.slug + ':' + index)}
			<a class="brief-card article-card-link" href={`${base}/briefs/${brief.slug}/`}>
				<p class="related-kicker"><time datetime={brief.date}>{brief.dateLabel}</time></p>
				<h3>{brief.title}</h3>
				<p>{brief.summary}</p>
				<div class="tag-row compact" aria-label={`${brief.title} tags`}>
					{#each brief.tags.slice(0, 6) as tag, tagIndex (tag + ':' + tagIndex)}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</a>
		{/each}
	{:else}
		<div class="article-empty">
			<p class="eyebrow">No matching briefs</p>
			<h2>Nothing matches the current filters.</h2>
			<p class="section-dek">Clear the search or tag filter to widen the list.</p>
		</div>
	{/if}
</section>
