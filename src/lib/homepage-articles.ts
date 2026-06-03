import type { Article } from './articles';

// Public-only metadata fallback for the homepage.
// This prevents PHP-static hydration issues from blanking the article list on refresh.
export const homepageArticles = [
	{
		title: 'ChatGPT Deep Research vs. DeepSeek: What’s Actually Happening Under the Hood',
		slug: 'how-chatgpt-performs-deep-research',
		status: 'published',
		draftType: 'research-analysis',
		summary:
			'A practical comparison of ChatGPT Deep Research and DeepSeek-style reasoning APIs, focused on workflow, retrieval, transparency, and what builders should actually take away.',
		tags: ['openai', 'chatgpt', 'deep research', 'deepseek', 'reasoning models', 'developer workflow'],
		date: '2026-05-30',
		dateLabel: 'May 30, 2026',
		updatedDate: '2026-05-30',
		updatedDateLabel: 'May 30, 2026',
		readingMinutes: 7,
		design: {
			accent: '#7c5cff',
			tags: ['ChatGPT', 'Deep Research', 'DeepSeek', 'Reasoning Models', 'LLMs', 'Agentic Workflows']
		}
	},
	{
		title: 'Ship Fast, But for Windows: Adapting the Mobile App Factory Playbook to the Microsoft Store',
		slug: 'ship-fast-for-windows-microsoft-store-playbook',
		status: 'published',
		draftType: 'product-strategy',
		summary: 'A Windows-focused adaptation of the mobile app factory playbook for the Microsoft Store.',
		tags: ['Windows', 'Microsoft Store', 'indie apps', 'distribution', 'product strategy', 'AI'],
		date: '2026-05-30',
		dateLabel: 'May 30, 2026',
		updatedDate: '2026-05-30',
		updatedDateLabel: 'May 30, 2026',
		readingMinutes: 7,
		design: {
			accent: '#53b8ff',
			tags: ['Windows', 'Microsoft Store', 'Indie Apps', 'Distribution', 'Product Strategy', 'AI']
		}
	},
	{
		title:
			'Phaser vs PixiJS in 2026: Why I Chose the Rendering Library Over the Game Framework for a Water-Heavy 2.5D Seafaring Game',
		slug: 'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
		status: 'published',
		draftType: 'technical-decision-log',
		summary:
			"A detailed comparison of Phaser 4.1 and PixiJS 8.18 for a browser-based multiplayer roguelike sailing game with custom water rendering. Why the default choice (Phaser) turned out to be wrong for this project, and how PixiJS's lower-level rendering primitives map more directly to what I'm actually building.",
		tags: [
			'Phaser',
			'PixiJS',
			'WebGPU',
			'game engine comparison',
			'2.5D rendering',
			'water simulation',
			'multiplayer',
			'Colyseus',
			'indie game dev',
			'technical decision'
		],
		date: '2026-05-29',
		dateLabel: 'May 29, 2026',
		updatedDate: '2026-05-29',
		updatedDateLabel: 'May 29, 2026',
		readingMinutes: 5,
		design: {
			accent: '#87dac4',
			tags: [
				'Phaser',
				'PixiJS',
				'WebGPU',
				'Game Engine Comparison',
				'2.5D Rendering',
				'Water Simulation',
				'Multiplayer',
				'Colyseus',
				'Indie Game Dev'
			]
		}
	},
	{
		title: 'Debugging GIMP 3 Python Plug-in Failures on Windows: When the Culprit Wasn’t GIMP',
		slug: 'debugging-gimp-3-python-plugin-failures-windows-windhawk',
		status: 'published',
		draftType: 'technical-blog-post',
		summary:
			'A companion debugging article about GIMP 3 Python plug-in failures on Windows, the misleading libgraphite2/_Unwind_Resume symptom, Pango/GI failures, PATH/DLL pollution, and the Windhawk hook layer.',
		tags: [
			'gimp',
			'gimp-3',
			'windows-11',
			'windhawk',
			'python-plugins',
			'pango',
			'dll-debugging',
			'desktop-tooling',
			'troubleshooting',
			'pixelboats'
		],
		date: '2026-05-28',
		dateLabel: 'May 28, 2026',
		updatedDate: '2026-05-28',
		updatedDateLabel: 'May 28, 2026',
		readingMinutes: 5,
		design: {
			accent: '#ffcf77',
			tags: ['GIMP', 'GIMP 3', 'Windows 11', 'Windhawk', 'DLL Debugging', 'Python', 'Troubleshooting']
		}
	},
	{
		title: 'Repairing a Broken GIMP 3 Install and Turning It Into a Pixel Art Workstation',
		slug: 'gimp-3-repair-photogimp-pixelboats-workstation',
		status: 'published',
		draftType: 'technical-blog-post',
		summary:
			"A real-world repair log and workflow writeup covering a broken GIMP 3.2 install, Windows DLL/runtime conflicts, Windhawk suspicion, PhotoGIMP, G'MIC-Qt, a Fluent-ish theme, and a PixelBoats-ready asset kit.",
		tags: ['gimp', 'windows-11', 'pixel-art', 'photogimp', 'gmic', 'windhawk', 'dll-debugging', 'pixelboats', 'creative-tooling'],
		date: '2026-05-28',
		dateLabel: 'May 28, 2026',
		updatedDate: '2026-05-28',
		updatedDateLabel: 'May 28, 2026',
		readingMinutes: 5,
		design: {
			accent: '#f2d27c',
			tags: ['GIMP', 'GIMP 3', 'Windows 11', 'Pixel Art', 'Windhawk', 'DLL Debugging', 'PhotoGIMP', "G'MIC", 'PixelBoats']
		}
	}
] as Article[];
