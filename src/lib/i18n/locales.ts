export const DEFAULT_LOCALE = 'en' as const;
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, 'fr'] as const;
export const ROUTED_LOCALES = ['fr'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type RoutedLocale = (typeof ROUTED_LOCALES)[number];

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);
const ROUTED_LOCALE_SET = new Set<string>(ROUTED_LOCALES);

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
	return Boolean(value && SUPPORTED_LOCALE_SET.has(value));
}

export function isRoutedLocale(value: string | null | undefined): value is RoutedLocale {
	return Boolean(value && ROUTED_LOCALE_SET.has(value));
}

export function resolveLocale(value: string | null | undefined): SupportedLocale {
	return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function resolveLocaleFromPathname(pathname: string): SupportedLocale {
	const [firstSegment] = pathname.replace(/^\/+/, '').split('/');
	return isRoutedLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}

export function stripLocalePrefix(pathname: string): string {
	const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
	const [firstSegment, ...rest] = normalized.replace(/^\/+/, '').split('/');

	if (!isRoutedLocale(firstSegment)) return normalized || '/';
	const stripped = `/${rest.join('/')}`.replace(/\/+/g, '/');
	return stripped === '/' || stripped === '' ? '/' : stripped;
}

export function localePrefix(locale: SupportedLocale): '' | `/${RoutedLocale}` {
	return locale === DEFAULT_LOCALE ? '' : `/${locale as RoutedLocale}`;
}

export function pathWithLocale(locale: SupportedLocale, path: string): string {
	if (path.startsWith('#') || /^https?:\/\//.test(path)) return path;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const prefix = localePrefix(locale);
	if (!prefix) return normalizedPath;
	if (normalizedPath === '/') return `${prefix}/`;
	return `${prefix}${normalizedPath}`.replace(/\/+/g, '/');
}

export function localeToLanguageTag(locale: SupportedLocale): string {
	return locale === 'fr' ? 'fr-CA' : 'en';
}

export function localeToHreflang(locale: SupportedLocale): string {
	return localeToLanguageTag(locale);
}
