#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ARTICLES_ROOT = path.resolve('src/lib/content/articles');
const REPORT_ROOT = path.resolve('report/i18n');
const DEFAULT_TARGET = 'fr';
const DEFAULT_TARGET_LANGUAGE = {
	fr: 'French (Canada)'
};

function parseArgs(argv) {
	const args = {
		dryRun: false
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--dry-run') {
			args.dryRun = true;
			continue;
		}
		if (arg.startsWith('--')) {
			const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
			const value = argv[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error(`Missing value for ${arg}`);
			}
			args[key] = value;
			index += 1;
		}
	}

	return args;
}

function usage() {
	return [
		'Usage:',
		'  node scripts/translate-article.mjs --source <slug> --target fr --dry-run',
		'  node scripts/translate-article.mjs --source <slug> --target fr --llm-output report/i18n/openjarvis.fr.body.md',
		'',
		'Options:',
		'  --source      Source English article slug. Required.',
		'  --target      Target locale. Defaults to fr.',
		'  --llm-output  Optional reviewed/LLM-produced Markdown body to place in the draft.',
		'  --dry-run     Print draft/report output and do not write files.'
	].join('\n');
}

function parseMarkdown(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		throw new Error('Source article is missing frontmatter.');
	}

	return {
		frontmatter: match[1],
		body: match[2].trim()
	};
}

function scalar(frontmatter, key, fallback = '') {
	const match = frontmatter.match(new RegExp(`^${key}:\\s*["']?([^"'\r\n]+)["']?\\s*$`, 'm'));
	return match?.[1]?.trim() ?? fallback;
}

function yamlString(value) {
	return JSON.stringify(value ?? '');
}

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function translationPrompt({ sourceSlug, target, targetLanguage, frontmatter, body }) {
	return [
		`Translate the article "${sourceSlug}" into ${targetLanguage}.`,
		'Keep Markdown structure, headings, links, images, tables, code fences, and inline code intact.',
		'Translate prose naturally for a technical Canadian French reader.',
		'Do not translate URLs, code identifiers, package names, command names, or product names.',
		'Preserve factual claims and uncertainty. Do not add new claims.',
		'Return only the translated Markdown body, not frontmatter.',
		'',
		'Source frontmatter:',
		'```yaml',
		frontmatter.trim(),
		'```',
		'',
		'Source Markdown:',
		'```markdown',
		body,
		'```',
		'',
		`Target locale: ${target}`
	].join('\n');
}

function draftFrontmatter({ sourceSlug, target, title, summary, draftType, date }) {
	return [
		'---',
		`title: ${yamlString(`[${target} review] ${title}`)}`,
		`slug: ${yamlString(sourceSlug)}`,
		`locale: ${yamlString(target)}`,
		`translation_of: ${yamlString(sourceSlug)}`,
		'translation_status: "review"',
		`canonical_slug: ${yamlString(sourceSlug)}`,
		'translations:',
		`  en: ${yamlString(sourceSlug)}`,
		'status: "draft"',
		`draft_type: ${yamlString(draftType)}`,
		`date: ${yamlString(date)}`,
		`updated_date: ${yamlString(date)}`,
		'version: "i18n-review"',
		`summary: ${yamlString(`[${target} review] ${summary}`)}`,
		'---'
	].join('\n');
}

function fallbackDraftBody({ sourceSlug, targetLanguage, prompt }) {
	return [
		`# Review translation draft for ${sourceSlug}`,
		'',
		`Paste the ${targetLanguage} Markdown body from the LLM/reviewer output below this line.`,
		'',
		'<!--',
		'LLM translation prompt used for this draft:',
		'',
		prompt,
		'-->'
	].join('\n');
}

function reviewReport({ sourceSlug, target, targetPath, usedLlmOutput, prompt }) {
	return [
		`# Translation review report: ${sourceSlug} -> ${target}`,
		'',
		`Generated: ${new Date().toISOString()}`,
		`Target draft: ${targetPath}`,
		`LLM/body source: ${usedLlmOutput ? 'external Markdown body file' : 'prompt-only scaffold'}`,
		'',
		'## Publish gate',
		'',
		'- Confirm the translation is complete and natural for the target locale.',
		'- Confirm links, image alt text, code fences, inline code, and tables survived unchanged where required.',
		'- Confirm title and summary are translated manually, not left as review placeholders.',
		'- Keep `status: "draft"` and `translation_status: "review"` until human review is complete.',
		'- Only after review, change `status` to `published` and `translation_status` to `published`.',
		'',
		'## Prompt',
		'',
		'```text',
		prompt,
		'```'
	].join('\n');
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const sourceSlug = args.source;
	const target = args.target ?? DEFAULT_TARGET;
	const targetLanguage = DEFAULT_TARGET_LANGUAGE[target] ?? target;

	if (!sourceSlug) {
		console.error(usage());
		process.exitCode = 1;
		return;
	}

	const sourcePath = path.join(ARTICLES_ROOT, `${sourceSlug}.md`);
	const targetDir = path.join(ARTICLES_ROOT, target);
	const targetPath = path.join(targetDir, `${sourceSlug}.md`);
	const reportPath = path.join(REPORT_ROOT, `${sourceSlug}.${target}.review.md`);
	const raw = await readFile(sourcePath, 'utf8');
	const { frontmatter, body } = parseMarkdown(raw);
	const prompt = translationPrompt({ sourceSlug, target, targetLanguage, frontmatter, body });
	const date = todayIso();
	const draftHeader = draftFrontmatter({
		sourceSlug,
		target,
		title: scalar(frontmatter, 'title', sourceSlug),
		summary: scalar(frontmatter, 'summary', ''),
		draftType: scalar(frontmatter, 'draft_type', 'technical-blog-post'),
		date
	});
	const translatedBody = args.llmOutput
		? (await readFile(path.resolve(args.llmOutput), 'utf8')).trim()
		: fallbackDraftBody({ sourceSlug, targetLanguage, prompt });
	const draftMarkdown = `${draftHeader}\n${translatedBody.trim()}\n`;
	const reportMarkdown = reviewReport({
		sourceSlug,
		target,
		targetPath,
		usedLlmOutput: Boolean(args.llmOutput),
		prompt
	});

	if (args.dryRun) {
		console.log(`# Dry run: ${sourceSlug} -> ${target}`);
		console.log(`Target draft: ${targetPath}`);
		console.log(`Review report: ${reportPath}`);
		console.log('');
		console.log('## Draft Markdown');
		console.log('');
		console.log(draftMarkdown);
		console.log('');
		console.log('## Review Report');
		console.log('');
		console.log(reportMarkdown);
		return;
	}

	await mkdir(targetDir, { recursive: true });
	await mkdir(REPORT_ROOT, { recursive: true });
	await writeFile(targetPath, draftMarkdown, 'utf8');
	await writeFile(reportPath, reportMarkdown, 'utf8');

	console.log(`Wrote review draft: ${targetPath}`);
	console.log(`Wrote review report: ${reportPath}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
