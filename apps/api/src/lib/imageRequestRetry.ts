const transientGatewayStatus = /\b(502|503|504)\b/;

export async function retryImageGenerationRequest<T>(operation: () => Promise<T>, maxAttempts = 3, initialDelayMs = 1_000): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!transientGatewayStatus.test(error instanceof Error ? error.message : String(error)) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelayMs * attempt));
    }
  }

  throw lastError;
}
