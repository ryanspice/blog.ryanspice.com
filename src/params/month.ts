export function match(param: string): boolean {
	return /^(0[1-9]|1[0-2])$/.test(param);
}
