export type ArticleTrustFields = {
	lastReviewedDate?: string;
	disclosure?: string;
	correctionNote?: string;
};

export function optionalArticleDate(value: unknown, key: string): string | undefined {
	if (typeof value !== 'string' || !value.trim()) return undefined;
	const candidate = value.trim();
	const parsed = new Date(`${candidate}T00:00:00Z`);
	const normalized = Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate) || normalized !== candidate) {
		throw new Error(`Invalid ${key} "${candidate}". Expected an ISO date (YYYY-MM-DD).`);
	}
	return candidate;
}

export function hasArticleTrustNotes(fields: ArticleTrustFields): boolean {
	return Boolean(fields.lastReviewedDate || fields.disclosure || fields.correctionNote);
}
