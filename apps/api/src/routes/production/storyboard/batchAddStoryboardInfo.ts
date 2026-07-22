import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getProjectAssetRecords } from "@/lib/productionGenerationService";
import { normalizeProductionAssetIds } from "@/lib/productionGenerationPolicy";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    data: z.array(
      z.object({
        prompt: z.string(),
        duration: z.number(),
        track: z.string(),
        state: z.string(),
        src: z.string().nullable(),
        videoDesc: z.string(),
        shouldGenerateImage: z.number(),
        associateAssetsIds: z.array(z.number()),
      }),
    ),
    scriptId: z.number(),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { data, scriptId, projectId } = req.body;
    if (!data.length) return res.status(400).send({ success: false, message: "数据不能为空" });
    const script = await u.db("o_script").where({ id: scriptId, projectId }).first();
    if (!script) return res.status(400).send(error("剧本不存在或不属于当前项目"));
    try {
      const assets = await getProjectAssetRecords(projectId);
      for (const item of data) {
        item.associateAssetsIds = normalizeProductionAssetIds(item.associateAssetsIds ?? [], projectId, assets);
      }
    } catch (e) {
      return res.status(400).send(error(u.error(e).message));
    }

    await u.db.transaction(async (trx) => {
      for (const item of data) {
        const [id] = await trx("o_storyboard").insert({
          prompt: item.prompt,
          duration: String(item.duration),
          state: item.state,
          scriptId,
          projectId,
          track: item.track,
          videoDesc: item.videoDesc,
          shouldGenerateImage: item.shouldGenerateImage,
          createTime: Date.now(),
        });
        if (item.associateAssetsIds.length) {
          await trx("o_assets2Storyboard").insert(
            item.associateAssetsIds.map((assetId: number) => ({
              assetId,
              storyboardId: id,
            })),
          );
        }
        item.id = id;
      }

      const insertedByTrack = new Map<string, typeof data>();
      for (const item of data) {
        const group = insertedByTrack.get(item.track) ?? [];
        group.push(item);
        insertedByTrack.set(item.track, group);
      }
      for (const [track, items] of insertedByTrack) {
        const trackDuration = items.reduce((sum: number, item: any) => sum + Number(item.duration), 0);
        const [trackId] = await trx("o_videoTrack").insert({ scriptId, projectId, duration: trackDuration });
        await trx("o_storyboard")
          .whereIn(
            "id",
            items.map((item: any) => item.id),
          )
          .update({ trackId, track });
      }
    });
    const lastStoryboard = await u.db("o_storyboard").where("scriptId", scriptId);
    if (!lastStoryboard || !lastStoryboard.length) return res.status(400).send(error("未查到分镜数据"));
    const storyboardData = await Promise.all(
      lastStoryboard.map(async (i) => {
        return {
          associateAssetsIds: await u.db("o_assets2Storyboard").where("storyboardId", i.id).orderBy("rowid").select("assetId").pluck("assetId"),
          src: i.filePath ? await u.oss.getSmallImageUrl(i.filePath) : "",
          id: i.id,
          trackId: i.trackId,
          prompt: i.prompt,
          duration: Number(i.duration),
          state: i.state,
          scriptId: i.scriptId,
          reason: i.reason,
          videoDesc: i.videoDesc
        };
      }),
    );
    return res.status(200).send(success(storyboardData));
  },
);
