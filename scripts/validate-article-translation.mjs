#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

function arg(name) {
	const index = process.argv.indexOf(name);
	return index >= 0 ? process.argv[index + 1] : '';
}

function parseMarkdown(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) throw new Error('Markdown file is missing frontmatter.');
	return { frontmatter: match[1], body: match[2] };
}

function scalar(frontmatter, key) {
	return frontmatter.match(new RegExp(`^${key}:\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, 'm'))?.[1]?.trim() ?? '';
}

function fencedBlocks(body) {
	return [...body.matchAll(/```([^\r\n]*)\r?\n([\s\S]*?)```/g)].map((match) => ({
		language: match[1].trim(),
		code: match[2].replace(/\r\n/g, '\n').trimEnd()
	}));
}

function inlineCode(body) {
	return [...body.matchAll(/(?<!`)`([^`\r\n]+)`(?!`)/g)].map((match) => match[1]).sort();
}

function linkTargets(body) {
	return [...body.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]).sort();
}

function headingLevels(body) {
	return [...body.matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length);
}

function sameJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

async function main() {
	const sourcePath = arg('--source');
	const targetPath = arg('--target');
	if (!sourcePath || !targetPath) throw new Error('Usage: validate-article-translation.mjs --source <english.md> --target <french.md>');

	const source = parseMarkdown(await readFile(sourcePath, 'utf8'));
	const target = parseMarkdown(await readFile(targetPath, 'utf8'));
	const failures = [];

	if (scalar(target.frontmatter, 'locale') !== 'fr') failures.push('Target locale must be fr.');
	if (scalar(target.frontmatter, 'translation_status') !== 'review') failures.push('Target translation_status must remain review.');
	if (!scalar(target.frontmatter, 'translation_of')) failures.push('Target translation_of is required.');
	if (!sameJson(fencedBlocks(source.body), fencedBlocks(target.body))) failures.push('Fenced code blocks changed.');
	if (!sameJson(inlineCode(source.body), inlineCode(target.body))) failures.push('Inline code tokens changed.');
	if (!sameJson(linkTargets(source.body), linkTargets(target.body))) failures.push('Link or image targets changed.');
	if (!sameJson(headingLevels(source.body), headingLevels(target.body))) failures.push('Heading hierarchy changed.');

	if (failures.length) {
		console.error(JSON.stringify({ ok: false, failures }, null, 2));
		process.exitCode = 1;
		return;
	}

	console.log(JSON.stringify({ ok: true, checks: ['frontmatter', 'code-fences', 'inline-code', 'links', 'headings'] }));
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
