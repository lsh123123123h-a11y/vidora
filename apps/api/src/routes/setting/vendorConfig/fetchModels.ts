import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { fetchCompatibleModelIds } from "@/lib/openaiCompatibleModels";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    baseUrl: z.string().min(1),
    apiKey: z.string().min(1),
  }),
  async (req, res) => {
    try {
      const modelIds = await fetchCompatibleModelIds(req.body.baseUrl, req.body.apiKey);
      res.status(200).send(success({ models: modelIds }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to fetch models";
      res.status(400).send(error(message));
    }
  },
);
