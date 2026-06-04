import { browser } from '$app/environment';

export type ArticleViewMode = 'immersive' | 'classic';

const storageKey = 'blog-article-view-mode';
const legacyReadingModeKey = 'blog-reading-mode';

class ArticleViewModeState {
	mode = $state<ArticleViewMode>('immersive');
	ready = $state(false);

	init(): void {
		if (!browser || this.ready) return;

		const stored = window.localStorage.getItem(storageKey);
		const legacyReadingMode = window.localStorage.getItem(legacyReadingModeKey) === 'true';
		this.mode = stored === 'classic' || stored === 'immersive'
			? stored
			: legacyReadingMode
				? 'classic'
				: 'immersive';
		this.ready = true;
		this.applyDocumentClass();
	}

	setMode(mode: ArticleViewMode): void {
		this.mode = mode;
		this.ready = true;

		if (browser) {
			window.localStorage.setItem(storageKey, mode);
			window.localStorage.setItem(legacyReadingModeKey, String(mode === 'classic'));
			this.applyDocumentClass();
		}
	}

	toggle(): void {
		this.setMode(this.mode === 'classic' ? 'immersive' : 'classic');
	}

	private applyDocumentClass(): void {
		if (!browser) return;
		document.documentElement.classList.toggle('reading-mode', this.mode === 'classic');
	}
}

export const articleViewModeState = new ArticleViewModeState();
