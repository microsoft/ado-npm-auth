export function ifString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  throw new Error(`Expected a string but got: ${JSON.stringify(value)}`);
}

export type MapLike = {
  get(key: string): unknown;
};

export function getConfigString(
  config: MapLike | undefined,
  key: string,
  required: true,
): string;
export function getConfigString(
  config: MapLike | undefined,
  key: string,
  required?: false,
): string | undefined;
export function getConfigString(
  config: MapLike | undefined,
  key: string,
  required = false,
): string | undefined {
  const value = config?.get(key);
  if (typeof value === "string") {
    return value;
  } else if (required) {
    throw new Error(`Expected configuration key "${key}" to be a string`);
  }
  return undefined;
}

export function getConfigMap(
  config: MapLike | undefined,
  key: string,
): MapLike | undefined {
  const value = config?.get(key);
  if (value && (value as MapLike).get !== undefined) {
    return value as MapLike;
  }
  return undefined;
}
