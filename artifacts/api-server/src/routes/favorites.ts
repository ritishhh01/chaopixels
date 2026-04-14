import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, favoritesTable, wallpapersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  AddFavoriteParams,
  RemoveFavoriteParams,
  CheckFavoriteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

router.get("/favorites", requireAuth, async (req: any, res): Promise<void> => {
  const favorites = await db
    .select({ wallpaper: wallpapersTable })
    .from(favoritesTable)
    .innerJoin(wallpapersTable, eq(favoritesTable.wallpaperId, wallpapersTable.id))
    .where(eq(favoritesTable.userId, req.userId));

  res.json(favorites.map((f: any) => f.wallpaper));
});

router.get("/favorites/check/:wallpaperId", async (req: any, res): Promise<void> => {
  const params = CheckFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;

  if (!userId) {
    res.json({ isFavorited: false });
    return;
  }

  const [fav] = await db.select().from(favoritesTable).where(
    and(
      eq(favoritesTable.userId, userId),
      eq(favoritesTable.wallpaperId, params.data.wallpaperId),
    )
  );

  res.json({ isFavorited: !!fav });
});

router.post("/favorites/:wallpaperId", requireAuth, async (req: any, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [favorite] = await db.insert(favoritesTable).values({
    userId: req.userId,
    wallpaperId: params.data.wallpaperId,
  }).onConflictDoNothing().returning();

  if (!favorite) {
    const [existing] = await db.select().from(favoritesTable).where(
      and(
        eq(favoritesTable.userId, req.userId),
        eq(favoritesTable.wallpaperId, params.data.wallpaperId),
      )
    );
    res.status(201).json(existing);
    return;
  }

  res.status(201).json(favorite);
});

router.delete("/favorites/:wallpaperId", requireAuth, async (req: any, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(favoritesTable).where(
    and(
      eq(favoritesTable.userId, req.userId),
      eq(favoritesTable.wallpaperId, params.data.wallpaperId),
    )
  );

  res.sendStatus(204);
});

export default router;
