import { tick } from 'svelte';

export function articleTitleTransitionName(slug: string): string {
	return `article-title-${slug}`;
}

export async function runViewTransition(action: () => Promise<unknown> | unknown): Promise<void> {
	if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
		await action();
		return;
	}

	const transition = document.startViewTransition(async () => {
		await action();
		await tick();
	});

	await transition.finished;
}
