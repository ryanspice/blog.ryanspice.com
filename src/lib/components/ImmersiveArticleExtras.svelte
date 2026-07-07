<script lang="ts">
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import type { Article } from '$lib/articles';
	import type { DevLogEntry } from '$lib/dev-log';

	type Props = {
		relatedArticles: Article[];
		relatedDevLogEntries: DevLogEntry[];
		devLogArticleHref: (entry?: DevLogEntry) => string;
		devLogTagHref: (tag: string) => string;
		devLogSignalTags: (entry: DevLogEntry) => string[];
	};

	let {
		relatedArticles,
		relatedDevLogEntries,
		devLogArticleHref,
		devLogTagHref,
		devLogSignalTags
	}: Props = $props();
</script>

{#if relatedDevLogEntries.length}
	<section class="article-dev-log immersive-dev-log" aria-label="Article dev log">
		<div class="section-head">
			<p class="eyebrow">Dev log</p>
			<h2>How this got made</h2>
			<p class="section-dek">
				Public process notes linked to this article's research, implementation, and publishing tags.
			</p>
		</div>

		<div class="article-dev-log-grid">
			{#each relatedDevLogEntries as entry, index (entry.id + ':' + index)}
				<article class="article-dev-log-card" style:--article-accent={entry.accent}>
					<p class="dev-log-meta">
						<time datetime={entry.date}>{entry.dateLabel}</time>
						<span>{entry.source}</span>
					</p>
					<h3><a href={devLogArticleHref(entry)}>{entry.title}</a></h3>
					<p>{entry.summary}</p>
					<div class="tag-row compact" aria-label={`${entry.title} research tags`}>
						{#each devLogSignalTags(entry) as tag, tagIndex (tag + ':' + tagIndex)}
							<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
						{/each}
					</div>
				</article>
			{/each}
		</div>

		<a class="process-trail-link" href={devLogArticleHref()}>View filtered public dev log</a>
	</section>
{/if}

{#if relatedArticles.length}
	<section class="related-articles immersive-related" aria-label="Related articles">
		<div class="section-head">
			<p class="eyebrow">Related articles</p>
			<h2>More like this</h2>
		</div>

		<div class="related-articles-grid">
			{#each relatedArticles as related, index (related.slug + ':' + index)}
				<a
					class="related-article-card article-card-link"
					href={articleHref(related)}
					style:--article-accent={articleAccentColor(related)}
				>
					<p class="related-kicker">{related.draftType.replaceAll('-', ' ')}</p>
					<h3>{related.title}</h3>
					<p class="related-meta">
						<time datetime={related.date}>{related.dateLabel}</time>
						<span>{related.readingMinutes} min read</span>
					</p>
					<p>{related.summary}</p>
				</a>
			{/each}
		</div>
	</section>
{/if}
