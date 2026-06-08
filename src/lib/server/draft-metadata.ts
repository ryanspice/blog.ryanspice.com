import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
	isHexColor,
	normalizeArticleStatus,
	splitFrontmatter,
	stringValue,
	updateFrontmatterText,
	type ArticleStatus,
	type FrontmatterUpdate
} from '$lib/article-frontmatter';
import { slugify } from '$lib/markdown';

const defaultOwnerEmailSha256 = 'a02b9da8783774e58760bd375e9e5b570bea1a88bb5ad8928b7298332ddbe140';

export type DraftMetadataSaveResult = {
	slug: string;
	message: string;
	fileName: string;
};

export async function assertOwnerAccessToken(token: string): Promise<void> {
	const cleanedToken = token.trim();
	if (!cleanedToken) {
		throw new Error('Missing Microsoft owner token.');
	}

	const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
		headers: {
			Authorization: `Bearer ${cleanedToken}`,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Microsoft owner token could not be verified.');
	}

	const profile = (await response.json()) as { mail?: string | null; userPrincipalName?: string | null };
	const candidates = [profile.mail, profile.userPrincipalName].map((value) => normalizeEmail(value));
	const ownerEmailSha256 = normalizeHash(process.env.BLOG_OWNER_EMAIL_SHA256) || defaultOwnerEmailSha256;

	if (!candidates.some((candidate) => hashEmail(candidate) === ownerEmailSha256)) {
		throw new Error('This Microsoft account is not allowed to edit draft metadata.');
	}
}

export async function saveDraftMetadata(slug: string, formData: FormData): Promise<DraftMetadataSaveResult> {
	const file = await findArticleFile(slug);
	const raw = await readFile(file.path, 'utf8');
	const { frontmatter } = splitFrontmatter(raw);
	const status = normalizeArticleStatus(readFormString(formData, 'status'));
	const publishDate = readFormString(formData, 'publish_date') || stringValue(frontmatter.release_date) || stringValue(frontmatter.date);
	const publishTime = readFormString(formData, 'publish_time') || stringValue(frontmatter.release_time) || '08:15';
	const accent = readFormString(formData, 'accent');

	validateStatusSchedule(status, publishDate, publishTime);

	if (accent && !isHexColor(accent)) {
		throw new Error('Accent must be a six-digit hex colour such as #7c5cff.');
	}

	const updates: FrontmatterUpdate = {
		status,
		updated_date: todayToronto(),
		accent,
		...publishUpdates(status, publishDate, publishTime),
		image: readVisualField(formData, 'image'),
		image_alt: readVisualField(formData, 'image_alt'),
		image_credit: readVisualField(formData, 'image_credit'),
		image_source: readVisualField(formData, 'image_source'),
		image_position: readVisualField(formData, 'image_position'),
		row_image: readVisualField(formData, 'row_image'),
		row_image_alt: readVisualField(formData, 'row_image_alt'),
		row_image_credit: readVisualField(formData, 'row_image_credit'),
		row_image_source: readVisualField(formData, 'row_image_source'),
		row_image_position: readVisualField(formData, 'row_image_position'),
		background_image: readVisualField(formData, 'background_image'),
		background_image_alt: readVisualField(formData, 'background_image_alt'),
		background_image_credit: readVisualField(formData, 'background_image_credit'),
		background_image_source: readVisualField(formData, 'background_image_source'),
		background_image_position: readVisualField(formData, 'background_image_position')
	};

	const next = updateFrontmatterText(raw, updates);
	await writeFile(file.path, next.replace(/\r?\n/g, '\n'), 'utf8');

	return {
		slug,
		fileName: path.basename(file.path),
		message: `Saved metadata for ${file.fileSlug}.`
	};
}

async function findArticleFile(slug: string): Promise<{ path: string; fileSlug: string }> {
	const safeSlug = slugify(slug);
	if (!safeSlug || safeSlug !== slug) {
		throw new Error('Invalid article slug.');
	}

	const contentRoot = process.env.BLOG_ARTICLE_SOURCE_ROOT || path.join(process.cwd(), 'src', 'lib', 'content', 'articles');
	const entries = await readdir(contentRoot, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
		const articlePath = path.join(contentRoot, entry.name);
		const raw = await readFile(articlePath, 'utf8');
		const { frontmatter } = splitFrontmatter(raw);
		const fileSlug = entry.name.replace(/\.md$/, '');
		const frontmatterSlug = stringValue(frontmatter.slug);
		if (frontmatterSlug === slug || fileSlug === slug) {
			return { path: articlePath, fileSlug: frontmatterSlug || fileSlug };
		}
	}

	throw new Error('Article source file was not found.');
}

function publishUpdates(status: ArticleStatus, publishDate: string, publishTime: string): FrontmatterUpdate {
	if (status === 'draft') {
		return {
			publish_at: '',
			release_date: '',
			release_time: ''
		};
	}

	return {
		date: publishDate,
		publish_at: `${publishDate}T${publishTime}`,
		release_date: publishDate,
		release_time: publishTime
	};
}

function validateStatusSchedule(status: ArticleStatus, publishDate: string, publishTime: string): void {
	if (status !== 'draft' && !/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) {
		throw new Error('Publish date must use YYYY-MM-DD.');
	}

	if (status !== 'draft' && !/^\d{2}:\d{2}$/.test(publishTime)) {
		throw new Error('Publish time must use HH:mm.');
	}
}

function readFormString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? cleanScalar(value) : '';
}

function readVisualField(formData: FormData, key: string): string {
	const value = readFormString(formData, key);
	if (!value) return '';
	if (/[\r\n<>]/.test(value)) {
		throw new Error(`${key} contains unsupported characters.`);
	}
	return value;
}

function cleanScalar(value: string): string {
	return value.trim().slice(0, 1200);
}

function todayToronto(): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Toronto',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(new Date());
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}

function normalizeEmail(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

function normalizeHash(value: string | null | undefined): string {
	const normalized = (value ?? '').trim().toLowerCase().replace(/^sha256:/, '');
	return /^[a-f0-9]{64}$/.test(normalized) ? normalized : '';
}

function hashEmail(value: string): string {
	return value ? createHash('sha256').update(value).digest('hex') : '';
}
