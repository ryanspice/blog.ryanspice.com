export const PUBLIC_ARTICLE_TYPES = ['guide', 'analysis', 'case-study', 'field-note', 'build-log'] as const;

export type PublicArticleType = (typeof PUBLIC_ARTICLE_TYPES)[number];

export const PUBLIC_ARTICLE_LABELS: Record<PublicArticleType, string> = {
	guide: 'Guide',
	analysis: 'Analysis',
	'case-study': 'Case Study',
	'field-note': 'Field Note',
	'build-log': 'Build Log'
};

/**
 * The public taxonomy is intentionally coarser than the internal workflow
 * type. Keep this mapping explicit so a new internal type cannot silently
 * leak into reader-facing UI.
 */
const INTERNAL_TO_PUBLIC: Record<string, PublicArticleType> = {
	'agent-architecture': 'analysis',
	'ai-news-analysis': 'analysis',
	'build-log': 'build-log',
	'case-study': 'case-study',
	'creator-guide': 'guide',
	'daily-dev-log': 'build-log',
	'field-note': 'field-note',
	'game-asset-workflow': 'guide',
	'gameplay-simulation-devlog': 'build-log',
	'model-research-analysis': 'analysis',
	'product-strategy': 'analysis',
	'quick-technical-note': 'field-note',
	'rendering-architecture': 'analysis',
	'research-analysis': 'analysis',
	'research-note': 'analysis',
	'setup-guide': 'guide',
	'short-news-update': 'field-note',
	'systems-analysis': 'analysis',
	'technical-adoption-review': 'analysis',
	'technical-blog-post': 'field-note',
	'technical-debugging-note': 'field-note',
	'technical-decision-log': 'field-note',
	'technical-note': 'field-note',
	'technical-recovery-guide': 'guide',
	'technical-workflow-guide': 'guide'
};

export function resolvePublicArticleType(internalType: string, explicitType?: string): PublicArticleType {
	if (explicitType !== undefined) {
		if (!PUBLIC_ARTICLE_TYPES.includes(explicitType as PublicArticleType)) {
			throw new Error(`Invalid public_type "${explicitType}". Expected one of: ${PUBLIC_ARTICLE_TYPES.join(', ')}`);
		}
		return explicitType as PublicArticleType;
	}

	const resolved = INTERNAL_TO_PUBLIC[internalType];
	if (!resolved) {
		throw new Error(`No public taxonomy mapping exists for internal draft_type "${internalType}"`);
	}
	return resolved;
}
