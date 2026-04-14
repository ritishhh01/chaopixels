import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { useListFavorites, getListFavoritesQueryKey, useRemoveFavorite, getCheckFavoriteQueryKey } from "@workspace/api-client-react";
import { useUser, Show } from "@clerk/react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WallpaperCard } from "@/components/WallpaperCard";
import { WallpaperModal } from "@/components/WallpaperModal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

export default function Favorites() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites, isLoading } = useListFavorites({
    query: {
      enabled: isSignedIn === true,
      queryKey: getListFavoritesQueryKey(),
    }
  });

  const removeFavorite = useRemoveFavorite();

  const handleFavoriteToggle = (wallpaperId: number) => {
    removeFavorite.mutate({ wallpaperId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getCheckFavoriteQueryKey(wallpaperId) });
        toast({ title: "Removed from favorites" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Favorites</h1>
            <p className="text-sm text-muted-foreground">
              {favorites ? `${favorites.length} saved wallpaper${favorites.length !== 1 ? "s" : ""}` : "Your saved collection"}
            </p>
          </div>
        </div>

        <Show when="signed-out">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Save your favorite wallpapers</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm leading-relaxed">
              Sign in with Google, email, or phone number to save wallpapers and access your collection from any device.
            </p>
            <button
              onClick={() => setLocation("/sign-in")}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-base font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all"
              data-testid="button-login-favorites"
            >
              <Sparkles className="w-5 h-5" />
              Sign in free
            </button>
            <p className="text-muted-foreground text-xs mt-4">Google · Email · Phone — all supported</p>
          </motion.div>
        </Show>

        <Show when="signed-in">
          {!isLoaded || isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : favorites && favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-rose-400/50" />
              </div>
              <p className="text-foreground font-medium">No favorites yet</p>
              <p className="text-muted-foreground text-sm mt-1">Browse the gallery and tap the ♥ to save wallpapers</p>
            </motion.div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {(favorites ?? []).map((wallpaper: Wallpaper, i) => (
                <WallpaperCard
                  key={wallpaper.id}
                  wallpaper={wallpaper}
                  index={i}
                  onPreview={setPreviewWallpaper}
                  isFavorited={true}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </Show>
      </main>

      <WallpaperModal
        wallpaper={previewWallpaper}
        onClose={() => setPreviewWallpaper(null)}
      />
      <Footer />
    </div>
  );
}
