export function partition<TValue, TKey>(
  items: TValue[],
  keySelector: (item: TValue) => TKey,
): Map<TKey, TValue[]> {
  const result = new Map<TKey, TValue[]>();
  for (const item of items) {
    const key = keySelector(item);
    const existing = result.get(key);
    if (existing) {
      existing.push(item);
    } else {
      result.set(key, [item]);
    }
  }

  return result;
}
