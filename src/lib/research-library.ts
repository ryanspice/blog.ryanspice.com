export type ResearchLibraryImagePresentation = 'row' | 'focal';

export type ResearchLibraryVisual = {
	src: string;
	alt: string;
	credit?: string;
	sourceHref?: string;
	position?: string;
	cardPosition?: string;
	presentation?: ResearchLibraryImagePresentation;
};

export type ResearchLibraryVisuals = {
	image?: ResearchLibraryVisual;
};

export type ResearchLibraryItem = {
	title: string;
	authors?: string;
	year?: string;
	sourceType: 'paper' | 'book' | 'official-docs' | 'reference' | 'article' | 'standard';
	url: string;
	domains: string[];
	usedBy: string[];
	note: string;
	visuals?: ResearchLibraryVisuals;
};

export const researchLibraryItems: ResearchLibraryItem[] = [
	{
		title: 'Simulating Ocean Water',
		authors: 'Jerry Tessendorf',
		year: '2001',
		sourceType: 'paper',
		url: 'https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf',
		domains: ['water rendering', 'FFT waves', 'game rendering'],
		usedBy: ['pixelboats-water-pipeline-pixi-webgl', 'pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Core reference for spectral/ocean wave thinking and the separation between simulation and presentation.'
	},
	{
		title: 'GPU Gems Chapter 1: Effective Water Simulation from Physical Models',
		authors: 'Mark Finch',
		year: '2004',
		sourceType: 'book',
		url: 'https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models',
		domains: ['water rendering', 'normal maps', 'shader passes'],
		usedBy: ['pixelboats-water-pipeline-pixi-webgl'],
		note: 'Useful grounding for layered water motion: coarse body motion plus finer normal/detail passes.'
	},
	{
		title: 'Water Flow in Portal 2',
		authors: 'Valve / Alex Vlachos',
		year: '2010',
		sourceType: 'article',
		url: 'https://advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf',
		domains: ['flow maps', 'water rendering', 'real-time rendering'],
		usedBy: ['pixelboats-water-pipeline-pixi-webgl'],
		note: 'Reference for flow-map steering, phase offsets, and avoiding obvious texture repetition.'
	},
	{
		title: 'PixiJS Mesh documentation',
		sourceType: 'official-docs',
		url: 'https://pixijs.download/release/docs/scene.Mesh.html',
		domains: ['PixiJS', 'mesh rendering', 'game architecture'],
		usedBy: ['pixelboats-water-pipeline-pixi-webgl', 'pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Primary API reference for using meshes when sprites are too limited for world-space water or projected surfaces.'
	},
	{
		title: 'PixiJS RenderLayer documentation',
		sourceType: 'official-docs',
		url: 'https://pixijs.download/release/docs/scene.RenderLayer.html',
		domains: ['PixiJS', 'render layers', 'draw order'],
		usedBy: ['pixelboats-water-pipeline-pixi-webgl', 'pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Relevant to the rig demo because mast, sail, rope, HUD, and world layers need deliberate draw ordering.'
	},
	{
		title: 'Point of sail',
		sourceType: 'reference',
		url: 'https://en.wikipedia.org/wiki/Point_of_sail',
		domains: ['sailing', 'wind angle', 'game mechanics'],
		usedBy: ['pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Shared vocabulary for running, reaching, close-hauled, and no-go angle decisions.'
	},
	{
		title: 'Tacking (sailing)',
		sourceType: 'reference',
		url: 'https://en.wikipedia.org/wiki/Tacking_(sailing)',
		domains: ['sailing', 'helm orders', 'windward movement'],
		usedBy: ['pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Useful for distinguishing desired destination from actual helm order when the destination is too close to the wind.'
	},
	{
		title: 'Square rig',
		sourceType: 'reference',
		url: 'https://en.wikipedia.org/wiki/Square_rig',
		domains: ['square rigging', 'yards', 'bracing'],
		usedBy: ['pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Baseline vocabulary for yards, braces, square sails, and why a square-rigged vessel should not behave like a modern yacht.'
	},
	{
		title: 'Reefing',
		sourceType: 'reference',
		url: 'https://en.wikipedia.org/wiki/Reefing',
		domains: ['sailing', 'sail reduction', 'weather mechanics'],
		usedBy: ['pixelboats-rigging-sail-orders-demo-draft'],
		note: 'Reference for reducing sail area under heavy weather; mapped into topgallant/topsail/course reduction rules.'
	},
	{
		title: 'AGENTS.md',
		sourceType: 'standard',
		url: 'https://agents.md/',
		domains: ['agent workflows', 'repo instructions', 'AI-assisted development'],
		usedBy: ['agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns'],
		note: 'Included as part of the broader blog research library for agent-workflow and repo-instruction articles.'
	}
];

export const researchDomains = Array.from(new Set(researchLibraryItems.flatMap((item) => item.domains))).sort((left, right) =>
	left.localeCompare(right)
);

export const sourceTypes = Array.from(new Set(researchLibraryItems.map((item) => item.sourceType))).sort((left, right) => left.localeCompare(right));
