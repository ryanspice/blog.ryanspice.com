/// <reference types="vite/client" />

declare module 'virtual:blog-public-articles' {
	export type PublicArticleSource = {
		path: string;
		raw: string;
	};

	export const publicArticleSources: PublicArticleSource[];
	export const publicVersionSources: Record<string, string>;
}
