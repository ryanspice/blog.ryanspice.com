<script lang="ts">
	import { base } from '$app/paths';
	import { tick } from 'svelte';
	import { acquireOwnerAccessToken } from '$lib/auth';
	import { articleAccentColor } from '$lib/article-accent';
	import type { Article } from '$lib/articles';

	type MetadataSaveState = {
		ok: boolean;
		message: string;
		fileName?: string;
	};

	type Props = {
		article: Article;
		form?: {
			metadataSave?: MetadataSaveState;
		} | null;
	};

	let { article, form = null }: Props = $props();

	let ownerToken = $state('');
	let clientError = $state<string | null>(null);
	let submitting = $state(false);

	const publishDate = $derived(article.releaseDate ?? article.date);
	const publishTime = $derived(article.releaseTime ?? '08:15');
	const accent = $derived(articleAccentColor(article));
	const focal = $derived(article.visuals.focal);
	const row = $derived(article.visuals.row);
	const background = $derived(article.visuals.background);
	const saveState = $derived(form?.metadataSave ?? null);
	const unsplashHref = $derived(
		`https://unsplash.com/s/photos/${encodeURIComponent(article.tags[0] ?? article.title)}`
	);
	const actionHref = $derived(`${base}/drafts/${article.slug}/?/save`);

	async function handleSubmit(event: SubmitEvent) {
		if (ownerToken) return;
		event.preventDefault();

		const formElement = event.currentTarget as HTMLFormElement;
		if (!formElement.checkValidity()) {
			formElement.reportValidity();
			return;
		}

		clientError = null;
		submitting = true;

		try {
			ownerToken = await acquireOwnerAccessToken();
			await tick();
			formElement.requestSubmit();
		} catch (error_) {
			clientError = error_ instanceof Error ? error_.message : 'Unable to acquire Microsoft owner token.';
			submitting = false;
			ownerToken = '';
		}
	}
</script>

<form class="draft-metadata-controls" method="POST" action={actionHref} onsubmit={handleSubmit}>
	<input type="hidden" name="owner_token" value={ownerToken} />

	<div class="draft-controls-head">
		<div>
			<p class="eyebrow">Draft metadata</p>
			<h3>Schedule, colour, and article imagery</h3>
		</div>
		<a href={unsplashHref} target="_blank" rel="noreferrer">Find topical images</a>
	</div>

	<div class="draft-control-grid">
		<label>
			<span>Status</span>
			<select name="status">
				<option value="draft" selected={article.status === 'draft'}>Draft</option>
				<option value="scheduled" selected={article.status === 'scheduled'}>Scheduled</option>
				<option value="published" selected={article.status === 'published'}>Published</option>
			</select>
		</label>

		<label>
			<span>Publish date</span>
			<input name="publish_date" type="date" value={publishDate} />
		</label>

		<label>
			<span>Publish time</span>
			<input name="publish_time" type="time" value={publishTime} />
		</label>

		<label>
			<span>Accent</span>
			<input name="accent" type="color" value={accent.startsWith('#') ? accent : '#1e9bff'} />
		</label>
	</div>

	<details class="draft-visual-fields">
		<summary>Visual metadata</summary>

		<div class="draft-control-grid">
			<label class="wide">
				<span>Focal image</span>
				<input name="image" type="text" value={focal?.src ?? ''} placeholder="/img/articles/slug/focal.webp or https://..." />
			</label>
			<label class="wide">
				<span>Focal alt</span>
				<input name="image_alt" type="text" value={focal?.alt ?? ''} placeholder="Describe the image for screen readers" />
			</label>
			<label>
				<span>Focal credit</span>
				<input name="image_credit" type="text" value={focal?.credit ?? ''} placeholder="Unsplash / photographer" />
			</label>
			<label>
				<span>Focal source</span>
				<input name="image_source" type="url" value={focal?.sourceHref ?? ''} placeholder="https://..." />
			</label>
			<label>
				<span>Focal position</span>
				<input name="image_position" type="text" value={focal?.position ?? ''} placeholder="center center" />
			</label>

			<label class="wide">
				<span>Row card image</span>
				<input name="row_image" type="text" value={row?.src ?? ''} placeholder="Optional row-card override" />
			</label>
			<label>
				<span>Row alt</span>
				<input name="row_image_alt" type="text" value={row?.alt ?? ''} />
			</label>
			<label>
				<span>Row credit</span>
				<input name="row_image_credit" type="text" value={row?.credit ?? ''} />
			</label>
			<label>
				<span>Row source</span>
				<input name="row_image_source" type="url" value={row?.sourceHref ?? ''} />
			</label>
			<label>
				<span>Row position</span>
				<input name="row_image_position" type="text" value={row?.position ?? ''} placeholder="center 48%" />
			</label>

			<label class="wide">
				<span>Article background</span>
				<input name="background_image" type="text" value={background?.src ?? ''} placeholder="Optional article background override" />
			</label>
			<label>
				<span>Background alt</span>
				<input name="background_image_alt" type="text" value={background?.alt ?? ''} />
			</label>
			<label>
				<span>Background credit</span>
				<input name="background_image_credit" type="text" value={background?.credit ?? ''} />
			</label>
			<label>
				<span>Background source</span>
				<input name="background_image_source" type="url" value={background?.sourceHref ?? ''} />
			</label>
			<label>
				<span>Background position</span>
				<input name="background_image_position" type="text" value={background?.position ?? ''} placeholder="center center" />
			</label>
		</div>
	</details>

	<div class="draft-actions">
		<button type="submit" disabled={submitting}>{submitting ? 'Verifying owner...' : 'Save metadata'}</button>
		{#if clientError}
			<span class="draft-save-message is-error" role="status">{clientError}</span>
		{:else if saveState}
			<span class={`draft-save-message ${saveState.ok ? 'is-ok' : 'is-error'}`} role="status">
				{saveState.message}
			</span>
		{/if}
	</div>
</form>

<style>
	.draft-metadata-controls {
		display: grid;
		gap: 14px;
		padding: 16px;
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 34%, var(--metro-line-soft));
		border-radius: 10px;
		background:
			linear-gradient(90deg, color-mix(in srgb, var(--article-accent, var(--accent)) 10%, transparent), transparent 72%),
			rgba(255, 255, 255, 0.025);
	}

	.draft-controls-head {
		display: flex;
		gap: 14px;
		align-items: start;
		justify-content: space-between;
	}

	.draft-controls-head h3 {
		margin: 0;
		font-size: 18px;
		line-height: 1.15;
		font-weight: 400;
	}

	.draft-controls-head a {
		color: var(--article-accent, var(--accent));
		font-size: 13px;
		text-decoration: none;
	}

	.draft-control-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	label {
		display: grid;
		gap: 6px;
		min-width: 0;
	}

	label.wide {
		grid-column: span 2;
	}

	label span,
	.draft-visual-fields summary {
		color: var(--soft);
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	input,
	select {
		width: 100%;
		min-width: 0;
		border: 1px solid var(--metro-line-soft);
		border-radius: 8px;
		padding: 9px 10px;
		background: rgba(0, 0, 0, 0.28);
		color: var(--text);
		font: inherit;
	}

	input[type='color'] {
		min-height: 41px;
		padding: 4px;
	}

	.draft-visual-fields {
		display: grid;
		gap: 12px;
	}

	.draft-visual-fields summary {
		cursor: pointer;
		color: var(--article-accent, var(--accent));
	}

	.draft-visual-fields[open] {
		gap: 14px;
	}

	.draft-actions {
		display: flex;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
	}

	button {
		border: 0;
		border-radius: 8px;
		padding: 10px 13px;
		background: var(--article-accent, var(--accent));
		color: #05080d;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.72;
	}

	.draft-save-message {
		font-size: 13px;
		color: var(--soft);
	}

	.draft-save-message.is-ok {
		color: var(--green);
	}

	.draft-save-message.is-error {
		color: var(--danger);
	}

	@media (max-width: 900px) {
		.draft-control-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.draft-control-grid {
			grid-template-columns: 1fr;
		}

		label.wide {
			grid-column: span 1;
		}

		.draft-controls-head {
			display: grid;
		}
	}
</style>
