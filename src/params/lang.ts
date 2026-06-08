import { isRoutedLocale } from '$lib/i18n/locales';

export function match(param: string): boolean {
	return isRoutedLocale(param.toLowerCase());
}
