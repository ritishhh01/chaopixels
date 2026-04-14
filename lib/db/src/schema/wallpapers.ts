import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wallpapersTable = pgTable("wallpapers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  downloadUrl: text("download_url").notNull(),
  category: text("category").notNull(),
  resolution: text("resolution").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  tags: text("tags").array().notNull().default([]),
  fileSize: integer("file_size"),
  downloadCount: integer("download_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWallpaperSchema = createInsertSchema(wallpapersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWallpaper = z.infer<typeof insertWallpaperSchema>;
export type Wallpaper = typeof wallpapersTable.$inferSelect;
