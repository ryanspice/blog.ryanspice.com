<script lang="ts">
	import {
		latestModelStats,
		normalizedModelStatsRows,
		type LatestModelStatsSnapshot
	} from '$lib/model-stats';

	const snapshot: LatestModelStatsSnapshot = latestModelStats;
	const rows = $derived(normalizedModelStatsRows(snapshot.rows));
	const hasSnapshot = $derived(Boolean(snapshot.updatedAt) && rows.length > 0);

	function formatUpdatedAt(value: string | null): string {
		if (!value) return 'Awaiting first verified snapshot';
		const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
		return Number.isNaN(date.getTime())
			? value
			: new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
	}
</script>

{#if hasSnapshot}
	<section class="latest-model-stats" aria-labelledby="latest-model-stats-title">
		<div class="latest-model-stats-heading">
			<div>
				<p class="eyebrow">Latest model stats</p>
				<h2 id="latest-model-stats-title">{snapshot.title}</h2>
			</div>
			<p class="latest-model-stats-updated">Updated {formatUpdatedAt(snapshot.updatedAt)}</p>
		</div>

		<p class="latest-model-stats-methodology">{snapshot.methodology}</p>

		<div class="latest-model-stats-legend" aria-hidden="true">
			<span><i class="latest-model-stats-swatch latest-model-stats-swatch--capability"></i>Capability ceiling</span>
			<span><i class="latest-model-stats-swatch latest-model-stats-swatch--productivity"></i>Practical productivity</span>
		</div>

		<div
			class="latest-model-stats-chart"
			role="img"
			aria-label="Horizontal comparison of capability ceiling and practical productivity for the latest tracked models"
		>
			{#each rows as row (row.model)}
				<div class="latest-model-stats-row">
					<div class="latest-model-stats-name">{row.model}</div>
					<div class="latest-model-stats-bars" aria-hidden="true">
						<span
							class="latest-model-stats-bar latest-model-stats-bar--capability"
							style={`width: ${row.capability}%`}
						></span>
						<span
							class="latest-model-stats-bar latest-model-stats-bar--productivity"
							style={`width: ${row.productivity}%`}
						></span>
					</div>
				</div>
			{/each}
		</div>

		<details class="latest-model-stats-table-details">
			<summary>Show the accessible data table</summary>
			<div class="latest-model-stats-table-wrap">
				<table>
					<caption>Latest model stats, scored from 0 to 100</caption>
					<thead>
						<tr>
							<th scope="col">Model</th>
							<th scope="col">Capability</th>
							<th scope="col">Productivity</th>
							<th scope="col">Context</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row (row.model)}
							<tr>
								<th scope="row">{row.model}</th>
								<td>{row.capability}</td>
								<td>{row.productivity}</td>
								<td>{row.note ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>

		{#if snapshot.sources.length}
			<p class="latest-model-stats-sources">
				Sources:
				{#each snapshot.sources as source, index (source.href)}
					<a href={source.href} rel="noreferrer" target="_blank">{source.label}</a>{index < snapshot.sources.length - 1 ? ', ' : ''}
				{/each}
			</p>
		{/if}
	</section>
{/if}

<style>
	.latest-model-stats {
		margin: 30px 0;
		padding: clamp(20px, 3vw, 34px);
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 30%, var(--metro-line-soft));
		border-radius: 16px;
		background: linear-gradient(145deg, color-mix(in srgb, var(--article-accent, var(--accent)) 9%, transparent), rgba(5, 8, 13, 0.72));
	}

	.latest-model-stats-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 20px;
	}

	.latest-model-stats h2 {
		margin: 0;
		font-size: clamp(24px, 3vw, 38px);
		line-height: 1.05;
	}

	.latest-model-stats-updated {
		margin: 0;
		color: var(--muted);
		font-size: 13px;
		white-space: nowrap;
	}

	.latest-model-stats-methodology {
		max-width: 72ch;
		margin: 14px 0 22px;
		color: var(--muted);
	}

	.latest-model-stats-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 20px;
		margin-bottom: 18px;
		color: var(--muted);
		font-size: 13px;
	}

	.latest-model-stats-legend span {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}

	.latest-model-stats-swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.latest-model-stats-swatch--capability,
	.latest-model-stats-bar--capability {
		background: #7c4dff;
	}

	.latest-model-stats-swatch--productivity,
	.latest-model-stats-bar--productivity {
		background: #b34e7b;
	}

	.latest-model-stats-chart {
		display: grid;
		gap: 12px;
		padding: 4px 0;
	}

	.latest-model-stats-row {
		display: grid;
		grid-template-columns: minmax(112px, 0.3fr) minmax(0, 1fr);
		align-items: center;
		gap: 14px;
	}

	.latest-model-stats-name {
		color: var(--text);
		font-size: 14px;
		font-weight: 650;
		line-height: 1.15;
		text-align: right;
	}

	.latest-model-stats-bars {
		display: grid;
		gap: 4px;
		min-width: 0;
		padding: 2px 0;
		background: repeating-linear-gradient(90deg, transparent 0, transparent calc(25% - 1px), rgba(255, 255, 255, 0.08) 25%);
	}

	.latest-model-stats-bar {
		display: block;
		min-width: 3px;
		height: 10px;
		border-radius: 0 5px 5px 0;
	}

	.latest-model-stats-table-details {
		margin-top: 22px;
		border-top: 1px solid var(--metro-line-soft);
		padding-top: 14px;
	}

	.latest-model-stats-table-details summary {
		cursor: pointer;
		color: var(--muted);
		font-size: 13px;
	}

	.latest-model-stats-table-wrap {
		overflow-x: auto;
		margin-top: 12px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	th,
	td {
		padding: 9px 10px;
		border-bottom: 1px solid var(--metro-line-soft);
		text-align: left;
		vertical-align: top;
	}

	th:not(:first-child),
	td:not(:first-child) {
		white-space: nowrap;
	}

	.latest-model-stats-sources {
		margin: 18px 0 0;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.6;
	}

	.latest-model-stats-sources a {
		color: var(--text);
	}

	@media (max-width: 640px) {
		.latest-model-stats-heading {
			align-items: start;
			flex-direction: column;
			gap: 10px;
		}

		.latest-model-stats-updated {
			white-space: normal;
		}

		.latest-model-stats-row {
			grid-template-columns: minmax(90px, 0.42fr) minmax(0, 1fr);
			gap: 10px;
		}

		.latest-model-stats-name {
			font-size: 12px;
		}

		.latest-model-stats-bar {
			height: 8px;
		}
	}
</style>
