<script lang="ts">
	import {
		formatModelPrice,
		modelPriceMax,
		modelPriceRows,
		priceBarPercent
	} from '$lib/model-price-watch';

	type Props = {
		compact?: boolean;
	};

	let { compact = false }: Props = $props();
	const titleId = $derived(`model-price-watch-title-${compact ? 'compact' : 'full'}`);

	function markerStyle(value: number): string {
		return `left: ${priceBarPercent(value)}%`;
	}
</script>

<section
	class="model-price-watch"
	class:model-price-watch--compact={compact}
	aria-labelledby={titleId}
>
	<div class="model-price-watch-heading">
		<div>
			<p class="eyebrow">Price watch</p>
			<h2 id={titleId}>Model API price snapshot</h2>
		</div>
		<span class="model-price-watch-unit">USD / 1M tokens</span>
	</div>

	<p class="model-price-watch-dek">
		{compact
			? 'A quick cost read for the models in this week’s fleet.'
			: 'A price-ladder view of the current fleet. This is a verified snapshot, not a historical stock chart.'}
	</p>

	<div class="model-price-watch-legend" aria-hidden="true">
		<span><i class="model-price-watch-swatch model-price-watch-swatch--input"></i>Input</span>
		<span><i class="model-price-watch-swatch model-price-watch-swatch--output"></i>Output</span>
		<span><i class="model-price-watch-marker"></i>Higher band</span>
	</div>

	<div
		class="model-price-watch-chart"
		aria-label={`Price comparison for ${modelPriceRows.length} AI models. The axis runs from zero to $${modelPriceMax.toFixed(2)} per million tokens.`}
	>
		<div class="model-price-watch-axis" aria-hidden="true">
			{#if compact}
				<span>$0</span><span>${modelPriceMax.toFixed(2)}</span>
			{:else}
				<span>$0</span><span>$2.50</span><span>$5.00</span><span>${modelPriceMax.toFixed(2)}</span>
			{/if}
		</div>
		{#each modelPriceRows as row (row.model)}
			<div class="model-price-watch-row">
				<div class="model-price-watch-meta">
					<strong>{row.model}</strong>
					<span class={`model-price-watch-status model-price-watch-status--${row.statusTone}`}>{row.status}</span>
				</div>
				<div class="model-price-watch-bars">
					<div class="model-price-watch-line">
						<span class="model-price-watch-label">In</span>
						<div class="model-price-watch-track">
							<span class="model-price-watch-bar model-price-watch-bar--input" style={`width: ${priceBarPercent(row.primary.input)}%`}></span>
							{#if row.marker}<i class="model-price-watch-marker" style={markerStyle(row.marker.input)}></i>{/if}
						</div>
						<output>{formatModelPrice(row.primary.input)}</output>
					</div>
					<div class="model-price-watch-line">
						<span class="model-price-watch-label">Out</span>
						<div class="model-price-watch-track">
							<span class="model-price-watch-bar model-price-watch-bar--output" style={`width: ${priceBarPercent(row.primary.output)}%`}></span>
							{#if row.marker}<i class="model-price-watch-marker" style={markerStyle(row.marker.output)}></i>{/if}
						</div>
						<output>{formatModelPrice(row.primary.output)}</output>
					</div>
					{#if !compact}
						<p class="model-price-watch-note">
							{row.note}{#if row.marker}<span> · {row.marker.label}: {formatModelPrice(row.marker.input)}/{formatModelPrice(row.marker.output)}</span>{/if}
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !compact}
		<details class="model-price-watch-table-details">
			<summary>Show the price data table</summary>
			<div class="model-price-watch-table-wrap">
				<table>
					<caption>Current model price snapshots in USD per million tokens</caption>
					<thead>
						<tr><th scope="col">Model</th><th scope="col">Band</th><th scope="col">Input</th><th scope="col">Output</th></tr>
					</thead>
					<tbody>
						{#each modelPriceRows as row (row.model)}
							<tr>
								<th scope="row">{row.model}</th><td>{row.primary.label}</td><td>{formatModelPrice(row.primary.input)}</td><td>{formatModelPrice(row.primary.output)}</td>
							</tr>
							{#if row.marker}
								<tr class="model-price-watch-table-marker">
									<th scope="row">{row.model}</th><td>{row.marker.label}</td><td>{formatModelPrice(row.marker.input)}</td><td>{formatModelPrice(row.marker.output)}</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</details>
		<p class="model-price-watch-source">Price snapshot from the public sources linked in this article. Free listings are volatile; prices are not investment data.</p>
	{/if}
</section>

<style>
	.model-price-watch {
		margin: 34px 0;
		padding: clamp(20px, 3vw, 34px);
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 30%, var(--metro-line-soft));
		border-radius: 16px;
		background:
			linear-gradient(145deg, color-mix(in srgb, var(--article-accent, var(--accent)) 10%, transparent), transparent 62%),
			rgba(5, 8, 13, 0.72);
	}

	.model-price-watch--compact {
		margin: 0;
		padding: 18px;
		border-radius: 12px;
		background: linear-gradient(160deg, color-mix(in srgb, var(--article-accent, var(--accent)) 13%, transparent), rgba(0, 0, 0, 0.24));
	}

	.model-price-watch-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 18px;
	}

	.model-price-watch h2 {
		margin: 0;
		font-size: clamp(22px, 2.8vw, 36px);
		line-height: 1.05;
	}

	.model-price-watch--compact h2 { font-size: 20px; }
	.model-price-watch--compact .model-price-watch-axis { grid-template-columns: repeat(2, 1fr); margin-left: 42px; margin-right: 42px; }
	.model-price-watch--compact .model-price-watch-row { grid-template-columns: minmax(104px, 0.46fr) minmax(86px, 0.54fr); gap: 8px; }
	.model-price-watch--compact .model-price-watch-line { grid-template-columns: 20px minmax(0, 1fr) 34px; gap: 4px; }
	.model-price-watch--compact .model-price-watch-label,
	.model-price-watch--compact .model-price-watch-line output { font-size: 9px; }

	.model-price-watch-unit,
	.model-price-watch-dek,
	.model-price-watch-source,
	.model-price-watch-note { color: var(--muted); }

	.model-price-watch-unit { font-size: 12px; white-space: nowrap; }

	.model-price-watch-dek {
		max-width: 68ch;
		margin: 14px 0 20px;
		font-size: 14px;
		line-height: 1.55;
	}

	.model-price-watch--compact .model-price-watch-dek { margin: 10px 0 14px; font-size: 12px; }

	.model-price-watch-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 9px 16px;
		margin-bottom: 16px;
		color: var(--muted);
		font-size: 12px;
	}

	.model-price-watch-legend span { display: inline-flex; align-items: center; gap: 6px; }

	.model-price-watch-swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}

	.model-price-watch-swatch--input,
	.model-price-watch-bar--input { background: #7c4dff; }
	.model-price-watch-swatch--output,
	.model-price-watch-bar--output { background: #b34e7b; }

	.model-price-watch-marker {
		display: block;
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		border-radius: 2px;
		background: #f2d27c;
		box-shadow: 0 0 8px rgba(242, 210, 124, 0.56);
	}

	.model-price-watch-legend .model-price-watch-marker {
		position: relative;
		top: auto;
		bottom: auto;
		height: 12px;
	}

	.model-price-watch-axis {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0 48px 6px 190px;
		color: var(--soft);
		font: 11px/1.2 "Cascadia Code", Consolas, monospace;
	}

	.model-price-watch-axis span:not(:first-child) { text-align: right; }

	.model-price-watch-row {
		display: grid;
		grid-template-columns: minmax(140px, 0.34fr) minmax(0, 1fr);
		gap: 16px;
		align-items: start;
		padding: 14px 0;
		border-top: 1px solid var(--metro-line-soft);
	}

	.model-price-watch-meta { display: grid; gap: 7px; }
	.model-price-watch-meta strong { font-size: 14px; line-height: 1.2; }

	.model-price-watch-status {
		width: fit-content;
		padding: 3px 7px;
		border: 1px solid currentColor;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 750;
		letter-spacing: 0.06em;
		line-height: 1;
		text-transform: uppercase;
	}

	.model-price-watch-status--free { color: #87dac4; }
	.model-price-watch-status--paid { color: #b9a0ff; }
	.model-price-watch-status--preview { color: #f2d27c; }

	.model-price-watch-bars { display: grid; gap: 5px; min-width: 0; }

	.model-price-watch-line {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) 48px;
		gap: 9px;
		align-items: center;
	}

	.model-price-watch-label,
	.model-price-watch-line output {
		color: var(--muted);
		font: 11px/1.2 "Cascadia Code", Consolas, monospace;
	}

	.model-price-watch-line output { text-align: right; }

	.model-price-watch-track {
		position: relative;
		min-width: 0;
		height: 10px;
		background: repeating-linear-gradient(90deg, transparent 0, transparent calc(33.333% - 1px), rgba(255, 255, 255, 0.1) 33.333%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.model-price-watch-bar { display: block; min-width: 3px; height: 10px; border-radius: 0 5px 5px 0; }

	.model-price-watch-note { margin: 8px 0 0 37px; font-size: 11px; line-height: 1.4; }
	.model-price-watch-note span { color: #f2d27c; }

	.model-price-watch-table-details { margin-top: 22px; border-top: 1px solid var(--metro-line-soft); padding-top: 14px; }
	.model-price-watch-table-details summary { cursor: pointer; color: var(--muted); font-size: 13px; }
	.model-price-watch-table-wrap { overflow-x: auto; margin-top: 12px; }
	.model-price-watch table { width: 100%; border-collapse: collapse; font-size: 13px; }
	.model-price-watch th,
	.model-price-watch td { padding: 9px 10px; border-bottom: 1px solid var(--metro-line-soft); text-align: left; vertical-align: top; }
	.model-price-watch-table-marker { color: var(--muted); }
	.model-price-watch-source { margin: 18px 0 0; font-size: 12px; line-height: 1.5; }

	@media (max-width: 680px) {
		.model-price-watch-axis { margin-left: 116px; }
		.model-price-watch-row { grid-template-columns: minmax(100px, 0.42fr) minmax(0, 1fr); gap: 10px; }
		.model-price-watch-meta strong { font-size: 12px; }
		.model-price-watch-line { grid-template-columns: 25px minmax(0, 1fr) 42px; gap: 6px; }
		.model-price-watch-note { margin-left: 31px; }
	}

	@media (max-width: 430px) {
		.model-price-watch-heading { align-items: start; flex-direction: column; gap: 8px; }
		.model-price-watch-axis { margin-left: 92px; margin-right: 42px; font-size: 9px; }
		.model-price-watch-row { grid-template-columns: 92px minmax(0, 1fr); }
		.model-price-watch-status { font-size: 8px; }
		.model-price-watch--compact .model-price-watch-axis { margin-left: 36px; margin-right: 36px; }
		.model-price-watch--compact .model-price-watch-row { grid-template-columns: 86px minmax(0, 1fr); }
	}
</style>
