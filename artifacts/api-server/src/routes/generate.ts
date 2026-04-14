import { Router, type IRouter } from "express";
import { db, wallpapersTable } from "@workspace/db";
import { GenerateWallpaperBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function generateWithFal(prompt: string, width: number, height: number): Promise<{ imageUrl: string; width: number; height: number }> {
  const FAL_KEY = process.env.FAL_API_KEY;

  if (!FAL_KEY) {
    throw new Error("FAL_API_KEY not configured");
  }

  const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: { width, height },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, err }, "Fal.ai generation failed");
    throw new Error(`Fal.ai error: ${response.status} - ${err}`);
  }

  const data = await response.json() as { images: { url: string; width: number; height: number }[] };

  if (!data.images?.[0]) {
    throw new Error("No image returned from Fal.ai");
  }

  return {
    imageUrl: data.images[0].url,
    width: data.images[0].width ?? width,
    height: data.images[0].height ?? height,
  };
}

router.post("/generate", async (req, res): Promise<void> => {
  const parsed = GenerateWallpaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, width = 3840, height = 2160, category = "Abstract" } = parsed.data;

  let resolution = "4K";
  if (width >= 7680 || height >= 4320) resolution = "8K";
  else if (width >= 3840 || height >= 2160) resolution = "4K";
  else if (width >= 1920 || height >= 1080) resolution = "1080p";

  let imageUrl: string;
  let actualWidth: number;
  let actualHeight: number;

  try {
    const result = await generateWithFal(prompt, Math.min(width, 1024), Math.min(height, 1024));
    imageUrl = result.imageUrl;
    actualWidth = width;
    actualHeight = height;
  } catch (err) {
    req.log.error({ err }, "AI generation failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed" });
    return;
  }

  const title = prompt.length > 60 ? prompt.slice(0, 57) + "..." : prompt;

  const [wallpaper] = await db.insert(wallpapersTable).values({
    title,
    description: `AI-generated: ${prompt}`,
    imageUrl,
    thumbnailUrl: imageUrl,
    downloadUrl: imageUrl,
    category,
    resolution,
    width: actualWidth,
    height: actualHeight,
    tags: ["ai-generated", category.toLowerCase(), "flux"],
    isAiGenerated: true,
    isFeatured: false,
    downloadCount: 0,
  }).returning();

  res.json({
    imageUrl,
    width: actualWidth,
    height: actualHeight,
    prompt,
    wallpaper,
  });
});

export default router;
