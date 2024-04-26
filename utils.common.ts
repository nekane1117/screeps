export function defaultTo<T>(value: T | null | undefined, defaultValue: T) {
  if (value === undefined || value === null) {
    return defaultValue;
  } else {
    return value;
  }
}
