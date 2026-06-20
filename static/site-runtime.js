(() => {
	const viewModeKey = 'blog-article-view-mode';
	const legacyReadingModeKey = 'blog-reading-mode';
	let feedbackTimer = 0;
	let frame = 0;

	function preferredReadingMode() {
		try {
			const stored = window.localStorage.getItem(viewModeKey);
			if (stored === 'classic' || stored === 'immersive') return stored;
			return window.localStorage.getItem(legacyReadingModeKey) === 'true' ? 'classic' : 'immersive';
		} catch {
			return 'immersive';
		}
	}

	function setReadingMode(mode) {
		const classic = mode === 'classic';
		document.documentElement.classList.toggle('reading-mode', classic);

		for (const button of document.querySelectorAll('[data-reading-mode-toggle]')) {
			button.setAttribute('aria-pressed', classic ? 'true' : 'false');
			const label = button.querySelector('[data-reading-mode-label]');
			if (label) {
				const nextLabel = classic
					? label.getAttribute('data-label-on') || label.textContent
					: label.getAttribute('data-label-off') || label.textContent;
				if (label.textContent !== nextLabel) label.textContent = nextLabel;
			}
		}
	}

	function persistReadingMode(mode) {
		try {
			window.localStorage.setItem(viewModeKey, mode);
			window.localStorage.setItem(legacyReadingModeKey, String(mode === 'classic'));
		} catch {
			// Storage may be blocked; the in-page class still updates.
		}
	}

	async function copyText(text) {
		if (!text) return false;
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.setAttribute('readonly', '');
			textarea.style.position = 'fixed';
			textarea.style.left = '-9999px';
			textarea.style.top = '0';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			try {
				return document.execCommand('copy');
			} catch {
				return false;
			} finally {
				document.body.removeChild(textarea);
			}
		}
	}

	function setFeedback(source, message) {
		const feedbackId = source.getAttribute('data-copy-feedback');
		const feedback = feedbackId
			? document.getElementById(feedbackId)
			: source.closest('[data-copy-scope]')?.querySelector('[data-copy-feedback-target]');

		if (feedback) {
			feedback.textContent = message;
			feedback.hidden = false;
			window.clearTimeout(feedbackTimer);
			feedbackTimer = window.setTimeout(() => {
				feedback.textContent = '';
				feedback.hidden = true;
			}, 1800);
			return;
		}

		if (source instanceof HTMLButtonElement) {
			const original = source.getAttribute('data-copy-label') || source.textContent || '';
			source.setAttribute('data-copy-label', original);
			source.textContent = message;
			window.clearTimeout(feedbackTimer);
			feedbackTimer = window.setTimeout(() => {
				source.textContent = original;
			}, 1800);
		}
	}

	function sameOriginBack(event, link) {
		const referrer = document.referrer.trim();
		if (!referrer) return;

		try {
			if (new URL(referrer).origin !== window.location.origin) return;
		} catch {
			return;
		}

		event.preventDefault();
		window.history.back();
	}

	async function shareArticle(source) {
		const url = source.getAttribute('data-share-url') || '';
		if (!url) return;

		const shareData = {
			title: source.getAttribute('data-share-title') || document.title,
			text: source.getAttribute('data-share-text') || '',
			url
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
				setFeedback(source, source.getAttribute('data-share-success') || 'Share opened');
				return;
			} catch (error) {
				if (error && error.name === 'AbortError') return;
			}
		}

		const ok = await copyText(url);
		setFeedback(
			source,
			ok
				? source.getAttribute('data-copy-success') || 'Link copied'
				: source.getAttribute('data-copy-failure') || 'Copy failed'
		);
	}

	function updateArticleProgress() {
		if (frame) window.cancelAnimationFrame(frame);
		frame = window.requestAnimationFrame(() => {
			const progress = document.querySelector('[data-scroll-progress]');
			const height = document.documentElement.scrollHeight - window.innerHeight;
			const percent = height > 0 ? Math.min(100, Math.max(0, (window.scrollY / height) * 100)) : 0;
			if (progress) progress.style.width = `${percent}%`;

			const headings = Array.from(document.querySelectorAll('.article-inner h2[id], .article-inner h3[id]'));
			if (!headings.length) return;

			let current = headings[0].id;
			for (const heading of headings) {
				if (heading.getBoundingClientRect().top - 140 <= 0) current = heading.id;
				else break;
			}

			for (const link of document.querySelectorAll('.article-toc a[href^="#"]')) {
				const active = link.getAttribute('href') === `#${current}`;
				link.classList.toggle('is-active', active);
				if (active) link.setAttribute('aria-current', 'location');
				else link.removeAttribute('aria-current');
			}
		});
	}

	function normalizeFilterValue(value) {
		return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
	}

	function articleMatchesFilters(card, query, tag) {
		const search = normalizeFilterValue(card.getAttribute('data-article-search'));
		const tags = String(card.getAttribute('data-article-tags') || '')
			.split('|')
			.map(normalizeFilterValue)
			.filter(Boolean);
		const normalizedQuery = normalizeFilterValue(query);
		const normalizedTag = normalizeFilterValue(tag);

		if (normalizedTag && !tags.includes(normalizedTag)) return false;
		if (normalizedQuery && !search.includes(normalizedQuery)) return false;
		return true;
	}

	function applyArticleFilters(query, tag, compact) {
		const index = document.querySelector('[data-article-index]');
		if (!index) return;

		const cards = Array.from(index.querySelectorAll('[data-article-card]'));
		const hasFilters = Boolean(query || tag || compact);
		let visible = 0;

		index.classList.toggle('compact-grid', hasFilters);

		for (const card of cards) {
			const matched = articleMatchesFilters(card, query, tag);
			card.hidden = !matched;
			if (matched) visible += 1;
		}

		const results = index.querySelector('[data-article-results-meta]');
		if (results) {
			const label = results.getAttribute('data-results-label') || 'matching articles';
			results.hidden = !hasFilters;
			results.textContent = hasFilters ? `${visible} ${label}${tag ? ` · ${tag}` : ''}${query ? ` · "${query}"` : ''}` : '';
		}
	}

	function currentArticleFilterValues(form) {
		const queryInput = form.querySelector('[data-article-filter-query]');
		const tagSelect = form.querySelector('[data-article-filter-tag]');
		return {
			query: queryInput ? queryInput.value.trim() : '',
			tag: tagSelect ? tagSelect.value.trim() : ''
		};
	}

	function syncArticleFiltersFromUrl() {
		const form = document.querySelector('[data-article-filter-form]');
		if (!form) return;

		const params = new URLSearchParams(window.location.search);
		const query = (params.get('q') || '').trim();
		const tag = (params.get('tag') || '').trim();
		const compact = (params.get('view') || '').trim().toLowerCase() === 'compact';
		const queryInput = form.querySelector('[data-article-filter-query]');
		const tagSelect = form.querySelector('[data-article-filter-tag]');

		if (queryInput) queryInput.value = query;
		if (tagSelect) tagSelect.value = tag;
		applyArticleFilters(query, tag, compact);
	}

	function refresh() {
		setReadingMode(preferredReadingMode());
		updateArticleProgress();
	}

	document.addEventListener('click', async (event) => {
		const target = event.target instanceof Element ? event.target : null;
		if (!target) return;

		const modeButton = target.closest('[data-reading-mode-toggle]');
		if (modeButton) {
			const next = preferredReadingMode() === 'classic' ? 'immersive' : 'classic';
			persistReadingMode(next);
			setReadingMode(next);
			return;
		}

		const shareSource = target.closest('[data-share-url]');
		if (shareSource) {
			await shareArticle(shareSource);
			return;
		}

		const copySource = target.closest('[data-copy-text], [data-copy-current-url]');
		if (copySource) {
			const text = copySource.hasAttribute('data-copy-current-url')
				? window.location.href
				: copySource.getAttribute('data-copy-text') || '';
			const ok = await copyText(text);
			setFeedback(
				copySource,
				ok
					? copySource.getAttribute('data-copy-success') || 'Copied.'
					: copySource.getAttribute('data-copy-failure') || 'Copy failed.'
			);
			return;
		}

		const backLink = target.closest('[data-back-same-origin]');
		if (backLink) sameOriginBack(event, backLink);
	});

	document.addEventListener('input', (event) => {
		const target = event.target instanceof Element ? event.target : null;
		const form = target?.closest('[data-article-filter-form]');
		if (!form) return;

		const filters = currentArticleFilterValues(form);
		applyArticleFilters(filters.query, filters.tag, true);
	});

	document.addEventListener('change', (event) => {
		const target = event.target instanceof Element ? event.target : null;
		const form = target?.closest('[data-article-filter-form]');
		if (!form) return;

		const filters = currentArticleFilterValues(form);
		applyArticleFilters(filters.query, filters.tag, true);
	});

	window.addEventListener('scroll', updateArticleProgress, { passive: true });
	window.addEventListener('resize', updateArticleProgress);
	window.addEventListener('popstate', syncArticleFiltersFromUrl);
	new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
	refresh();
	syncArticleFiltersFromUrl();
})();
