export function ObjectKeys<O extends object>(o: O): (keyof O)[] {
  return Object.keys(o) as (keyof O)[];
}
