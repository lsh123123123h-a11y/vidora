import path from "node:path";

export interface RuntimeConfig {
  host: string;
  port: number;
  dataDir: string;
  webDir: string;
}

export type RuntimeEnv = Record<string, string | undefined>;

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 10588;

export function readRuntimeConfig(env: RuntimeEnv, cwd: string): RuntimeConfig {
  const rawPort = env.PORT?.trim();
  const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${env.PORT}": expected an integer between 1 and 65535`);
  }

  return {
    host: env.HOST?.trim() || DEFAULT_HOST,
    port,
    dataDir: env.VIDORA_DATA_DIR || path.join(cwd, "data"),
    webDir: env.VIDORA_WEB_DIR || path.join(cwd, "public"),
  };
}
