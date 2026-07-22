export interface DurationResolutionOption {
  duration?: number[];
  resolution?: string[];
}

export function resolveSupportedVideoSettings(
  options: DurationResolutionOption[],
  requestedDuration: number,
  requestedResolution: string,
): { duration: number; resolution: string; adjusted: boolean } {
  const usable = options
    .map((option) => ({
      duration: [...new Set((option.duration ?? []).filter(Number.isFinite))].sort((a, b) => a - b),
      resolution: [...new Set((option.resolution ?? []).filter(Boolean))],
    }))
    .filter((option) => option.duration.length && option.resolution.length);
  if (!usable.length) return { duration: requestedDuration, resolution: requestedResolution, adjusted: false };

  const resolution = usable.some((option) => option.resolution.includes(requestedResolution)) ? requestedResolution : usable[0].resolution[0];
  const durations = [...new Set(usable.filter((option) => option.resolution.includes(resolution)).flatMap((option) => option.duration))].sort((a, b) => a - b);
  const target = Number.isFinite(requestedDuration) ? requestedDuration : durations[0];
  const duration = durations.reduce((nearest, value) => {
    const delta = Math.abs(value - target);
    const nearestDelta = Math.abs(nearest - target);
    return delta < nearestDelta || (delta === nearestDelta && value > nearest) ? value : nearest;
  }, durations[0]);
  return { duration, resolution, adjusted: duration !== requestedDuration || resolution !== requestedResolution };
}

export function getModeReferenceLimits(mode: string | string[]): Partial<Record<"image" | "video" | "audio", number>> {
  let parsed: string | string[] = mode;
  if (typeof mode === "string" && mode.startsWith("[")) {
    try {
      parsed = JSON.parse(mode);
    } catch {
      return {};
    }
  }
  if (parsed === "text") return { image: 0, video: 0, audio: 0 };
  if (parsed === "singleImage") return { image: 1, video: 0, audio: 0 };
  if (["startEndRequired", "endFrameOptional", "startFrameOptional"].includes(parsed as string)) return { image: 2, video: 0, audio: 0 };
  if (!Array.isArray(parsed)) return {};
  const typeMap = { imageReference: "image", videoReference: "video", audioReference: "audio" } as const;
  const limits: Partial<Record<"image" | "video" | "audio", number>> = {};
  for (const entry of parsed) {
    const match = entry.match(/^(imageReference|videoReference|audioReference)(?::(\d+))?$/);
    if (match) limits[typeMap[match[1] as keyof typeof typeMap]] = Number(match[2] || 1);
  }
  return limits;
}
