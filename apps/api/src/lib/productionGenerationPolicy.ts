export interface DurationResolutionOption {
  duration?: number[] | null;
  resolution?: string[] | null;
}

export interface ProductionAssetRecord {
  id: number;
  projectId?: number | null;
  type?: string | null;
  name?: string | null;
  assetsId?: number | null;
  describe?: string | null;
  prompt?: string | null;
  imageState?: string | null;
  filePath?: string | null;
}

export interface VideoStoryboardContext {
  id?: number | null;
  videoDesc?: string | null;
  duration?: number | string | null;
  associateAssetsIds?: number[] | null;
}

export type ReferenceMediaType = "image" | "video" | "audio";

export function getReferenceLimits(mode: string | string[]): Partial<Record<ReferenceMediaType, number>> {
  let parsed: string | string[] = mode;
  if (typeof mode === "string" && mode.startsWith("[")) {
    try {
      parsed = JSON.parse(mode);
    } catch {
      throw new Error("视频参考模式格式无效。");
    }
  }
  if (parsed === "text") return { image: 0, video: 0, audio: 0 };
  if (parsed === "singleImage") return { image: 1, video: 0, audio: 0 };
  if (["startEndRequired", "endFrameOptional", "startFrameOptional"].includes(parsed as string)) {
    return { image: 2, video: 0, audio: 0 };
  }
  if (!Array.isArray(parsed)) return {};

  const typeMap: Record<string, ReferenceMediaType> = {
    imageReference: "image",
    videoReference: "video",
    audioReference: "audio",
  };
  const limits: Partial<Record<ReferenceMediaType, number>> = {};
  for (const entry of parsed) {
    const match = entry.match(/^(imageReference|videoReference|audioReference)(?::(\d+))?$/);
    if (!match) continue;
    limits[typeMap[match[1]]] = Number(match[2] || 1);
  }
  return limits;
}

export function validateReferenceCounts(mode: string | string[], references: { type: ReferenceMediaType }[]): void {
  const limits = getReferenceLimits(mode);
  const labels: Record<ReferenceMediaType, string> = { image: "图片", video: "视频", audio: "音频" };
  for (const type of ["image", "video", "audio"] as const) {
    const limit = limits[type];
    const count = references.filter((reference) => reference.type === type).length;
    if (limit != null && count > limit) throw new Error(`${labels[type]}参考最多允许 ${limit} 个，当前为 ${count} 个。`);
    if (limit == null && count > 0 && Object.keys(limits).length > 0) throw new Error(`当前模式不支持${labels[type]}参考。`);
  }
}

function usableOptions(options: DurationResolutionOption[]): { duration: number[]; resolution: string[] }[] {
  return options
    .map((option) => ({
      duration: [...new Set((option.duration ?? []).filter((value) => Number.isFinite(value)))].sort((a, b) => a - b),
      resolution: [...new Set((option.resolution ?? []).filter(Boolean))],
    }))
    .filter((option) => option.duration.length > 0 && option.resolution.length > 0);
}

export function resolveSupportedVideoSettings(
  options: DurationResolutionOption[],
  requestedDuration: number,
  requestedResolution: string,
): { duration: number; resolution: string; adjusted: boolean } {
  const usable = usableOptions(options);
  if (!usable.length) throw new Error("当前视频模型没有有效的时长与分辨率配置。");

  const resolution = usable.some((option) => option.resolution.includes(requestedResolution))
    ? requestedResolution
    : usable[0].resolution[0];
  const durations = [...new Set(usable.filter((option) => option.resolution.includes(resolution)).flatMap((option) => option.duration))].sort((a, b) => a - b);
  const fallback = durations[0];
  const target = Number.isFinite(requestedDuration) ? requestedDuration : fallback;
  const duration = durations.reduce((nearest, value) => {
    const delta = Math.abs(value - target);
    const nearestDelta = Math.abs(nearest - target);
    return delta < nearestDelta || (delta === nearestDelta && value > nearest) ? value : nearest;
  }, fallback);

  return {
    duration,
    resolution,
    adjusted: duration !== requestedDuration || resolution !== requestedResolution,
  };
}

export function validateVideoSettings(options: DurationResolutionOption[], duration: number, resolution: string): void {
  const usable = usableOptions(options);
  if (!usable.length) throw new Error("当前视频模型没有有效的时长与分辨率配置。");
  const resolutionOptions = usable.filter((option) => option.resolution.includes(resolution));
  if (!resolutionOptions.length) {
    const supported = [...new Set(usable.flatMap((option) => option.resolution))].join("、");
    throw new Error(`不支持的分辨率 ${resolution}，当前模型支持：${supported}。`);
  }
  const durations = [...new Set(resolutionOptions.flatMap((option) => option.duration))].sort((a, b) => a - b);
  if (!Number.isFinite(duration) || !durations.includes(duration)) {
    throw new Error(`不支持的视频时长 ${duration} 秒，${resolution} 支持：${durations.join("、")} 秒。`);
  }
}

function assertReadyAsset(asset: ProductionAssetRecord): void {
  if (asset.imageState !== "已完成" || !asset.filePath) {
    throw new Error(`资产“${asset.name || asset.id}”没有已完成的选中图片，不能用于生产。`);
  }
}

export function normalizeProductionAssetIds(requestedIds: number[], projectId: number, assets: ProductionAssetRecord[]): number[] {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const normalized: number[] = [];

  for (const assetId of requestedIds) {
    const asset = byId.get(assetId);
    if (!asset || asset.projectId !== projectId) throw new Error(`资产 ${assetId} 不存在或不属于当前项目。`);

    let selected = asset;
    if (asset.type === "role" && asset.assetsId == null) {
      const candidates = assets.filter(
        (candidate) =>
          candidate.projectId === projectId &&
          candidate.type === "role" &&
          candidate.assetsId === asset.id &&
          candidate.imageState === "已完成" &&
          Boolean(candidate.filePath),
      );
      if (!candidates.length) throw new Error(`基础角色“${asset.name || asset.id}”没有已完成的直接衍生角色。请先生成默认剧情定妆。`);
      if (candidates.length > 1) throw new Error(`基础角色“${asset.name || asset.id}”存在多个已完成的直接衍生角色，请在分镜中明确选择具体定妆。`);
      selected = candidates[0];
    } else if (asset.type === "role") {
      const parent = asset.assetsId == null ? undefined : byId.get(asset.assetsId);
      if (!parent || parent.type !== "role" || parent.assetsId != null) {
        throw new Error(`角色“${asset.name || asset.id}”只能引用根角色的直接衍生角色。`);
      }
    }

    assertReadyAsset(selected);
    if (!normalized.includes(selected.id)) normalized.push(selected.id);
  }
  return normalized;
}

export function buildVideoPromptContext(input: {
  modelName: string;
  assets: ProductionAssetRecord[];
  storyboards: VideoStoryboardContext[];
  audioByRoleId?: Record<number, number>;
}): string {
  const availableAssets = input.assets.filter((asset) => asset.filePath);
  const roleLocks = availableAssets
    .filter((asset) => asset.type === "role")
    .map((asset) => ({
      assetId: asset.id,
      rootRoleId: asset.assetsId,
      name: asset.name || "未命名角色",
      identity: asset.describe || "",
      fixedAppearance: asset.prompt || "",
    }));
  const assetContext = availableAssets.map((asset) => ({
    id: asset.id,
    type: asset.type,
    name: asset.name,
    parentAssetId: asset.assetsId,
    describe: asset.describe || "",
    prompt: asset.prompt || "",
    audioAssetId: input.audioByRoleId?.[asset.id],
  }));
  const storyboardContext = input.storyboards.map((storyboard) => ({
    storyboardId: storyboard.id,
    videoDesc: storyboard.videoDesc || "",
    duration: Number(storyboard.duration) || 0,
    assetIds: storyboard.associateAssetsIds ?? [],
  }));

  return `**模型名称**：${input.modelName}

**角色连续性锁（最高优先级）**：
同一衍生角色资产 ID 在所有相邻镜头中必须保持完全相同的脸部、发型、服装、鞋子和配饰。不得根据场景自行换装，不得补写参考资料中不存在的衣服。只有分镜明确改绑到另一个衍生角色资产 ID 时，才允许造型变化。
${JSON.stringify(roleLocks)}

**可用资产及其权威视觉设定**：
${JSON.stringify(assetContext)}

**分镜与资产绑定**：
${JSON.stringify(storyboardContext)}

生成提示词时必须按每条分镜的 assetIds 使用上面的资产设定；不要声称看到了未提供给文本模型的图片，也不要自行推测角色穿着。`;
}
