const AGENT_REQUEST_TIMEOUT_MS = 120_000;

export function withAgentRequestTimeout(abortSignal?: AbortSignal, timeoutMs = AGENT_REQUEST_TIMEOUT_MS): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return abortSignal ? AbortSignal.any([abortSignal, timeoutSignal]) : timeoutSignal;
}
