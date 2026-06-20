import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteId = siteIndex >= 0 ? args[siteIndex + 1] : '';

if (!siteId) {
	console.error('Usage: node scripts/Read-SiteBuildConfig.mjs --site <ryan|canopy>');
	process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'src', 'lib', 'site-config.ts');
const source = fs.readFileSync(configPath, 'utf8');

function findMatching(sourceText, openIndex, openChar, closeChar) {
	let depth = 0;
	let quote = '';
	let escaped = false;

	for (let index = openIndex; index < sourceText.length; index += 1) {
		const char = sourceText[index];

		if (quote) {
			if (escaped) {
				escaped = false;
			} else if (char === '\\') {
				escaped = true;
			} else if (char === quote) {
				quote = '';
			}
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			continue;
		}

		if (char === openChar) depth += 1;
		if (char === closeChar) {
			depth -= 1;
			if (depth === 0) return index;
		}
	}

	return -1;
}

function siteObjectSource(site) {
	const siteMatch = new RegExp(`\\b${site}\\s*:`).exec(source);
	if (!siteMatch) throw new Error(`Missing site config for ${site}`);

	const openIndex = source.indexOf('{', siteMatch.index);
	const closeIndex = findMatching(source, openIndex, '{', '}');
	if (openIndex < 0 || closeIndex < 0) throw new Error(`Unable to parse site config for ${site}`);

	return source.slice(openIndex, closeIndex + 1);
}

function stringArrayField(objectSource, fieldName) {
	const fieldMatch = new RegExp(`\\b${fieldName}\\s*:`).exec(objectSource);
	if (!fieldMatch) return [];

	const openIndex = objectSource.indexOf('[', fieldMatch.index);
	const closeIndex = findMatching(objectSource, openIndex, '[', ']');
	if (openIndex < 0 || closeIndex < 0) throw new Error(`Unable to parse ${fieldName}`);

	const arraySource = objectSource.slice(openIndex + 1, closeIndex);
	return Array.from(arraySource.matchAll(/['"]([^'"]+)['"]/g), (match) =>
		match[1].replace(/\\(['"`\\])/g, '$1')
	);
}

const configSource = siteObjectSource(siteId);
const canonicalRedirectHosts = stringArrayField(configSource, 'canonicalRedirectHosts');
const publicRouteExclusions = stringArrayField(configSource, 'publicRouteExclusions');

process.stdout.write(`${JSON.stringify({ canonicalRedirectHosts, publicRouteExclusions })}\n`);
