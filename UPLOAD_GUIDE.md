# ChaoPixels — Wallpaper Upload Guide

A complete guide for adding wallpapers to the ChaoPixels gallery.

---

## Table of Contents

1. [Getting Admin Access](#1-getting-admin-access)
2. [Navigating to the Admin Panel](#2-navigating-to-the-admin-panel)
3. [Adding a Single Wallpaper](#3-adding-a-single-wallpaper)
   - [Option A: Paste a URL](#option-a-paste-a-url)
   - [Option B: Upload a File](#option-b-upload-a-file)
4. [Bulk Import (Multiple Images at Once)](#4-bulk-import-multiple-images-at-once)
5. [Generating Wallpapers with AI](#5-generating-wallpapers-with-ai)
6. [Managing Existing Wallpapers](#6-managing-existing-wallpapers)
7. [Field Reference](#7-field-reference)

---

## 1. Getting Admin Access

The admin panel is restricted to a single admin account (`ritish981@gmail.com`). You must be signed in with this account to upload or manage wallpapers.

1. Click **Log in** in the top-right corner of any page.
2. Sign in using your admin email (Google or email/password).
3. Once signed in, navigate to `/admin`.

> Anyone who signs in with a non-admin account will see an "Access Denied" message on the admin page — this is expected.

---

## 2. Navigating to the Admin Panel

Go to:
```
https://your-app-url/admin
```

You will see two main sections:

- **Add New Wallpaper** — for adding one wallpaper at a time
- **Bulk Import** — for uploading many images at once

Below both sections is the **All Wallpapers** list showing everything currently in the gallery.

---

## 3. Adding a Single Wallpaper

Click **"Add New Wallpaper"** to expand the form (it is open by default).

### Option A: Paste a URL

Use this when your image is already hosted online (e.g. Unsplash, your own CDN, or any public image URL).

1. Make sure the **Paste URL** tab is selected.
2. Fill in:
   - **Image URL** — the direct link to the full-resolution image (right-click any image → "Copy image address")
   - **Title** — give it a clear, descriptive name
   - **Download URL** — usually the same as the Image URL
   - **Thumbnail URL** — optional; use a smaller/lower-res version if available
3. Click the 🖼 icon next to the Image URL field to preview the image before submitting.
4. Fill in the metadata fields (Category, Resolution, Width, Height, Tags).
5. Check **Feature this wallpaper** if you want it in the hero banner and Featured section.
6. Check **AI Generated** if the image was made by an AI model.
7. Click **Add Wallpaper**.

**Where to find image URLs:**
- [Unsplash.com](https://unsplash.com) — right-click a photo → "Copy image address"
- Any wallpaper CDN or hosting service that returns a direct `.jpg` / `.png` / `.webp` link

---

### Option B: Upload a File

Use this when you have image files saved locally on your computer.

1. Select the **Upload File** tab.
2. Click **"Choose File"** or drag your image into the dashed drop zone.
3. Supported formats: **JPG, PNG, WebP**
4. Wait for the upload to complete — a green checkmark and the storage path will appear.
5. The Image URL, Thumbnail URL, and Download URL fields are **auto-filled** from the uploaded file.
6. Fill in the remaining metadata (Title, Category, Resolution, etc.).
7. Click **Add Wallpaper**.

> One file at a time in this mode. For multiple files, use **Bulk Import** instead.

---

## 4. Bulk Import (Multiple Images at Once)

This is the fastest way to add many wallpapers — for example, after generating a batch of 20 AI images.

### Steps

1. Click **"Bulk Import"** to expand the section.
2. Either:
   - **Drag and drop** multiple image files onto the drop zone, or
   - Click **"Choose Files"** and select multiple files in the file picker (hold Ctrl/Cmd to select many)
3. Each image appears as a row showing:
   - A small thumbnail preview
   - An editable **Title** field (auto-filled from the filename — e.g. `neon_city_01.png` → "Neon City 01")
   - **Category** dropdown
   - **Resolution** dropdown
   - **AI Generated** checkbox (ticked by default)
4. Edit any row as needed — change the title, category, or resolution for individual images.
5. Click the **✕** button on any row to remove an image you don't want to import.
6. When ready, click **"Import All X Images"**.

### What happens during import

Each image is processed in sequence:

| Status | Icon | Meaning |
|--------|------|---------|
| Pending | 🕐 | Queued, waiting |
| Uploading | 🔄 | File being sent to storage |
| Creating | 🔄 | Wallpaper record being saved |
| Done | ✅ | Successfully added to gallery |
| Error | ❌ | Failed (hover the icon to see the reason) |

7. Once all images show ✅, click **"Clear done"** to clean up the list.
8. The gallery stat counter and All Wallpapers list update automatically.

### Tips for bulk import

- You can add more files to the queue at any time by dropping them into the zone again — even while others are processing.
- If one image fails (network error, etc.), the rest continue processing.
- Filenames become titles automatically: dashes and underscores are replaced with spaces, and each word is capitalised. You can always rename them in the row before importing.

---

## 5. Generating Wallpapers with AI

ChaoPixels has a built-in AI image generator powered by **Fal.ai (Flux.1 Schnell)**.

1. Go to **AI Lab** (in the top navigation).
2. Type a detailed prompt describing the wallpaper you want.
3. Select an aspect ratio (16:9 for desktop, 9:16 for mobile, etc.).
4. Click **Generate**.
5. Once the image appears, click **Download** to save it locally.

To add generated images to the gallery:

- **One image:** Use "Add New Wallpaper → Upload File" and upload the downloaded file.
- **Many images at once:** Save all generated images to a folder, then use **Bulk Import** to upload them all in one go.

> The AI Lab requires a Fal.ai account with sufficient credits. Top up at [fal.ai/dashboard/billing](https://fal.ai/dashboard/billing).

---

## 6. Managing Existing Wallpapers

The **All Wallpapers** list at the bottom of the admin page shows every wallpaper in the gallery. Hover over any wallpaper row to reveal action buttons.

| Action | Description |
|--------|-------------|
| ⭐ Star | Toggle featured status — featured wallpapers appear in the hero banner and Featured section on the homepage |
| 🔗 Link | Open the image URL in a new tab (quick sanity check) |
| 🗑 Trash | Permanently delete the wallpaper from the gallery |

---

## 7. Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| Title | ✅ | The display name shown on wallpaper cards and detail pages |
| Description | No | Optional short description visible on the detail page |
| Image URL | ✅ | Direct URL to the full-resolution image |
| Thumbnail URL | No | Smaller/faster-loading preview image; defaults to Image URL if blank |
| Download URL | ✅ | The URL users download when they hit the download button |
| Category | ✅ | One of: AMOLED, 4K/8K, Anime, Cars, Abstract |
| Resolution | ✅ | One of: 4K, 8K, HD, 2K, Full HD |
| Width (px) | ✅ | Image width in pixels (e.g. 3840 for 4K) |
| Height (px) | ✅ | Image height in pixels (e.g. 2160 for 4K) |
| Tags | No | Comma-separated keywords for search (e.g. `space, dark, neon`) |
| Featured | No | Tick to show the wallpaper in the hero and Featured section |
| AI Generated | No | Tick if the image was created by an AI model |

---

*Made with ♥ by chaotechh*
