export function assertMediaGenerationResult(result: unknown): string {
  if (typeof result !== "string" || !result.trim()) {
    throw new Error("Image generation returned an empty result");
  }
  return result.trim();
}
