import fs from 'node:fs/promises';
import path from 'node:path';

export async function testGeneratorAliases({ workspaceRoot, logRoot, run, record }) {
	const generator = await fs.readFile(path.join(workspaceRoot, 'scripts', 'Build-PrivateContent.mjs'));
	for (const kind of ['build', 'static']) {
	for (const prefix of ['', '..']) {
		const caseRoot = path.join(workspaceRoot, 'output', `alias-case-${prefix}${kind}`);
		const project = path.join(caseRoot, 'project');
		const payload = path.join(caseRoot, 'payload');
		const nested = path.join(payload, `${prefix}public-${kind}`);
		await fs.mkdir(path.join(project, 'scripts'), { recursive: true });
		await fs.mkdir(nested, { recursive: true });
		await fs.writeFile(path.join(project, 'scripts', 'Build-PrivateContent.mjs'), generator);
		await fs.writeFile(path.join(payload, 'manifest.json'), JSON.stringify({
			privateDraftPayload: true, packet: 'blog-repair-draft-confidentiality-and-microsoft-csp'
		}));
		const sentinel = path.join(nested, 'preserved.txt');
		await fs.writeFile(sentinel, 'preserve-public-alias');
		const alias = path.join(project, kind === 'build' ? 'public-build-alias' : 'static');
		await fs.symlink(nested, alias, process.platform === 'win32' ? 'junction' : 'dir');
		try {
			const status = await run(path.join(project, 'scripts', 'Build-PrivateContent.mjs'),
				path.join(logRoot, `reject-${prefix}${kind}-alias.log`), {
					PUBLIC_SITE_ID: 'ryan', BLOG_PRIVATE_CONTENT_OUT: payload,
					ADAPTER_OUT: kind === 'build' ? alias : path.join(project, 'build')
				});
			record(`private generator rejects resolved ${prefix}${kind} descendant`, status !== 0);
			record(`rejected ${prefix}${kind} alias preserves public data`,
				(await fs.readFile(sentinel, 'utf8')) === 'preserve-public-alias');
		} finally { await fs.unlink(alias); }
	}
	}
}
