import u from "@/utils";
import { buildVideoPromptContext } from "@/lib/productionGenerationPolicy";
import { getProjectAssetRecords } from "@/lib/productionGenerationService";

export interface PromptSourceItem {
  id: number;
  sources: string;
}

export async function buildVideoPromptContextFromSources(
  projectId: number,
  modelName: string,
  info: PromptSourceItem[],
): Promise<string> {
  const storyboardIds = info.filter((item) => item.sources === "storyboard").map((item) => item.id);
  const explicitAssetIds = info.filter((item) => item.sources === "assets").map((item) => item.id);

  const storyboards = storyboardIds.length
    ? await u
        .db("o_storyboard")
        .where({ projectId })
        .whereIn("id", storyboardIds)
        .select("id", "videoDesc", "duration")
    : [];
  if (storyboards.length !== new Set(storyboardIds).size) throw new Error("部分分镜不存在或不属于当前项目。");

  const bindingRows = storyboardIds.length
    ? await u
        .db("o_assets2Storyboard")
        .whereIn("storyboardId", storyboardIds)
        .orderBy("rowid")
        .select("storyboardId", "assetId")
    : [];
  const bindings = new Map<number, number[]>();
  for (const row of bindingRows) {
    const storyboardId = Number(row.storyboardId);
    const assetId = Number(row.assetId);
    const list = bindings.get(storyboardId) ?? [];
    list.push(assetId);
    bindings.set(storyboardId, list);
  }

  const allAssets = await getProjectAssetRecords(projectId);
  const byId = new Map(allAssets.map((asset) => [asset.id, asset]));
  const referencedIds = [...new Set([...explicitAssetIds, ...bindingRows.map((row) => Number(row.assetId))])];
  const missing = referencedIds.filter((id) => !byId.has(id));
  if (missing.length) throw new Error(`分镜引用了不存在或跨项目的资产：${missing.join("、")}。`);

  const rootRoles = referencedIds.map((id) => byId.get(id)!).filter((asset) => asset.type === "role" && asset.assetsId == null);
  if (rootRoles.length) {
    throw new Error(`生产镜头不能直接引用基础角色：${rootRoles.map((asset) => asset.name || asset.id).join("、")}。请改绑到具体衍生定妆。`);
  }
  const unavailable = referencedIds
    .map((id) => byId.get(id)!)
    .filter((asset) => asset.imageState !== "已完成" || !asset.filePath);
  if (unavailable.length) {
    throw new Error(`以下资产没有已完成的选中图片：${unavailable.map((asset) => asset.name || asset.id).join("、")}。`);
  }

  const assets = referencedIds.map((id) => byId.get(id)!);
  const audioAssets = assets.filter((asset) => asset.type === "audio");
  const audioByRoleId: Record<number, number> = {};
  if (audioAssets.length) {
    const rows = await u
      .db("o_assetsRole2Audio")
      .whereIn(
        "assetsAudioId",
        audioAssets.map((asset) => asset.id),
      )
      .select("assetsAudioId", "assetsRoleId");
    for (const row of rows) audioByRoleId[Number(row.assetsRoleId)] = Number(row.assetsAudioId);
  }

  return buildVideoPromptContext({
    modelName,
    assets,
    storyboards: storyboards.map((storyboard) => ({
      ...storyboard,
      associateAssetsIds: bindings.get(Number(storyboard.id)) ?? [],
    })),
    audioByRoleId,
  });
}
