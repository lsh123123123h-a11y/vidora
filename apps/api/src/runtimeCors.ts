export function isAllowedOrigin(origin: string | undefined, host: string | undefined, nodeEnv: string | undefined): boolean {
  if (nodeEnv === "dev" || !origin) return true;
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function allowDevelopmentCors(nodeEnv: string | undefined): boolean {
  return nodeEnv === "dev";
}
