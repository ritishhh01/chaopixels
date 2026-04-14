import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Star, Loader2, Shield, ExternalLink,
  ChevronDown, ChevronUp, Image, Check, AlertCircle, Upload, Link2, X,
  Images, CheckCircle2, XCircle, Clock
} from "lucide-react";

type BulkItemStatus = "pending" | "uploading" | "creating" | "done" | "error";

type BulkItem = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  category: string;
  resolution: string;
  width: number;
  height: number;
  isAiGenerated: boolean;
  status: BulkItemStatus;
  imageUrl?: string;
  errorMsg?: string;
};
import { useUser, useAuth, Show } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Footer } from "@/components/Footer";
import {
  useListWallpapers,
  useCreateWallpaper,
  useDeleteWallpaper,
  getListWallpapersQueryKey,
  getGetWallpaperStatsQueryKey,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["AMOLED", "4K/8K", "Anime", "Cars", "Abstract"];
const RESOLUTIONS = ["4K", "8K", "HD", "2K", "Full HD"];

const EMPTY_FORM = {
  title: "",
  description: "",
  imageUrl: "",
  thumbnailUrl: "",
  downloadUrl: "",
  category: "Abstract",
  resolution: "4K",
  width: 3840,
  height: 2160,
  tags: "",
  isFeatured: false,
  isAiGenerated: false,
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Admin() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAdmin = isLoaded && !!user && user.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(true);
  const [addMode, setAddMode] = useState<"url" | "upload">("url");
  const [previewUrl, setPreviewUrl] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadedObjectPath, setUploadedObjectPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk import state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const { data: wallpapersData, isLoading } = useListWallpapers(
    { limit: 100, offset: 0 },
    { query: { queryKey: getListWallpapersQueryKey({ limit: 100, offset: 0 }) } }
  );

  const createWallpaper = useCreateWallpaper();
  const deleteWallpaper = useDeleteWallpaper();
  const updateWallpaper = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<any> }) => {
      const res = await fetch(`${BASE}/api/wallpapers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
  });

  const { uploadFile, isUploading, progress } = useUpload({
    onGetUploadParameters: async (file) => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get upload URL");
      }
      const { uploadURL } = await res.json();
      return { method: "PUT" as const, url: uploadURL, headers: { "Content-Type": file.type } };
    },
    onSuccess: (response) => {
      const serveUrl = `${BASE}/api/storage${response.objectPath}`;
      setUploadedObjectPath(response.objectPath);
      setForm(f => ({ ...f, imageUrl: serveUrl, thumbnailUrl: serveUrl, downloadUrl: serveUrl }));
      setPreviewUrl(serveUrl);
      toast({ title: "File uploaded!", description: "Image URL auto-filled below" });
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Images only", description: "Please select a JPG, PNG, or WebP image", variant: "destructive" });
      return;
    }
    uploadFile(file);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListWallpapersQueryKey({ limit: 100, offset: 0 }) });
    queryClient.invalidateQueries({ queryKey: getGetWallpaperStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["wallpapers"] });
  };

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  // Bulk import helpers
  const fileToTitle = (file: File) => {
    return file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { resolve({ width: 3840, height: 2160 }); URL.revokeObjectURL(url); };
      img.src = url;
    });

  const addBulkFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    const newItems = await Promise.all(imageFiles.map(async (file) => {
      const previewUrl = URL.createObjectURL(file);
      const dims = await getImageDimensions(file);
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        title: fileToTitle(file),
        category: "Abstract",
        resolution: "4K",
        width: dims.width,
        height: dims.height,
        isAiGenerated: true,
        status: "pending" as BulkItemStatus,
      };
    }));
    setBulkItems(prev => [...prev, ...newItems]);
  }, []);

  const updateBulkItem = (id: string, updates: Partial<BulkItem>) => {
    setBulkItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeBulkItem = (id: string) => {
    setBulkItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleBulkImport = async () => {
    const pending = bulkItems.filter(i => i.status === "pending");
    if (!pending.length) return;
    setBulkImporting(true);

    const token = await getToken();
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    for (const item of pending) {
      updateBulkItem(item.id, { status: "uploading" });
      try {
        // 1. Get upload URL
        const urlRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ name: item.file.name, size: item.file.size, contentType: item.file.type }),
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath } = await urlRes.json();

        // 2. Upload file
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");

        const imageUrl = `${BASE}/api/storage${objectPath}`;
        updateBulkItem(item.id, { status: "creating", imageUrl });

        // 3. Create wallpaper record
        const createRes = await fetch(`${BASE}/api/wallpapers`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            title: item.title,
            imageUrl,
            thumbnailUrl: imageUrl,
            downloadUrl: imageUrl,
            category: item.category,
            resolution: item.resolution,
            width: item.width,
            height: item.height,
            tags: [],
            isAiGenerated: item.isAiGenerated,
            isFeatured: false,
            downloadCount: 0,
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create wallpaper");

        updateBulkItem(item.id, { status: "done" });
      } catch (err: any) {
        updateBulkItem(item.id, { status: "error", errorMsg: err.message || "Unknown error" });
      }
    }

    setBulkImporting(false);
    invalidate();
    toast({ title: "Bulk import complete!", description: `${pending.length} wallpapers processed` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl || !form.downloadUrl) {
      toast({ title: "Missing required fields", description: "Title and Image URL are required", variant: "destructive" });
      return;
    }
    createWallpaper.mutate({
      data: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || form.imageUrl.trim(),
        downloadUrl: form.downloadUrl.trim(),
        category: form.category,
        resolution: form.resolution,
        width: Number(form.width),
        height: Number(form.height),
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        isFeatured: form.isFeatured,
        isAiGenerated: form.isAiGenerated,
        downloadCount: 0,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Wallpaper added!" });
        setForm(EMPTY_FORM);
        setPreviewUrl("");
        setUploadedObjectPath(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        invalidate();
      },
      onError: () => toast({ title: "Failed to add wallpaper", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteWallpaper.mutate({ id }, {
      onSuccess: () => { toast({ title: "Wallpaper deleted" }); setDeletingId(null); invalidate(); },
      onError: () => { toast({ title: "Failed to delete", variant: "destructive" }); setDeletingId(null); },
    });
  };

  const toggleFeatured = (wallpaper: any) => {
    updateWallpaper.mutate({ id: wallpaper.id, data: { isFeatured: !wallpaper.isFeatured } }, {
      onSuccess: () => { toast({ title: wallpaper.isFeatured ? "Removed from featured" : "Marked as featured ⭐" }); invalidate(); }
    });
  };

  const wallpapers = wallpapersData?.wallpapers ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage wallpapers in your gallery</p>
          </div>
        </div>

        <Show when="signed-out">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Shield className="w-12 h-12 text-violet-400 mb-4" />
            <p className="text-foreground font-medium mb-2">Sign in to access the admin panel</p>
            <button onClick={() => setLocation("/sign-in")} className="mt-4 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-semibold text-white">
              Sign in
            </button>
          </div>
        </Show>

        <Show when="signed-in">
          {!isAdmin && isLoaded && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-rose-400" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-1">Access Denied</p>
              <p className="text-muted-foreground text-sm">Your account is not authorised to manage this gallery.</p>
            </div>
          )}
          {isAdmin && (<>

          {/* Add wallpaper form */}
          <div className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl mb-8 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
              onClick={() => setFormOpen(o => !o)}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-foreground">Add New Wallpaper</span>
              </div>
              {formOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {formOpen && (
              <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-white/5">

                {/* Mode toggle */}
                <div className="mt-5 mb-5 flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setAddMode("url")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === "url" ? "bg-white/10 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("upload")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === "upload" ? "bg-violet-500/20 text-violet-300 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                </div>

                {/* URL mode tips */}
                {addMode === "url" && (
                  <div className="mb-5 flex gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div className="text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Where to get image URLs:</strong> Use{" "}
                      <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-0.5">
                        Unsplash <ExternalLink className="w-3 h-3" />
                      </a>{" "}
                      — right-click a photo → "Copy image address". Use the same URL for Download URL.
                    </div>
                  </div>
                )}

                {/* Upload mode */}
                {addMode === "upload" && (
                  <div className="mb-5">
                    <div
                      className={`relative border-2 border-dashed rounded-2xl transition-all ${
                        isUploading ? "border-violet-500/60 bg-violet-500/5" : uploadedObjectPath ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/15 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer"
                      }`}
                      onClick={() => !isUploading && !uploadedObjectPath && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />

                      {!isUploading && !uploadedObjectPath && (
                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-violet-400" />
                          </div>
                          <p className="text-foreground font-medium mb-1">Drop your wallpaper here</p>
                          <p className="text-muted-foreground text-sm">or click to browse — JPG, PNG, WebP supported</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-4 px-5 py-2 bg-violet-600/80 hover:bg-violet-600 rounded-lg text-sm font-medium text-white transition-all"
                          >
                            Choose File
                          </button>
                        </div>
                      )}

                      {isUploading && (
                        <div className="flex flex-col items-center justify-center py-10 px-6">
                          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
                          <p className="text-foreground font-medium mb-2">Uploading...</p>
                          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                              animate={{ width: `${progress ?? 0}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-muted-foreground text-xs mt-2">{progress ?? 0}%</p>
                        </div>
                      )}

                      {!isUploading && uploadedObjectPath && (
                        <div className="flex items-center gap-4 p-4">
                          <img src={previewUrl} alt="Uploaded" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <p className="text-foreground text-sm font-medium">File uploaded successfully</p>
                            </div>
                            <p className="text-muted-foreground text-xs truncate">{uploadedObjectPath}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setUploadedObjectPath(null); setPreviewUrl(""); setForm(f => ({ ...f, imageUrl: "", thumbnailUrl: "", downloadUrl: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">After uploading, fill in the details below and click Add Wallpaper.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1.5">Title <span className="text-rose-400">*</span></label>
                    <input
                      value={form.title}
                      onChange={e => set("title", e.target.value)}
                      placeholder="e.g. Aurora Borealis Iceland"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                      data-testid="input-title"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1.5">Description <span className="text-muted-foreground">(optional)</span></label>
                    <textarea
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                      placeholder="Short description of this wallpaper..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Image URL (URL mode only) */}
                  {addMode === "url" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">Image URL <span className="text-rose-400">*</span></label>
                      <div className="flex gap-2">
                        <input
                          value={form.imageUrl}
                          onChange={e => { set("imageUrl", e.target.value); if (!form.downloadUrl) set("downloadUrl", e.target.value); if (!form.thumbnailUrl) set("thumbnailUrl", e.target.value); }}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                          data-testid="input-image-url"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(form.imageUrl)}
                          className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                          title="Preview image"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* In upload mode, show the auto-filled URL as read-only */}
                  {addMode === "upload" && uploadedObjectPath && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">Image URL <span className="text-xs text-emerald-400">(auto-filled from upload)</span></label>
                      <input
                        value={form.imageUrl}
                        readOnly
                        className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-muted-foreground focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Image preview */}
                  {previewUrl && addMode === "url" && (
                    <div className="sm:col-span-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-48 object-cover rounded-xl border border-white/10"
                        onError={() => { setPreviewUrl(""); toast({ title: "Could not load image", variant: "destructive" }); }}
                      />
                    </div>
                  )}

                  {/* Download URL (URL mode) */}
                  {addMode === "url" && (
                    <>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Thumbnail URL <span className="text-muted-foreground">(optional)</span></label>
                        <input
                          value={form.thumbnailUrl}
                          onChange={e => set("thumbnailUrl", e.target.value)}
                          placeholder="Smaller version URL"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Download URL <span className="text-rose-400">*</span></label>
                        <input
                          value={form.downloadUrl}
                          onChange={e => set("downloadUrl", e.target.value)}
                          placeholder="Full-res download link"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* Category */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => set("category", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                      data-testid="select-category"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                    </select>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Resolution</label>
                    <select
                      value={form.resolution}
                      onChange={e => set("resolution", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    >
                      {RESOLUTIONS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                    </select>
                  </div>

                  {/* Width */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Width (px)</label>
                    <input
                      type="number"
                      value={form.width}
                      onChange={e => set("width", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Height (px)</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={e => set("height", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>

                  {/* Tags */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1.5">Tags <span className="text-muted-foreground">(comma-separated)</span></label>
                    <input
                      value={form.tags}
                      onChange={e => set("tags", e.target.value)}
                      placeholder="e.g. space, dark, minimal, neon"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                      data-testid="input-tags"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="sm:col-span-2 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => set("isFeatured", !form.isFeatured)}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isFeatured ? "bg-violet-600 border-violet-500" : "border-white/20 bg-white/5"}`}>
                        {form.isFeatured && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-foreground">Feature this wallpaper <span className="text-xs text-muted-foreground">(shows in hero + featured section)</span></span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => set("isAiGenerated", !form.isAiGenerated)}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isAiGenerated ? "bg-indigo-600 border-indigo-500" : "border-white/20 bg-white/5"}`}>
                        {form.isAiGenerated && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-foreground">AI Generated</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createWallpaper.isPending || isUploading || (addMode === "upload" && !uploadedObjectPath)}
                  className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
                  data-testid="button-add-wallpaper"
                >
                  {createWallpaper.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {createWallpaper.isPending ? "Adding..." : "Add Wallpaper"}
                </button>
              </form>
            )}
          </div>

          {/* Bulk Import */}
          <div className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl mb-8 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
              onClick={() => setBulkOpen(o => !o)}
            >
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-foreground">Bulk Import</span>
                {bulkItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs">
                    {bulkItems.length} queued
                  </span>
                )}
              </div>
              {bulkOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {bulkOpen && (
              <div className="px-6 pb-6 border-t border-white/5">
                <p className="text-sm text-muted-foreground mt-4 mb-4">
                  Drop multiple images at once — each gets uploaded and added to the gallery. Titles are auto-filled from filenames.
                </p>

                {/* Drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer mb-5 ${
                    bulkDragOver ? "border-indigo-500/70 bg-indigo-500/8" : "border-white/15 hover:border-indigo-500/40 hover:bg-indigo-500/5"
                  }`}
                  onDragOver={e => { e.preventDefault(); setBulkDragOver(true); }}
                  onDragLeave={() => setBulkDragOver(false)}
                  onDrop={e => { e.preventDefault(); setBulkDragOver(false); addBulkFiles(Array.from(e.dataTransfer.files)); }}
                  onClick={() => bulkInputRef.current?.click()}
                >
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files) addBulkFiles(Array.from(e.target.files)); e.target.value = ""; }}
                  />
                  <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-3">
                      <Images className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Drop all your images here</p>
                    <p className="text-muted-foreground text-sm">or click to browse — select multiple files at once</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); bulkInputRef.current?.click(); }}
                      className="mt-3 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white transition-all"
                    >
                      Choose Files
                    </button>
                  </div>
                </div>

                {/* Queued items list */}
                {bulkItems.length > 0 && (
                  <div className="space-y-3">
                    {bulkItems.map(item => (
                      <div key={item.id} className={`flex gap-3 p-3 rounded-xl border transition-all ${
                        item.status === "done" ? "bg-emerald-500/5 border-emerald-500/20" :
                        item.status === "error" ? "bg-rose-500/5 border-rose-500/20" :
                        item.status === "uploading" || item.status === "creating" ? "bg-indigo-500/5 border-indigo-500/20" :
                        "bg-white/3 border-white/8"
                      }`}>
                        {/* Thumbnail */}
                        <img src={item.previewUrl} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-white/5" />

                        {/* Fields */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            value={item.title}
                            onChange={e => updateBulkItem(item.id, { title: e.target.value })}
                            disabled={item.status !== "pending"}
                            placeholder="Title"
                            className="sm:col-span-3 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-60"
                          />
                          <select
                            value={item.category}
                            onChange={e => updateBulkItem(item.id, { category: e.target.value })}
                            disabled={item.status !== "pending"}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none disabled:opacity-60"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                          </select>
                          <select
                            value={item.resolution}
                            onChange={e => updateBulkItem(item.id, { resolution: e.target.value })}
                            disabled={item.status !== "pending"}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none disabled:opacity-60"
                          >
                            {RESOLUTIONS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                          </select>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => item.status === "pending" && updateBulkItem(item.id, { isAiGenerated: !item.isAiGenerated })}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${item.isAiGenerated ? "bg-indigo-600 border-indigo-500" : "border-white/20 bg-white/5"}`}>
                              {item.isAiGenerated && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-xs text-muted-foreground">AI Generated</span>
                          </label>
                        </div>

                        {/* Status / remove */}
                        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                          {item.status === "pending" && (
                            <button onClick={() => removeBulkItem(item.id)} className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Remove">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {(item.status === "uploading" || item.status === "creating") && (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          )}
                          {item.status === "done" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {item.status === "error" && (
                            <div title={item.errorMsg}>
                              <XCircle className="w-5 h-5 text-rose-400" />
                            </div>
                          )}
                          {item.status === "pending" && <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />}
                        </div>
                      </div>
                    ))}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleBulkImport}
                        disabled={bulkImporting || !bulkItems.some(i => i.status === "pending")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                      >
                        {bulkImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Images className="w-4 h-4" />}
                        {bulkImporting
                          ? `Importing... (${bulkItems.filter(i => i.status === "done").length}/${bulkItems.filter(i => i.status !== "pending").length + bulkItems.filter(i => i.status === "pending").length - (bulkItems.filter(i => i.status === "done").length)})`
                          : `Import All ${bulkItems.filter(i => i.status === "pending").length} Images`}
                      </button>
                      {bulkItems.some(i => i.status === "done") && (
                        <button
                          onClick={() => setBulkItems(prev => prev.filter(i => i.status !== "done"))}
                          className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
                        >
                          Clear done
                        </button>
                      )}
                      <button
                        onClick={() => { setBulkItems([]); }}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm text-muted-foreground hover:text-rose-400 transition-all"
                        disabled={bulkImporting}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallpaper list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                All Wallpapers <span className="text-muted-foreground font-normal text-sm">({wallpapers.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {wallpapers.map((w: any) => (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-card/40 border border-white/5 rounded-xl hover:border-white/10 transition-all group"
                  >
                    <img
                      src={w.thumbnailUrl || w.imageUrl}
                      alt={w.title}
                      className="w-16 h-10 object-cover rounded-lg flex-shrink-0 bg-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{w.title}</p>
                        {w.isFeatured && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs">Featured</span>}
                        {w.isAiGenerated && <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs">AI</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {w.category} · {w.resolution} · {w.width}×{w.height} · {w.downloadCount.toLocaleString()} downloads
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleFeatured(w)}
                        disabled={updateWallpaper.isPending}
                        className={`p-1.5 rounded-lg transition-all ${w.isFeatured ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "bg-white/5 text-muted-foreground hover:text-amber-300 hover:bg-amber-500/10"}`}
                        title={w.isFeatured ? "Remove from featured" : "Mark as featured"}
                      >
                        <Star className={`w-4 h-4 ${w.isFeatured ? "fill-current" : ""}`} />
                      </button>
                      <a href={w.imageUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(w.id)}
                        disabled={deletingId === w.id}
                        className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete wallpaper"
                      >
                        {deletingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </>)}
        </Show>
      </main>
      <Footer />
    </div>
  );
}
