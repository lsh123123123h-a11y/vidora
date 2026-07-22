import u from "@/utils";
import {
  normalizeProductionAssetIds,
  ProductionAssetRecord,
  validateVideoSettings,
} from "@/lib/productionGenerationPolicy";

export async function getVideoModelDetail(modelId: string): Promise<any> {
  const [vendorId, modelName] = modelId.split(/:(.+)/);
  if (!vendorId || !modelName) throw new Error(`视频模型标识无效：${modelId}。`);
  const models = await u.vendor.getModelList(vendorId);
  const model = models.find((item: any) => item.modelName === modelName);
  if (!model) throw new Error(`未找到视频模型：${modelId}。`);
  return model;
}

export async function validateVideoRequestSettings(modelId: string, duration: number, resolution: string): Promise<void> {
  const model = await getVideoModelDetail(modelId);
  validateVideoSettings(model.durationResolutionMap ?? [], duration, resolution);
}

export async function getProjectAssetRecords(projectId: number): Promise<ProductionAssetRecord[]> {
  return u
    .db("o_assets")
    .leftJoin("o_image", "o_assets.imageId", "o_image.id")
    .where("o_assets.projectId", projectId)
    .select(
      "o_assets.id",
      "o_assets.projectId",
      "o_assets.type",
      "o_assets.name",
      "o_assets.assetsId",
      "o_assets.describe",
      "o_assets.prompt",
      "o_image.state as imageState",
      "o_image.filePath",
      "o_image.type as imageType",
    );
}

export async function resolveProductionAssetIds(projectId: number, requestedIds: number[]): Promise<number[]> {
  if (!requestedIds.length) return [];
  return normalizeProductionAssetIds(requestedIds, projectId, await getProjectAssetRecords(projectId));
}

export async function getResolvedProductionAssets(projectId: number, requestedIds: number[]): Promise<ProductionAssetRecord[]> {
  const allAssets = await getProjectAssetRecords(projectId);
  const ids = normalizeProductionAssetIds(requestedIds, projectId, allAssets);
  const byId = new Map(allAssets.map((asset) => [asset.id, asset]));
  return ids.map((id) => byId.get(id)!);
}
