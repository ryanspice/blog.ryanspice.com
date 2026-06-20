export function match(param: string): boolean {
	return /^(0[1-9]|[12]\d|3[01])$/.test(param);
}
