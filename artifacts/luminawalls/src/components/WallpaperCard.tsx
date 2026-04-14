import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Maximize2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAmoledWallpaper } from "@/lib/amoled";

interface Wallpaper {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  category: string;
  resolution: string;
  width: number;
  height: number;
  tags: string[];
  downloadCount: number;
  isFeatured: boolean;
  isAiGenerated: boolean;
}

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  index?: number;
  onPreview: (wallpaper: Wallpaper) => void;
  isFavorited?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onTagClick?: (tag: string) => void;
  isNew?: boolean;
}

export function WallpaperCard({ wallpaper, index = 0, onPreview, isFavorited, onFavoriteToggle, onTagClick, isNew }: WallpaperCardProps) {
  const { toast } = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const aspectRatio = wallpaper.height / wallpaper.width;
  const heightClass = aspectRatio > 0.7 ? "aspect-[3/4]" : aspectRatio > 0.5 ? "aspect-video" : "aspect-[4/3]";
  const amoled = isAmoledWallpaper(wallpaper);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}wallpaper/${wallpaper.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: wallpaper.title, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Wallpaper link copied to clipboard" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.5) }}
      className="group relative break-inside-avoid mb-4 rounded-xl overflow-hidden cursor-pointer"
      data-testid={`card-wallpaper-${wallpaper.id}`}
      onClick={() => onPreview(wallpaper)}
    >
      <div className={`relative ${heightClass} bg-card`}>
        {/* Shimmer skeleton shown while image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 shimmer-bg" aria-hidden="true" />
        )}

        <img
          src={wallpaper.thumbnailUrl || wallpaper.imageUrl}
          alt={wallpaper.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imgLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[calc(100%-1rem)]">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-white/90 border border-white/10">
            {wallpaper.category}
          </span>
          {amoled && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-black border border-white/20 text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              AMOLED
            </span>
          )}
          {isNew && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/80 backdrop-blur-sm text-white border border-emerald-400/30 animate-pulse">
              NEW
            </span>
          )}
          {wallpaper.isAiGenerated && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-600/80 backdrop-blur-sm text-white border border-violet-500/30">
              AI
            </span>
          )}
        </div>

        {/* Quick actions top right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0">
          {onFavoriteToggle && (
            <button
              className={`p-1.5 rounded-full backdrop-blur-sm border transition-all shadow-lg ${
                isFavorited
                  ? "bg-rose-500/80 border-rose-400/50 text-white"
                  : "bg-black/60 border-white/20 text-white/80 hover:bg-rose-500/60 hover:border-rose-400/40"
              }`}
              onClick={(e) => { e.stopPropagation(); onFavoriteToggle(wallpaper.id); }}
              data-testid={`button-favorite-${wallpaper.id}`}
              title="Save to favorites"
            >
              <Heart className={`w-3 h-3 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          )}
          <button
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 transition-all shadow-lg"
            onClick={handleShare}
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </button>
        </div>

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-white text-sm font-medium truncate leading-tight">{wallpaper.title}</p>
            <p className="text-white/50 text-xs mt-0.5">{wallpaper.resolution} · {wallpaper.downloadCount.toLocaleString()} ↓</p>
          </div>
          <button
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-violet-500/60 transition-all shadow-lg flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onPreview(wallpaper); }}
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
