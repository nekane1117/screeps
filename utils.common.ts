export function defaultTo<T>(value: T | null | undefined, defaultValue: T) {
  if (value === undefined || value === null) {
    return defaultValue;
  } else {
    return value;
  }
}

export function ObjectKeys<T extends object>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}
