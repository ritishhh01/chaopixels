import { useState } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Monitor, Smartphone, Download, Heart, Tag, Loader2, ExternalLink, Share2, Check, Info, Maximize2 } from "lucide-react";
import { useGetWallpaper, getGetWallpaperQueryKey, useIncrementWallpaperDownload, useAddFavorite, useRemoveFavorite, useCheckFavorite, getCheckFavoriteQueryKey, getListFavoritesQueryKey, getGetWallpaperStatsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAspectRatio, getMegapixels, getResolutionGrade, isAmoledWallpaper } from "@/lib/amoled";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ── Tiny mock icons for mobile home screen overlay ── */
const ICON_COLORS = [
  "#7c3aed","#2563eb","#16a34a","#dc2626","#d97706",
  "#0891b2","#7c3aed","#db2777","#059669","#9333ea",
  "#ea580c","#0284c7","#65a30d","#e11d48","#8b5cf6","#f59e0b",
];
function MockIcon({ color }: { color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-xl flex-shrink-0"
      style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}66` }}
    />
  );
}

/* ── Desktop taskbar overlay ── */
function DesktopTaskbar() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/70 backdrop-blur-md flex items-center justify-between px-3 text-white/90">
      {/* Start button */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <span className="text-[5px] font-black text-white">C</span>
        </div>
        <span className="text-[8px] font-semibold tracking-wide">ChaoPixels</span>
      </div>
      {/* Center pinned apps */}
      <div className="flex items-center gap-2">
        {["#3b82f6","#8b5cf6","#10b981","#f59e0b"].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-md" style={{ backgroundColor: c }} />
        ))}
      </div>
      {/* System tray */}
      <div className="flex items-center gap-2 text-[8px]">
        <span>🔊</span>
        <span>📶</span>
        <span className="font-mono">{time}</span>
      </div>
    </div>
  );
}

/* ── Mobile home-screen overlay ── */
function MobileHomeScreen() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <>
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-5 flex items-center justify-between px-3 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-[7px] text-white font-semibold">{time}</span>
        <div className="flex items-center gap-1 text-white text-[7px]">
          <span>📶</span><span>🔋</span>
        </div>
      </div>
      {/* App icon grid */}
      <div className="absolute top-8 left-0 right-0 px-3">
        <div className="grid grid-cols-4 gap-2">
          {ICON_COLORS.map((c, i) => <MockIcon key={i} color={c} />)}
        </div>
      </div>
      {/* Dock */}
      <div className="absolute bottom-3 left-2 right-2 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-around px-2">
        {["#3b82f6","#16a34a","#ef4444","#7c3aed"].map((c, i) => (
          <div key={i} className="w-6 h-6 rounded-xl" style={{ backgroundColor: c }} />
        ))}
      </div>
    </>
  );
}

export default function WallpaperDetail() {
  const [, params] = useRoute("/wallpaper/:id");
  const id = params ? parseInt(params.id, 10) : 0;
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [showOverlay, setShowOverlay] = useState(true);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: wallpaper, isLoading } = useGetWallpaper(id, {
    query: { enabled: !!id, queryKey: getGetWallpaperQueryKey(id) }
  });

  const { data: favoriteStatus } = useCheckFavorite(id, {
    query: { enabled: !!id, queryKey: getCheckFavoriteQueryKey(id) }
  });
  const isFavorited = favoriteStatus?.isFavorited ?? false;

  const incrementDownload = useIncrementWallpaperDownload();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleDownload = () => {
    if (!wallpaper) return;
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
    toast({ title: "Download started ⬇️" });
  };

  const handleShare = async () => {
    if (!wallpaper) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: wallpaper.title, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
    }
  };

  const handleFavoriteToggle = () => {
    if (!wallpaper) return;
    if (!isSignedIn) { setLocation("/sign-in"); return; }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!wallpaper) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-foreground font-medium">Wallpaper not found</p>
          <Link href="/"><a className="mt-4 text-violet-400 hover:text-violet-300 text-sm">Back to gallery</a></Link>
        </div>
      </div>
    );
  }

  const aspectRatio = getAspectRatio(wallpaper.width, wallpaper.height);
  const megapixels = getMegapixels(wallpaper.width, wallpaper.height);
  const grade = getResolutionGrade(wallpaper.width, wallpaper.height);
  const amoled = isAmoledWallpaper(wallpaper);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to gallery
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Device Preview ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  className={`p-2 rounded-md transition-all ${deviceView === "desktop" ? "bg-violet-500/30 text-violet-300" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDeviceView("desktop")}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded-md transition-all ${deviceView === "mobile" ? "bg-violet-500/30 text-violet-300" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDeviceView("mobile")}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{deviceView === "desktop" ? "Desktop Preview" : "Mobile Preview"}</span>
              {/* Smart overlay toggle */}
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                  showOverlay
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                {showOverlay ? "Smart Preview ON" : "Smart Preview OFF"}
              </button>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-8" style={{ minHeight: "400px" }}>
              <AnimatePresence mode="wait">
                {deviceView === "desktop" ? (
                  <motion.div key="desktop" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg">
                    <div className="bg-zinc-800 rounded-t-lg border-4 border-zinc-700 shadow-2xl overflow-hidden relative" style={{ aspectRatio: "16/10" }}>
                      <img src={wallpaper.imageUrl} alt={wallpaper.title} className="w-full h-full object-cover" />
                      {/* Smart desktop overlay: taskbar */}
                      {showOverlay && <DesktopTaskbar />}
                    </div>
                    <div className="bg-zinc-700 h-2 mx-8 rounded-b-sm" />
                    <div className="bg-zinc-600 h-1.5 mx-14 rounded-b-lg" />
                  </motion.div>
                ) : (
                  <motion.div key="mobile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-48">
                    <div className="bg-zinc-800 rounded-[2.5rem] border-4 border-zinc-700 shadow-2xl p-2.5">
                      <div className="bg-black rounded-[2rem] overflow-hidden relative" style={{ aspectRatio: "9/19.5" }}>
                        {/* Dynamic island */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                        </div>
                        <img src={wallpaper.imageUrl} alt={wallpaper.title} className="w-full h-full object-cover" />
                        {/* Smart mobile overlay: home screen icons */}
                        {showOverlay && <MobileHomeScreen />}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Info panel ── */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-300">{wallpaper.category}</span>
                {amoled && <span className="px-2.5 py-1 bg-black border border-white/20 rounded-full text-xs text-white flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />AMOLED</span>}
                {wallpaper.isAiGenerated && <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs text-indigo-300">AI Generated</span>}
                {wallpaper.isFeatured && <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs text-amber-300">Featured</span>}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{wallpaper.title}</h1>
              {wallpaper.description && <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{wallpaper.description}</p>}
            </div>

            {/* ── Wallpaper Specs ── */}
            <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/3">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-foreground tracking-wide uppercase">Wallpaper Specs</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-white/8">
                {[
                  { label: "Resolution", value: wallpaper.resolution },
                  { label: "Grade", value: grade },
                  { label: "Dimensions", value: `${wallpaper.width} × ${wallpaper.height}` },
                  { label: "Aspect Ratio", value: aspectRatio },
                  { label: "Megapixels", value: megapixels },
                  { label: "Downloads", value: wallpaper.downloadCount.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {wallpaper.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Tag className="w-3.5 h-3.5" />Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wallpaper.tags.map((tag) => (
                    <Link key={tag} href={`/?tag=${tag}`}>
                      <a className="px-2.5 py-1 bg-white/5 hover:bg-violet-500/20 hover:text-violet-300 border border-white/5 rounded-full text-xs text-muted-foreground transition-all">
                        #{tag}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all neon-border"
                data-testid="button-download-detail"
              >
                <Download className="w-4 h-4" />
                Download {wallpaper.resolution}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleFavoriteToggle}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    isFavorited ? "bg-rose-500/20 border-rose-500/40 text-rose-300" : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-favorite-detail"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <a href={wallpaper.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
