import { contentTagsMatch, uniqueContentTags } from './tags';
import { slugify } from './markdown';

export type DevLogEntry = {
	id: string;
	date: string;
	dateLabel: string;
	title: string;
	summary: string;
	source: string;
	accent: string;
	tags: string[];
	relatedArticleSlugs: string[];
	relatedArticleTags: string[];
};

type DevLogSeed = Omit<DevLogEntry, 'id' | 'dateLabel'>;

const devLogSeeds: DevLogSeed[] = [
	{
		date: '2026-08-12',
		title: 'Make PixelBoats combat land and Canopy chat work everywhere',
		summary:
			'Advanced the PixelBoats sword lab with authored ARDY motion, deterministic MK-style strings, grounded blade contact, recovery, and overboard outcomes; in parallel, Canopy gave its chat control a real bilingual fallback on non-hydrated prerendered pages and expanded focused analytics, chrome, admin, and auth tests.',
		source: 'PixelBoats sword-lab and Canopy web implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'combat', 'animation', 'testing', 'canopy', 'accessibility', 'analytics', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'SvelteKit', 'Accessibility', 'developer workflow']
	},
	{
		date: '2026-08-10',
		title: 'Harden publication surfaces and the PixelBoats anchor bridge',
		summary:
			'Unified the shared article system across the Ryan, Canopy blog, and Canopy engineering surfaces, then tightened taxonomy, canonical ownership, trust metadata, restrained promotion, and accessibility; in parallel, PixelBoats joined its generated character rig to art anchors and replaced false-positive tests with gates that fail on missing evidence.',
		source: 'Blog publication-system and PixelBoats CS4 anchor-bridge implementation history',
		accent: '#38bdf8',
		tags: ['blog', 'pixelboats', 'sveltekit', 'seo', 'accessibility', 'character', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'SvelteKit', 'SEO', 'Game Development', 'Accessibility', 'developer workflow']
	},
	{
		date: '2026-08-05',
		title: 'Build PixelBoats character scaffolds and agent tooling',
		summary:
			'Took the character pipeline from mannequin jig to measured result: a live capture camera, kinematics and part-ID gates, a WebGL renderer lab, and palette quantization through the fleet transform; in parallel, the agent skill roots, MCP tooling, and doctrine routing were consolidated, and the GDD gained a seabird sea-reading section.',
		source: 'PixelBoats character-scaffold, agent-tooling, and GDD implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'character', 'rendering', 'webgl', 'ai-wiki', 'automation', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'WebGL', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-08-04',
		title: 'Converge PixelBoats water, weather, and living-world tools',
		summary:
			'Made the Field V4 sea read as waves, moved wake foam onto the simulation, and mapped the rain lab into deterministic game presets; parallel work consolidated seabirds into one instanced atlas and expanded the character and NPC-relationship workbenches without treating machine proof as visual acceptance.',
		source: 'PixelBoats water, rain, wildlife, character-foundry, and NPC-relationship implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'water', 'weather', 'wildlife', 'lore', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game'
		],
		relatedArticleTags: ['PixelBoats', 'Water Simulation', 'Game Development', 'PixiJS', 'developer workflow']
	},
	{
		date: '2026-08-03',
		title: 'Join PixelBoats progression and Field V4 water',
		summary:
			'Joined a versioned captain save spine to typed progression effects and attunement-defined lanes, then advanced Field V4 through spectral water, hull buoyancy, wake and fog integration, and Caribbean scenario teleports; the VFX lane also normalized a 65-asset sea pack around role-based loudness and peak targets.',
		source: 'PixelBoats progression, player-save, Field V4 water, world-scenario, and VFX-audio implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'progression', 'water', 'audio', 'worldgen', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Water Simulation', 'Game Development', 'PixiJS', 'developer workflow']
	},
	{
		date: '2026-07-31',
		title: 'Harden PixelBoats audio and Aurora navigation',
		summary:
			'Closed audio-context leaks, made condition crossfades and transient ducking deterministic, and kept the game bridge event-only; then removed fictional Aurora Audio controls, connected the lab to real engine data, corrected quick-action routes, and tightened Canopy subsite staging cleanup.',
		source: 'PixelBoats audio and Aurora implementation history plus Canopy release-script hardening',
		accent: '#38bdf8',
		tags: ['pixelboats', 'audio', 'aurora', 'accessibility', 'testing', 'sveltekit-php', 'automation', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'SvelteKit', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-07-30',
		title: 'Advance PixelBoats ship, water, and audio lanes',
		summary:
			'Consolidated Shipwright around per-vessel livery, a GPU ship-selection proof, and an explicit presentation seam; corrected the water-reflection lab with projected ground-plane water; and promoted Aurora Audio into shared engine APIs with a bounded game-event SFX bridge.',
		source: 'PixelBoats Shipwright, water-reflection, and adaptive-audio implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'shipwright', 'water', 'audio', 'pixijs', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Water Simulation', 'Game Development', 'PixiJS', 'developer workflow']
	},
	{
		date: '2026-07-24',
		title: 'Refine PixelBoats attunement and Aurora activity',
		summary:
			'Reworked the attunement lab into a responsive four-column design surface with a real badge-and-branch aura tree, analytics, stable equip-state geometry, and container-aware panels, then tightened Aurora activity-feed semantics, placeholder labeling, and narrow-layout truncation.',
		source: 'PixelBoats attunement-lab and Aurora activity-feed implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'ui', 'svelte', 'accessibility', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'SvelteKit', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-07-23',
		title: 'Build PixelBoats creation workbenches and character slices',
		summary:
			'Decomposed Foundry Guided onto the shared Aurora shell with a guided face workflow and multi-sheet picker, expanded the attunement lab into a validated design-and-playtest workbench, and carried the canonical character rig into a live sword slice while onboarding reusable face and hair parts.',
		source: 'PixelBoats Foundry Guided, attunement, and character-pipeline history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'ui', 'svelte', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'SvelteKit', 'developer workflow']
	},
	{
		date: '2026-07-22',
		title: 'Build PixelBoats collectibles, maps, and character rig',
		summary:
			'Onboarded a PixiJS collectibles archive and card-recovery lane, made theatre presets easier to create and compare in the map picker, and consolidated the character skeleton around one rig with grip sockets, foot roll, targeted IK fixes, and focused tests.',
		source: 'PixelBoats collectibles, map-generation, and character-rig history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'pixijs', 'ui', 'testing', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game'
		],
		relatedArticleTags: ['PixelBoats', 'Game Development', 'PixiJS', 'developer workflow']
	},
	{
		date: '2026-07-17',
		title: 'Join PixelBoats weather, water, and proof controls',
		summary:
			'Joined feathered weather zones, fog banks, wind-aligned swash, submerged-object tint, and celestial glint through the existing atmosphere and water contracts, then added player-facing weather alerts, exact save-state staging, and cleaner map/debug controls for the next visual proof pass.',
		source: 'PixelBoats overnight atmosphere, water, UI, and verification history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'water', 'ui', 'performance', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Water Simulation', 'Game Development', 'developer workflow']
	},
	{
		date: '2026-07-16',
		title: 'Advance PixelBoats night rendering and Aurora controls',
		summary:
			'Ingested a fuller cloud-material sheet into an inspected atlas and FX-card contract, connected moon state to night darkness, and tightened the Aurora tooling surface with reversible feature controls, clearer activity signals, and more focused workspace targets.',
		source: 'PixelBoats atmosphere/night and Aurora implementation history',
		accent: '#38bdf8',
		tags: ['pixelboats', 'game-dev', 'automation', 'frontend', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-water-pipeline-pixi-webgl',
			'pixelboats-morning-watch-2026-07-10',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'Water Simulation', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-07-14',
		title: 'Rebuild the Fugu article and social preview lane',
		summary:
			'Rebuilt the Fugu Fusion harness article as a clearer current guide with an archived June snapshot, regenerated article social cards for both blog identities, and hardened the build, deploy, and audit path so public preview images survive production activation.',
		source: 'Fugu article publication and social-preview deployment verification',
		accent: '#38bdf8',
		tags: ['blog', 'automation', 'ai', 'seo', 'sveltekit-php', 'developer workflow'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'local-fugu-coding-harness-june-2026',
			'gpt-readies-5-6-as-china-aboutfaces-on-claude',
			'pixelboats-morning-watch-2026-07-10'
		],
		relatedArticleTags: ['AI agents', 'SEO', 'SvelteKit', 'PixelBoats', 'developer workflow']
	},
	{
		date: '2026-07-09',
		title: 'Track agent security and pulse blocker',
		summary:
			'Confirmed the post-run GPT-5.6 and Claude Code security article publish on origin, checked today\'s generated PixelBoats composition-spike renderer pulse, and stopped its blog import at BLOG_PUBLISH_PARTIAL because the dedicated publisher worktree still contains broad unrelated churn.',
		source: 'Origin publish commit, PixelBoats pulse metadata, and publisher exception output',
		accent: '#38bdf8',
		tags: ['blog', 'automation', 'pixelboats', 'ai', 'claude-code', 'seo', 'developer workflow'],
		relatedArticleSlugs: [
			'gpt-readies-5-6-as-china-aboutfaces-on-claude',
			'deepseek-claude-code-windows-powershell',
			'local-fugu-coding-harness',
			'pixelboats-morning-watch-2026-07-03'
		],
		relatedArticleTags: ['AI agents', 'Claude Code', 'OpenAI', 'PixelBoats', 'SEO', 'developer workflow']
	},
	{
		date: '2026-07-08',
		title: 'Harden the July blog release lane',
		summary:
			'Merged the July blog release work into a cleaner branch state, consolidated duplicate PixelBoats morning-watch routes, refreshed social preview assets, hardened deploy commands, and kept today\'s generated PixelBoats pulse at BLOG_PUBLISH_PARTIAL because the dedicated publisher worktree is still dirty.',
		source: 'Blog release commits, PixelBoats pulse backstop, and deploy-script hardening',
		accent: '#38bdf8',
		tags: ['blog', 'automation', 'pixelboats', 'seo', 'sveltekit-php', 'developer workflow'],
		relatedArticleSlugs: [
			'build-the-astro-idea-on-windows-and-android-first',
			'pixelboats-morning-watch-2026-07-03',
			'keyword-astro-used-on-itself-local-aso-workflow',
			'qbo-mail-dashboard-productized-ops-workflow'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'PixelBoats', 'Product strategy', 'developer workflow']
	},
	{
		date: '2026-07-07',
		title: 'Record proof gates and pulse backstop',
		summary:
			'Captured the non-PixelBoats research queue as owner/action-gated instead of broad-research-gated, recorded local proof passes and manual validation blockers, and treated today\'s generated PixelBoats pulse as BLOG_PUBLISH_PARTIAL because the dedicated publisher worktree is dirty.',
		source: 'AI Wiki proof-gate handoff and PixelBoats pulse publisher backstop',
		accent: '#f4c273',
		tags: ['blog', 'automation', 'pixelboats', 'ai-wiki', 'sveltekit-php', 'seo', 'developer workflow'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'build-the-astro-idea-on-windows-and-android-first',
			'deepseek-claude-code-windows-powershell'
		],
		relatedArticleTags: ['AI agents', 'AI Wiki', 'PixelBoats', 'SvelteKit', 'SEO', 'developer workflow']
	},
	{
		date: '2026-07-06',
		title: 'Capture Astro strategy and pulse status',
		summary:
			'Published the Windows-and-Android-first Astro strategy note, repaired its source links to the canonical research library, and kept PixelBoats pulse publication status explicit after the July 3 source push remained deploy-partial and the July 6 backstop found no current-day pulse.',
		source: 'July 3 article commits, PixelBoats pulse publisher status, and July 6 pulse backstop',
		accent: '#2fa8a0',
		tags: ['blog', 'automation', 'pixelboats', 'keyword-astro', 'seo', 'sveltekit-php', 'developer workflow'],
		relatedArticleSlugs: [
			'build-the-astro-idea-on-windows-and-android-first',
			'pixelboats-morning-watch-2026-07-03',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['Product strategy', 'Windows', 'Android', 'PixelBoats', 'SEO', 'developer workflow']
	},
	{
		date: '2026-07-03',
		title: 'Publish the PixelBoats morning pulse',
		summary:
			'Published the NPC, pirate, and shipwreck lifecycle morning pulse as the next distinct PixelBoats P0 guardrail while leaving the earlier scale/collision watch as an update trail on the June 25 article.',
		source: 'PixelBoats daily fusion insights article',
		accent: '#f4c273',
		tags: ['pixelboats', 'automation', 'ai', 'game-dev', 'developer workflow'],
		relatedArticleSlugs: [
			'pixelboats-morning-watch-2026-07-03',
			'pixelboats-morning-watch-2026-06-25',
			'pixelboats-water-pipeline-pixi-webgl',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['PixelBoats', 'AI agents', 'developer workflow', 'Water Simulation']
	},
	{
		date: '2026-07-02',
		title: 'Publish July blog updates and pulse import',
		summary:
			'Published the July 2 blog runtime and article updates, removed a static-deploy note that was not ready to carry forward, and pushed the current PixelBoats morning pulse through an isolated publisher worktree while production activation stayed blocked on deploy host config.',
		source: 'July 2 blog update commits and PixelBoats pulse publisher',
		accent: '#f4c273',
		tags: ['blog', 'automation', 'pixelboats', 'seo', 'sveltekit-php', 'developer workflow'],
		relatedArticleSlugs: [
			'fable-is-back',
			'deepseek-claude-code-windows-powershell',
			'local-fugu-coding-harness'
		],
		relatedArticleTags: ['AI agents', 'PixelBoats', 'SvelteKit', 'SEO', 'developer workflow']
	},
	{
		date: '2026-06-29',
		title: 'Publish DeepSeek routing and code copy controls',
		summary:
			'Published a Windows PowerShell guide for routing Claude Code through DeepSeek, then tightened the article runtime with visual code-copy controls so technical notes are easier to use without weakening the privacy boundary around local agent setup.',
		source: 'DeepSeek Claude Code article and article runtime polish',
		accent: '#1e9bff',
		tags: ['blog', 'automation', 'deepseek', 'claude-code', 'windows', 'frontend', 'developer workflow'],
		relatedArticleSlugs: [
			'deepseek-claude-code-windows-powershell',
			'local-fugu-coding-harness',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'hermes-deepseek-setup'
		],
		relatedArticleTags: ['DeepSeek', 'AI agents', 'developer workflow', 'SvelteKit', 'Windows']
	},
	{
		date: '2026-06-25',
		title: 'Publish the Fugu harness and review the runtime surface',
		summary:
			'Moved the Local Fugu coding-harness article from draft framing into a published, visual build log, captured the PixelBoats pulse as a first-class automation signal, and recorded a local review pass across the blog and PHP-static adapter without exposing private source material.',
		source: 'Published Fugu article, PixelBoats pulse backstop, and local runtime review',
		accent: '#f4c273',
		tags: ['blog', 'automation', 'ai-wiki', 'hermes', 'pixelboats', 'sveltekit-php', 'seo'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'pixelboats-morning-watch-2026-06-25',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'pixelboats-water-pipeline-pixi-webgl',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'AI Wiki', 'developer workflow', 'PixelBoats', 'SvelteKit', 'SEO']
	},
	{
		date: '2026-06-24',
		title: 'Turn Fugu orchestration into a build log',
		summary:
			'Drafted a Local Fugu coding-harness build log, then added the memory-unification run and audit so the article captures the conductor role map, cross-family verification rule, single-slot local model queue, and the human review loop that caught a real bridge defect.',
		source: 'Local Fugu build-log draft and workbench memory audit',
		accent: '#a3e635',
		tags: ['blog', 'automation', 'ai-wiki', 'hermes', 'ai', 'research', 'developer workflow'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'hermes-deepseek-setup'
		],
		relatedArticleTags: ['AI', 'AI agents', 'AI Wiki', 'developer workflow', 'SvelteKit']
	},
	{
		date: '2026-06-22',
		title: 'Turn article publishing into dated routes',
		summary:
			'Added a GLM-5.2 Hermes delegation article, tightened the article publishing flow, aligned PHP-static build lanes, and introduced dated canonical article routes with tests so Ryan and Canopy can keep clearer crawl and sharing signals.',
		source: 'Weekend article publishing and routing hardening',
		accent: '#38bdf8',
		tags: ['blog', 'automation', 'ai', 'seo', 'sveltekit-php', 'canopy', 'developer workflow'],
		relatedArticleSlugs: [
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'glm-5-2-long-context-search-exposure',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'SvelteKit', 'SEO', 'Social media', 'developer workflow']
	},
	{
		date: '2026-06-19',
		title: 'Publish Nemotron and harden social metadata',
		summary:
			'Published the Nemotron production-setup article, added RSS/OG/Twitter parity across Ryan and Canopy routes, regenerated social-card metadata, and added structured-schema fixes for low-friction discovery.',
		source: 'Nemotron article release and metadata hardening',
		accent: '#0ea5e9',
		tags: ['blog', 'automation', 'ai', 'seo', 'sveltekit-php', 'canopy'],
		relatedArticleSlugs: [
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'how-chatgpt-performs-deep-research',
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'SvelteKit', 'SEO', 'Social media', 'developer workflow']
	},
	{
		date: '2026-06-18',
		title: 'Publish the GLM search-exposure note',
		summary:
			'Published a source-grounded GLM-5.2 article about long-context coding agents, search exposure, provider limits, and retrieval discipline, then refined the Canopy theme so the second public surface keeps a clearer branded reading lane.',
		source: 'Model research article and Canopy theme polish',
		accent: '#22c55e',
		tags: ['blog', 'automation', 'ai', 'research', 'seo', 'canopy', 'developer workflow'],
		relatedArticleSlugs: [
			'glm-5-2-long-context-search-exposure',
			'how-chatgpt-performs-deep-research',
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'a-love-of-digital-technology-bridges-canopy-into-the-fold'
		],
		relatedArticleTags: ['AI', 'AI agents', 'developer workflow', 'SEO', 'SvelteKit']
	},
	{
		date: '2026-06-16',
		title: 'Add the Canopy build identity lane',
		summary:
			'Added a Canopy-branded blog build with its own article, theme, deploy examples, RSS/sitemap identity handling, and PHP-static guardrails so the same content engine can ship a second public surface without mixing owner-only notes into the release lane.',
		source: 'Canopy blog build and PHP-static identity hardening',
		accent: '#7fd1b9',
		tags: ['blog', 'automation', 'sveltekit-php', 'canopy', 'seo', 'release', 'developer workflow'],
		relatedArticleSlugs: [
			'a-love-of-digital-technology-bridges-canopy-into-the-fold',
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'ship-fast-for-windows-microsoft-store-playbook',
			'openjarvis-local-ai-personal-ai-on-your-pc'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'developer workflow', 'AI', 'Windows Store']
	},
	{
		date: '2026-06-15',
		title: 'Ship the fallback article and release lane',
		summary:
			'Published the Fable fallback plan, corrected the article lane, tightened production verification around the PHP-static release path, and polished the site motion layer without turning private agent notes into public source material.',
		source: 'Weekend blog publishing and release hardening',
		accent: '#8cc8ff',
		tags: ['blog', 'automation', 'privacy', 'ai-wiki', 'sveltekit-php', 'developer workflow', 'frontend'],
		relatedArticleSlugs: [
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'hermes-deepseek-setup',
			'recover-deepseek-gui-conversations-after-update',
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'pixelboats-water-pipeline-pixi-webgl'
		],
		relatedArticleTags: ['AI agents', 'DeepSeek', 'AI Wiki', 'SvelteKit', 'developer workflow', 'PixelBoats']
	},
	{
		date: '2026-06-09',
		title: 'Publish a DeepSeek GUI recovery guide',
		summary:
			'Turned a raw DeepSeek GUI update-recovery note into a public, backup-first Windows guide with sanitized paths, stock imagery, source links, and safer cleanup guidance for local-first AI workspace users.',
		source: 'DeepSeek GUI recovery article release',
		accent: '#10b981',
		tags: ['blog', 'deepseek', 'windows', 'local-first', 'data recovery', 'developer workflow'],
		relatedArticleSlugs: [
			'recover-deepseek-gui-conversations-after-update',
			'hermes-deepseek-setup',
			'what-can-you-actually-do-with-a-deepseek-api-key'
		],
		relatedArticleTags: ['DeepSeek', 'Windows', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-06-09',
		title: 'Shift public controls into the static runtime',
		summary:
			'Moved article reading controls, copy actions, same-origin back links, scroll progress, and table-of-contents state into a small prerender-friendly runtime, then tightened locale routing so hash links stay local while translated paths remain prefixed.',
		source: 'Blog prerendered interactivity and locale routing',
		accent: '#9ad7a5',
		tags: ['blog', 'sveltekit-php', 'frontend', 'i18n', 'testing', 'automation'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
			'pixelboats-water-pipeline-pixi-webgl'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'developer workflow', 'PixelBoats']
	},
	{
		date: '2026-06-08',
		title: 'Map the multilingual and gated blog surface',
		summary:
			'Added locale-aware routing and French pilot content, cataloged the site with desktop/mobile screenshots, and hardened owner-gated auth controls so runtime failures surface in-page instead of leaking into console-only errors.',
		source: 'Blog i18n, catalog, and auth workflow',
		accent: '#8cc8ff',
		tags: ['blog', 'sveltekit-php', 'i18n', 'automation', 'privacy', 'testing'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'pixelboats-water-pipeline-pixi-webgl',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'AI', 'developer workflow', 'PixelBoats']
	},
	{
		date: '2026-06-05',
		title: 'Stabilize the blog delivery surface',
		summary:
			'Tightened the static/PHP rendering path, chased down hydration flicker, restored homepage article accents, and kept the article/research lanes searchable without exposing private source material.',
		source: 'Blog delivery and content workflow',
		accent: '#7fd1b9',
		tags: ['blog', 'sveltekit-php', 'frontend', 'automation', 'research'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['SvelteKit', 'AI', 'developer workflow', 'SEO']
	},
	{
		date: '2026-06-04',
		title: 'Ingest the PixelBoats rigging and sail-order lab',
		summary:
			'Added the latest rigging demo to the blog repo, captured the captain-order research path, and staged a draft article plus a library page for reusable references.',
		source: 'PixelBoats demo research',
		accent: '#00aeef',
		tags: ['pixelboats', 'desktop apps', 'sea loop', 'rigging'],
		relatedArticleSlugs: ['ship-fast-for-windows-microsoft-store-playbook', 'pixelboats-water-pipeline-pixi-webgl'],
		relatedArticleTags: ['PixelBoats', 'Water Simulation']
	},
	{
		date: '2026-05-30',
		title: 'Seed the public dev log',
		summary: 'Added a lightweight place for blog work, repo notes, and future command summaries.',
		source: 'Blog process',
		accent: '#1e9bff',
		tags: ['blog', 'process', 'automation'],
		relatedArticleSlugs: [],
		relatedArticleTags: ['blog']
	},
	{
		date: '2026-05-29',
		title: 'Keep unpublished work in its own lane',
		summary:
			'Added /drafts so unfinished pieces stay separate from the public homepage while still being easy to review.',
		source: 'SvelteKit route',
		accent: '#53b8ff',
		tags: ['workflow', 'drafts', 'sveltekit'],
		relatedArticleSlugs: [],
		relatedArticleTags: ['SvelteKit']
	},
	{
		date: '2026-05-29',
		title: 'Make article navigation feel continuous',
		summary:
			'Wired article titles into native view transitions so clicks move the title into the reading page instead of hard-cutting.',
		source: 'UX pass',
		accent: '#f2d27c',
		tags: ['ux', 'frontend', 'navigation'],
		relatedArticleSlugs: ['how-chatgpt-performs-deep-research'],
		relatedArticleTags: ['AI Wiki', 'SvelteKit']
	},
	{
		date: '2026-05-28',
		title: 'Pull the site accent from live signal',
		summary: 'Loaded the base color from the CN Tower lights feed and kept a blue fallback when the remote source is unavailable.',
		source: 'External data',
		accent: '#87dac4',
		tags: ['automation', 'signal', 'integration'],
		relatedArticleSlugs: ['ship-fast-for-windows-microsoft-store-playbook'],
		relatedArticleTags: ['Windows Store', 'Automation']
	},
	{
		date: '2026-05-27',
		title: 'Keep the content lane readable',
		summary:
			'Left the published surface focused on repair logs, research notes, and PixelBoats work instead of hiding everything behind a single generic blog feed.',
		source: 'AI Wiki',
		accent: '#ffcf77',
		tags: ['blog', 'content', 'readability'],
		relatedArticleSlugs: ['hermes-deepseek-setup'],
		relatedArticleTags: ['AI', 'Process']
	}
];

export const devLogEntries: DevLogEntry[] = devLogSeeds
	.map((entry) => ({
		id: makeDevLogId(entry),
		...entry,
		tags: uniqueContentTags(entry.tags),
		relatedArticleSlugs: Array.from(new Set(entry.relatedArticleSlugs ?? [])),
		relatedArticleTags: uniqueContentTags(entry.relatedArticleTags ?? []),
		dateLabel: formatDevLogDate(entry.date)
	}))
	.sort((left, right) => right.date.localeCompare(left.date) || right.title.localeCompare(left.title));

export const devLogTags = uniqueContentTags(devLogEntries.flatMap((entry) => entry.tags));

export function devLogMatchesTag(entry: DevLogEntry, tag: string): boolean {
	const target = tag.trim();
	if (!target) return true;

	return entry.tags.some((candidate) => contentTagsMatch(candidate, target));
}

export function devLogMatchesArticleSlug(entry: DevLogEntry, slug: string): boolean {
	const target = normalizeSlug(slug);
	if (!target) return true;
	return entry.relatedArticleSlugs.some((candidate) => normalizeSlug(candidate) === target);
}

function getDevLogEntriesForArticle(articleSlug: string, limit = 5): DevLogEntry[] {
	return devLogEntries.filter((entry) => devLogMatchesArticleSlug(entry, articleSlug)).slice(0, limit);
}

function formatDevLogDate(value: string): string {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}

function normalizeSlug(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\\/g, '')
		.replace(/\.md$/i, '')
		.replace(/\.[a-z0-9]+$/i, '')
		.replace(/_/g, '-')
		.replace(/\s+/g, '-');
}

function makeDevLogId(entry: DevLogSeed): string {
	return `${entry.date}-${slugify(entry.title)}-${entry.title.length}`;
}
