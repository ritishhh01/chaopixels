import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Heart, Monitor, Smartphone, ExternalLink, Tag, Share2, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, Show } from "@clerk/react";
import {
  useIncrementWallpaperDownload,
  useAddFavorite,
  useRemoveFavorite,
  useCheckFavorite,
  getListFavoritesQueryKey,
  getCheckFavoriteQueryKey,
  getGetWallpaperStatsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Wallpaper {
  id: number;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  downloadUrl: string;
  category: string;
  resolution: string;
  width: number;
  height: number;
  tags: string[];
  downloadCount: number;
  isFeatured: boolean;
  isAiGenerated: boolean;
}

interface WallpaperModalProps {
  wallpaper: Wallpaper | null;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
}

export function WallpaperModal({ wallpaper, onClose, onTagClick }: WallpaperModalProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: favoriteStatus } = useCheckFavorite(
    wallpaper?.id ?? 0,
    { query: { enabled: !!wallpaper, queryKey: getCheckFavoriteQueryKey(wallpaper?.id ?? 0) } }
  );
  const isFavorited = favoriteStatus?.isFavorited ?? false;

  const incrementDownload = useIncrementWallpaperDownload();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  if (!wallpaper) return null;

  const handleDownload = () => {
    incrementDownload.mutate({ id: wallpaper.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWallpaperStatsQueryKey() })
    });
    const filename = `${wallpaper.title.replace(/[^a-z0-9]/gi, "-")}.jpg`;
    const proxyUrl = `${BASE}/api/proxy-download?url=${encodeURIComponent(wallpaper.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download started ⬇️", description: `${wallpaper.title} (${wallpaper.resolution})` });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}wallpaper/${wallpaper.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: wallpaper.title, text: wallpaper.description || wallpaper.title, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Share this wallpaper with anyone" });
    }
  };

  const handleFavoriteToggle = () => {
    if (!isSignedIn) {
      onClose();
      setLocation("/sign-in");
      return;
    }
    if (isFavorited) {
      removeFavorite.mutate({ wallpaperId: wallpaper.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCheckFavoriteQueryKey(wallpaper.id) });
          toast({ title: "Removed from favorites" });
        }
      });
    } else {
      addFavorite.mutate({ wallpaperId: wallpaper.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCheckFavoriteQueryKey(wallpaper.id) });
          toast({ title: "Saved to favorites! ❤️" });
        }
      });
    }
  };

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 w-full max-w-5xl bg-card/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{wallpaper.title}</h2>
              <p className="text-sm text-muted-foreground">{wallpaper.resolution} · {wallpaper.width}×{wallpaper.height}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  className={`p-1.5 rounded-md transition-all ${deviceView === "desktop" ? "bg-violet-500/30 text-violet-300" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDeviceView("desktop")}
                  title="Desktop preview"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  className={`p-1.5 rounded-md transition-all ${deviceView === "mobile" ? "bg-violet-500/30 text-violet-300" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDeviceView("mobile")}
                  title="Mobile preview"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Device Preview */}
            <div className="flex-1 bg-black/40 flex items-center justify-center p-8 min-h-[300px]">
              <AnimatePresence mode="wait">
                {deviceView === "desktop" ? (
                  <motion.div key="desktop" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
                    <div className="bg-zinc-800 rounded-t-lg border-4 border-zinc-700 shadow-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
                      <img src={wallpaper.imageUrl} alt={wallpaper.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-zinc-700 h-2 mx-6 rounded-b-sm" />
                    <div className="bg-zinc-600 h-1 mx-10 rounded-b-lg" />
                  </motion.div>
                ) : (
                  <motion.div key="mobile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-40">
                    <div className="bg-zinc-800 rounded-[2rem] border-4 border-zinc-700 shadow-2xl overflow-hidden p-2">
                      <div className="bg-black rounded-[1.5rem] overflow-hidden relative" style={{ aspectRatio: "9/19.5" }}>
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        </div>
                        <img src={wallpaper.imageUrl} alt={wallpaper.title} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info panel */}
            <div className="w-full md:w-72 p-6 border-t md:border-t-0 md:border-l border-white/5 flex flex-col gap-4 overflow-y-auto max-h-[70vh] md:max-h-none">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-300">{wallpaper.category}</span>
                {wallpaper.isAiGenerated && <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs text-indigo-300">AI Generated</span>}
                {wallpaper.isFeatured && <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs text-amber-300">Featured</span>}
              </div>

              {wallpaper.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{wallpaper.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Resolution", value: wallpaper.resolution },
                  { label: "Downloads", value: wallpaper.downloadCount.toLocaleString() },
                  { label: "Width", value: `${wallpaper.width}px` },
                  { label: "Height", value: `${wallpaper.height}px` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {wallpaper.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Tag className="w-3 h-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wallpaper.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="px-2 py-0.5 bg-white/5 hover:bg-violet-500/20 hover:border-violet-500/40 hover:text-violet-300 rounded-md text-xs text-muted-foreground border border-white/5 transition-all cursor-pointer"
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1" />

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownload}
                  disabled={incrementDownload.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-60"
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4" />
                  Download {wallpaper.resolution}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={addFavorite.isPending || removeFavorite.isPending}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isFavorited
                        ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                    data-testid="button-favorite-modal"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-current text-rose-400" : ""}`} />
                    {isFavorited ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                    title="Share"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <a
                    href={wallpaper.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
