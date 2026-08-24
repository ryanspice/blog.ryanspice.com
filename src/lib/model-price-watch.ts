export type ModelPriceBand = {
	label: string;
	input: number;
	output: number;
};

export type ModelPriceRow = {
	model: string;
	status: string;
	statusTone: 'free' | 'paid' | 'preview';
	primary: ModelPriceBand;
	marker?: ModelPriceBand;
	note: string;
};

/**
 * Source-backed per-million-token price snapshots from the current model-news
 * article. These are deliberately bands/snapshots, not fabricated history.
 */
export const modelPriceRows: ModelPriceRow[] = [
	{
		model: 'DeepSeek V4 Flash Vision Exp',
		status: 'experimental',
		statusTone: 'preview',
		primary: { label: 'off-peak', input: 0.22, output: 0.66 },
		marker: { label: 'peak', input: 0.44, output: 1.32 },
		note: 'Peak windows are exactly 2×.'
	},
	{
		model: 'Gemini 3.7 Flash',
		status: 'intro rate',
		statusTone: 'paid',
		primary: { label: 'intro', input: 0.75, output: 3.75 },
		marker: { label: 'after Dec 31', input: 1.5, output: 7.5 },
		note: 'Intro pricing ends December 31, 2026.'
	},
	{
		model: 'GLM-5.3',
		status: 'listed',
		statusTone: 'paid',
		primary: { label: 'current', input: 1.4, output: 4.4 },
		note: 'Per 1M input/output tokens.'
	},
	{
		model: 'Ox Alpha',
		status: 'free listing',
		statusTone: 'free',
		primary: { label: 'listed', input: 0, output: 0 },
		note: 'Anonymous provider; prompts are retained.'
	},
	{
		model: 'Dots3-Note Preview',
		status: 'free until Sep 30',
		statusTone: 'free',
		primary: { label: 'listed', input: 0, output: 0 },
		note: 'Free listing is scheduled to expire September 30, 2026.'
	}
];

export const modelPriceMax = 7.5;

export function priceBarPercent(value: number): number {
	return value <= 0 ? 0 : Math.min(100, Math.max(3, (value / modelPriceMax) * 100));
}

export function formatModelPrice(value: number): string {
	return value === 0 ? '$0' : `$${value.toFixed(2)}`;
}
