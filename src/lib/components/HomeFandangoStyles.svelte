<style>
	:global(.home-hero) {
		padding-top: clamp(44px, 5vw, 62px);
		padding-bottom: clamp(22px, 3vw, 28px);
		align-items: start;
	}

	:global(.home-hero-copy) {
		padding-top: clamp(8px, 1.2vw, 16px);
	}

	:global(.home-hero h1) {
		max-width: 760px;
		text-wrap: balance;
	}

	:global(.home-hero .dek) {
		max-width: 680px;
	}

	:global(.home-primary-actions) {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		margin-top: 24px;
	}

	:global(.home-primary-actions a) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 15px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 22%, rgba(255, 255, 255, 0.12));
		background:
			linear-gradient(135deg, rgba(24, 29, 38, 0.72), rgba(4, 6, 10, 0.52)),
			color-mix(in srgb, var(--article-accent, var(--accent)) 4%, transparent);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(18px) saturate(1.12);
		-webkit-backdrop-filter: blur(18px) saturate(1.12);
		color: var(--text);
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.035em;
	}

	:global(.home-primary-actions a:first-child) {
		background:
			linear-gradient(135deg, color-mix(in srgb, var(--article-accent, var(--accent)) 22%, rgba(255, 255, 255, 0.04)), rgba(4, 6, 10, 0.58)),
			color-mix(in srgb, var(--article-accent, var(--accent)) 7%, transparent);
		color: color-mix(in srgb, var(--text) 88%, var(--article-accent, var(--accent)) 12%);
		border-color: color-mix(in srgb, var(--article-accent, var(--accent)) 42%, rgba(255, 255, 255, 0.12));
	}

	:global(.home-primary-actions a:hover),
	:global(.home-primary-actions a:focus-visible) {
		transform: translateY(-1px);
		border-color: var(--article-accent, var(--accent));
		color: var(--article-accent, var(--accent));
	}

	:global(.home-hero-card) {
		position: relative;
		margin-top: 0;
		border-radius: 18px;
		background:
			linear-gradient(135deg, rgba(24, 29, 38, 0.76), rgba(4, 6, 10, 0.56)),
			color-mix(in srgb, var(--article-accent, var(--accent)) 5%, transparent);
		border-color: color-mix(in srgb, var(--article-accent, var(--accent)) 32%, rgba(255, 255, 255, 0.12));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 22px 62px rgba(0, 0, 0, 0.22);
		backdrop-filter: blur(22px) saturate(1.15);
		-webkit-backdrop-filter: blur(22px) saturate(1.15);
	}

	:global(.home-hero-card::before) {
		content: '';
		position: absolute;
		left: -1px;
		top: 24px;
		bottom: 24px;
		width: 3px;
		border-radius: 999px;
		background: linear-gradient(180deg, var(--article-accent, var(--accent)), transparent);
		opacity: 0.84;
	}

	:global(.home-meta > div),
	:global(.home-hero-card .hero-meta > div),
	:global(.article-card),
	:global(.site-footer-links a) {
		background:
			linear-gradient(135deg, rgba(23, 28, 36, 0.64), rgba(5, 7, 10, 0.48)),
			rgba(255, 255, 255, 0.018);
		border-color: rgba(255, 255, 255, 0.105);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.065);
		backdrop-filter: blur(18px) saturate(1.08);
		-webkit-backdrop-filter: blur(18px) saturate(1.08);
	}

	:global(#articles.article-grid) {
		margin-top: 26px;
		padding-top: 0;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
		border-top-color: rgba(255, 255, 255, 0.055);
	}

	:global(#articles > .section-head) {
		grid-column: 1 / -1;
		padding-top: 22px;
		padding-bottom: 2px;
	}

	:global(#articles > .article-card:first-of-type) {
		grid-column: 1 / -1;
		min-height: 210px;
	}

	:global(#articles > .article-card:not(:first-of-type) h2) {
		font-size: clamp(21px, 1.7vw, 27px);
		line-height: 1.08;
		letter-spacing: -0.035em;
	}

	:global(.article-card) {
		border-radius: 18px;
		padding: clamp(18px, 1.45vw, 24px);
	}

	:global(.article-card p:not(.card-kicker)) {
		max-width: 62ch;
	}

	:global(#articles > .article-card:not(:first-of-type) p:not(.card-kicker):not(.card-meta)) {
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(#articles > .article-card:not(:first-of-type) .tag-row .tag:nth-child(n + 5)) {
		display: none;
	}

	:global(.site-footer) {
		margin-top: 10px;
	}

	@media (max-width: 1050px) {
		:global(.home-hero) {
			padding-top: 44px;
		}

		:global(#articles.article-grid) {
			grid-template-columns: 1fr;
			margin-top: 12px;
		}

		:global(#articles > .article-card:first-of-type) {
			min-height: auto;
		}
	}

	@media (max-width: 700px) {
		:global(.home-primary-actions) {
			margin-top: 18px;
		}

		:global(.home-primary-actions a) {
			width: 100%;
		}

		:global(.home-hero-card) {
			border-radius: 14px;
		}
	}
</style>
