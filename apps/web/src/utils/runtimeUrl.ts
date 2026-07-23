type RuntimeEnv = Record<string, unknown> | undefined;

function configuredOrigin(env: RuntimeEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined): string | undefined {
  const value = env?.VITE_API_ORIGIN;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function browserOrigin(): string | undefined {
  if (typeof window === "undefined" || !window.location?.origin) return undefined;
  return window.location.origin;
}

/** Return protocol + host only, stripping any API path or trailing slash. */
export function getRuntimeOrigin(input?: string, locationOrigin = browserOrigin(), env?: RuntimeEnv): string {
  const source = input?.trim() || configuredOrigin(env) || locationOrigin;
  if (!source) {
    throw new Error("Unable to determine runtime origin: provide a browser origin or VITE_API_ORIGIN.");
  }
  const url = new URL(source);
  return url.origin;
}

/** Return the same-origin API base with exactly one /api suffix. */
export function getApiBaseUrl(input?: string, locationOrigin?: string, env?: RuntimeEnv): string {
  return `${getRuntimeOrigin(input, locationOrigin, env)}/api`;
}

/** Return the origin used by Socket.IO; Socket.IO owns its path/namespace. */
export function getSocketOrigin(input?: string, locationOrigin?: string, env?: RuntimeEnv): string {
  return getRuntimeOrigin(input, locationOrigin, env);
}

/** Build a Socket.IO namespace URL served below the API router. */
export function getSocketNamespaceUrl(
  origin: string | undefined,
  namespace: string,
  locationOrigin?: string,
  env?: RuntimeEnv,
): string {
  const normalizedNamespace = namespace.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedNamespace) {
    throw new Error("Socket namespace must not be empty.");
  }
  return `${getSocketOrigin(origin, locationOrigin, env)}/api/socket/${normalizedNamespace}`;
}

export const runtimeOrigin = getRuntimeOrigin;
export const apiBaseUrl = getApiBaseUrl;
export const socketOrigin = getSocketOrigin;
