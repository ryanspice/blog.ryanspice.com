<script lang="ts">
	type IconName = 'articles' | 'latest' | 'feed' | 'research' | 'compare';

	type Props = {
		name: IconName;
		class?: string;
	};

	let { name, class: className = '' }: Props = $props();
</script>

<svg class={`article-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
	{#if name === 'articles'}
		<path
			d="M6.25 4.75h8.4l3.35 3.35V19A1.5 1.5 0 0 1 16.5 20.5h-10A1.5 1.5 0 0 1 5 19V6.25a1.5 1.5 0 0 1 1.25-1.5Z"
			fill="currentColor"
			fill-opacity="0.12"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linejoin="round"
		/>
		<path d="M14.65 4.75V8h3.35" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
		<path
			d="M7.6 11h6.9M7.6 14h6.9M7.6 17h4.5"
			fill="none"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
		/>
	{:else if name === 'latest'}
		<circle
			cx="12"
			cy="12"
			r="7.35"
			fill="currentColor"
			fill-opacity="0.12"
			stroke="currentColor"
			stroke-width="1.4"
		/>
		<path d="M12 8.15V12l2.55 1.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M12 4.8v1.3M19.2 12h-1.3M12 19.2v-1.3M4.8 12h1.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
	{:else if name === 'feed'}
		<path d="M6.15 18.2a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9Z" fill="currentColor" />
		<path d="M5.9 11a8.4 8.4 0 0 1 7.1 7.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		<path d="M5.9 6.2A13.2 13.2 0 0 1 18.1 18.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.85" />
	{:else if name === 'research'}
		<path
			d="M7.15 6.35h7.2l3.1 3.1V18a1.5 1.5 0 0 1-1.5 1.5h-8.8A1.5 1.5 0 0 1 5.65 18V7.85a1.5 1.5 0 0 1 1.5-1.5Z"
			fill="currentColor"
			fill-opacity="0.12"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linejoin="round"
		/>
		<path d="M14.35 6.35V9.45h3.1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
		<circle cx="9.45" cy="11.15" r="1" fill="currentColor" />
		<circle cx="13.2" cy="10.35" r="0.92" fill="currentColor" opacity="0.82" />
		<path
			d="M9.45 11.15 13.2 10.35 15.1 13.05"
			fill="none"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path d="M15.2 15.1 18.8 18.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
	{:else if name === 'compare'}
		<path
			d="M5.5 6.5h4v11h-4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm9 0h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4v-11Z"
			fill="currentColor"
			fill-opacity="0.12"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linejoin="round"
		/>
		<path d="M10.9 9.1h2.2M10.9 14.9h2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
		<path d="M12.9 7.7 14.3 9.1 12.9 10.5M11.1 13.5 9.7 14.9 11.1 16.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
	{/if}
</svg>
