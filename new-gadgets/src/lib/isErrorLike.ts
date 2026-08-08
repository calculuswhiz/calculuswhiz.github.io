/** @deprecated Did you mean to await the promise here? */
export function isErrorLike(value: Promise<unknown>): void;
/** Custom type-guard for error checking. */
export function isErrorLike(value: Exclude<unknown, Promise<unknown>>): value is Error;
export function isErrorLike(value: unknown): value is Error {
	return value instanceof Error;
}