type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function buildModelsUrl(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error("Base URL is invalid");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Base URL must use http or https");
  }
  if (url.username || url.password) {
    throw new Error("Base URL must not include credentials");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  if (!url.pathname.endsWith("/models")) {
    url.pathname = `${url.pathname}/models`;
  }
  return url.toString();
}

export function parseModelIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) {
    throw new Error("Provider response must contain a data array");
  }

  const ids = (payload as { data: unknown[] }).data
    .map((item) => (item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id.trim() : ""))
    .filter(Boolean);
  return [...new Set(ids)];
}

export async function fetchCompatibleModelIds(baseUrl: string, apiKey: string, request: FetchLike = fetch): Promise<string[]> {
  const response = await request(buildModelsUrl(baseUrl), {
    headers: { Authorization: `Bearer ${apiKey.replace(/^Bearer\s+/i, "").trim()}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Provider returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }

  const modelIds = parseModelIds(await response.json());
  if (!modelIds.length) {
    throw new Error("Provider returned an empty model list");
  }
  return modelIds;
}
