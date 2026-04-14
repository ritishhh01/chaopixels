import { Router, type IRouter } from "express";
import { eq, ilike, or, sql, desc, and } from "drizzle-orm";
import { db, wallpapersTable } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";
import {
  ListWallpapersQueryParams,
  CreateWallpaperBody,
  GetWallpaperParams,
  DeleteWallpaperParams,
  IncrementWallpaperDownloadParams,
  GetFeaturedWallpapersQueryParams,
} from "@workspace/api-zod";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const requireAdmin = async (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(auth.userId);
    const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress;
    if (!ADMIN_EMAIL || primaryEmail !== ADMIN_EMAIL) {
      res.status(403).json({ error: "Forbidden: admin access only" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
};

const router: IRouter = Router();

router.get("/wallpapers", async (req, res): Promise<void> => {
  const parsed = ListWallpapersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, search, resolution, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(wallpapersTable.category, category));
  if (resolution) conditions.push(eq(wallpapersTable.resolution, resolution));
  if (search) {
    conditions.push(
      or(
        ilike(wallpapersTable.title, `%${search}%`),
        ilike(wallpapersTable.description, `%${search}%`),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [wallpapers, countResult] = await Promise.all([
    db.select().from(wallpapersTable)
      .where(whereClause)
      .orderBy(desc(wallpapersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(wallpapersTable).where(whereClause),
  ]);

  res.json({
    wallpapers,
    total: Number(countResult[0]?.count ?? 0),
    limit,
    offset,
  });
});

router.get("/wallpapers/stats", async (req, res): Promise<void> => {
  const [stats] = await db.select({
    totalWallpapers: sql<number>`count(*)`,
    totalDownloads: sql<number>`sum(${wallpapersTable.downloadCount})`,
    aiGenerated: sql<number>`sum(case when ${wallpapersTable.isAiGenerated} then 1 else 0 end)`,
  }).from(wallpapersTable);

  const byCategory = await db.select({
    category: wallpapersTable.category,
    count: sql<number>`count(*)`,
  }).from(wallpapersTable).groupBy(wallpapersTable.category);

  res.json({
    totalWallpapers: Number(stats?.totalWallpapers ?? 0),
    totalDownloads: Number(stats?.totalDownloads ?? 0),
    aiGenerated: Number(stats?.aiGenerated ?? 0),
    byCategory: byCategory.map(r => ({ category: r.category, count: Number(r.count) })),
  });
});

router.get("/wallpapers/featured", async (req, res): Promise<void> => {
  const parsed = GetFeaturedWallpapersQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 12) : 12;

  const wallpapers = await db.select().from(wallpapersTable)
    .where(eq(wallpapersTable.isFeatured, true))
    .orderBy(desc(wallpapersTable.downloadCount))
    .limit(limit);

  res.json(wallpapers);
});

router.get("/wallpapers/:id", async (req, res): Promise<void> => {
  const params = GetWallpaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [wallpaper] = await db.select().from(wallpapersTable).where(eq(wallpapersTable.id, params.data.id));
  if (!wallpaper) {
    res.status(404).json({ error: "Wallpaper not found" });
    return;
  }

  res.json(wallpaper);
});

router.post("/wallpapers", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateWallpaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [wallpaper] = await db.insert(wallpapersTable).values({
    ...parsed.data,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(wallpaper);
});

router.patch("/wallpapers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const allowed = ["isFeatured", "isAiGenerated", "title", "description", "category", "resolution", "tags", "downloadCount"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }

  const [wallpaper] = await db.update(wallpapersTable).set(updates).where(eq(wallpapersTable.id, id)).returning();
  if (!wallpaper) { res.status(404).json({ error: "Wallpaper not found" }); return; }
  res.json(wallpaper);
});

router.delete("/wallpapers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteWallpaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [wallpaper] = await db.delete(wallpapersTable)
    .where(eq(wallpapersTable.id, params.data.id))
    .returning();

  if (!wallpaper) {
    res.status(404).json({ error: "Wallpaper not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/wallpapers/:id/increment-download", async (req, res): Promise<void> => {
  const params = IncrementWallpaperDownloadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [wallpaper] = await db.update(wallpapersTable)
    .set({ downloadCount: sql`${wallpapersTable.downloadCount} + 1` })
    .where(eq(wallpapersTable.id, params.data.id))
    .returning();

  if (!wallpaper) {
    res.status(404).json({ error: "Wallpaper not found" });
    return;
  }

  res.json(wallpaper);
});

router.get("/proxy-download", async (req, res): Promise<void> => {
  const url = req.query.url as string;
  const filename = (req.query.filename as string) || "wallpaper.jpg";

  if (!url || !url.startsWith("http")) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch image" });
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
    res.setHeader("Cache-Control", "no-store");

    const buffer = await upstream.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    req.log.error({ err }, "Proxy download failed");
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
