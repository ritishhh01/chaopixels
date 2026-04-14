import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListWallpapers, useGetFeaturedWallpapers, getListWallpapersQueryKey, useGetWallpaperStats } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { WallpaperCard } from "@/components/WallpaperCard";
import { WallpaperModal } from "@/components/WallpaperModal";
import { useQueryClient } from "@tanstack/react-query";
import { useAddFavorite, useRemoveFavorite, useCheckFavorite, getListFavoritesQueryKey, getCheckFavoriteQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Loader2, TrendingUp, Sparkles, Download, Flame, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/Footer";

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const effectiveSearch = tagFilter ? `#${tagFilter}` : searchQuery;

  const { data: wallpapersData, isLoading } = useListWallpapers(
    {
      category: selectedCategory ?? undefined,
      search: searchQuery || undefined,
      limit: 48,
      offset: 0,
    },
    { query: { queryKey: getListWallpapersQueryKey({ category: selectedCategory ?? undefined, search: searchQuery || undefined, limit: 48, offset: 0 }) } }
  );

  const { data: featuredWallpapers } = useGetFeaturedWallpapers({ limit: 8 });
  const { data: stats } = useGetWallpaperStats();

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleFavoriteToggle = useCallback((wallpaperId: number) => {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    const key = getCheckFavoriteQueryKey(wallpaperId);
    const current = queryClient.getQueryData<{ isFavorited: boolean }>(key);
    if (current?.isFavorited) {
      removeFavorite.mutate({ wallpaperId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          queryClient.invalidateQueries({ queryKey: key });
        }
      });
    } else {
      addFavorite.mutate({ wallpaperId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          queryClient.invalidateQueries({ queryKey: key });
          toast({ title: "Saved to favorites! ❤️" });
        }
      });
    }
  }, [isSignedIn, setLocation, queryClient, addFavorite, removeFavorite, toast]);

  const handleTagClick = useCallback((tag: string) => {
    setTagFilter(tag);
    setSearchQuery("");
    setSelectedCategory(null);
  }, []);

  const clearFilters = () => {
    setTagFilter(null);
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const wallpapers = wallpapersData?.wallpapers ?? [];
  const wallpaperOfTheDay = featuredWallpapers?.[0];
  const trendingWallpapers = wallpapersData?.wallpapers
    ? [...(wallpapersData.wallpapers)].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 6)
    : [];

  const showHero = !selectedCategory && !searchQuery && !tagFilter;
  const isFiltered = !!(selectedCategory || searchQuery || tagFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={tagFilter ? `#${tagFilter}` : searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setTagFilter(null); }}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Live stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6 text-sm text-muted-foreground flex-wrap"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="font-medium text-foreground">{stats.totalWallpapers.toLocaleString()}</span> wallpapers
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-foreground">{stats.totalDownloads.toLocaleString()}</span> downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-medium text-foreground">{stats.aiGenerated}</span> AI generated
            </span>
          </motion.div>
        )}

        {/* Wallpaper of the Day hero */}
        <AnimatePresence>
          {showHero && wallpaperOfTheDay && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer group"
              style={{ height: "280px" }}
              onClick={() => setPreviewWallpaper(wallpaperOfTheDay)}
            >
              <img
                src={wallpaperOfTheDay.imageUrl}
                alt={wallpaperOfTheDay.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/80 backdrop-blur-sm text-white text-xs font-semibold border border-violet-500/40">
                    <Star className="w-3 h-3 fill-current" />
                    Wallpaper of the Day
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/80 text-xs border border-white/10">
                    {wallpaperOfTheDay.resolution}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{wallpaperOfTheDay.title}</h2>
                {wallpaperOfTheDay.description && (
                  <p className="text-white/70 text-sm max-w-md line-clamp-2">{wallpaperOfTheDay.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-all"
                    onClick={(e) => { e.stopPropagation(); setPreviewWallpaper(wallpaperOfTheDay); }}
                  >
                    Preview & Download
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category nav */}
        <div className="mb-6">
          <CategoryNav selected={selectedCategory} onSelect={(cat) => { setSelectedCategory(cat); setTagFilter(null); }} />
        </div>

        {/* Active filter indicator */}
        {tagFilter && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/40 rounded-full text-sm text-violet-300 flex items-center gap-2">
              #{tagFilter}
              <button onClick={clearFilters} className="hover:text-white transition-colors ml-1">×</button>
            </span>
            <span className="text-sm text-muted-foreground">Filtering by tag</span>
          </motion.div>
        )}

        {/* Trending this week */}
        {showHero && trendingWallpapers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h2 className="text-base font-semibold text-foreground">Trending Now</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {trendingWallpapers.map((w: Wallpaper, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-xl overflow-hidden cursor-pointer aspect-video"
                  onClick={() => setPreviewWallpaper(w)}
                >
                  <img src={w.thumbnailUrl || w.imageUrl} alt={w.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{w.title}</p>
                    <p className="text-white/50 text-xs">{w.downloadCount.toLocaleString()} ↓</p>
                  </div>
                  <div className="absolute top-1.5 left-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-500/80 backdrop-blur-sm text-white text-xs flex items-center justify-center font-bold shadow">
                      {i + 1}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Featured */}
        {showHero && featuredWallpapers && featuredWallpapers.length > 1 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-semibold text-foreground">Featured Collection</h2>
            </div>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {featuredWallpapers.slice(1, 7).map((wallpaper: Wallpaper, i) => (
                <WallpaperCard
                  key={wallpaper.id}
                  wallpaper={wallpaper}
                  index={i}
                  onPreview={setPreviewWallpaper}
                  onFavoriteToggle={handleFavoriteToggle}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filtered header */}
        {isFiltered && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">
              {searchQuery ? `"${searchQuery}"` : selectedCategory || `#${tagFilter}`}
            </h2>
            <span className="text-sm text-muted-foreground">({wallpapersData?.total ?? 0})</span>
            <button onClick={clearFilters} className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-white/5">
              Clear
            </button>
          </div>
        )}

        {!isFiltered && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">All Wallpapers</h2>
            <span className="text-sm text-muted-foreground">({wallpapersData?.total ?? 0})</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        )}

        {!isLoading && wallpapers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-foreground font-medium">No wallpapers found</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search or category</p>
            <button onClick={clearFilters} className="mt-4 text-violet-400 hover:text-violet-300 text-sm transition-colors">
              Show all wallpapers
            </button>
          </div>
        )}

        {!isLoading && wallpapers.length > 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {wallpapers.map((wallpaper: Wallpaper, i) => (
              <WallpaperCard
                key={wallpaper.id}
                wallpaper={wallpaper}
                index={i}
                onPreview={setPreviewWallpaper}
                onFavoriteToggle={handleFavoriteToggle}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </main>

      <WallpaperModal
        wallpaper={previewWallpaper}
        onClose={() => setPreviewWallpaper(null)}
        onTagClick={handleTagClick}
      />
      <Footer />
    </div>
  );
}
