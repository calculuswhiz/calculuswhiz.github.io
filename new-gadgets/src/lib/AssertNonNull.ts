export function _nn<T>(value: T | null | undefined, message?: string): NonNullable<T> {
  if (value === null || value === undefined)
    throw new Error(message ?? "Value is null or undefined");

  return value;
}