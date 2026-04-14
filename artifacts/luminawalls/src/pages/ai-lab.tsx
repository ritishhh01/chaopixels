import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Download, ChevronRight, Info, Wand2 } from "lucide-react";
import { useGenerateWallpaper, getListWallpapersQueryKey } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PROMPT_SUGGESTIONS = [
  "A breathtaking cosmic nebula in deep violet and electric blue hues",
  "Neon-lit cyberpunk cityscape at midnight with rain reflections",
  "Serene Japanese cherry blossom forest under a full moon",
  "Abstract liquid metal flowing in impossible geometric patterns",
  "Ultra-realistic mountains with aurora borealis lighting the sky",
  "AMOLED-optimized geometric mandala on pure black background",
];

const RESOLUTION_OPTIONS = [
  { label: "1080p Full HD", value: "1080p", width: 1920, height: 1080 },
  { label: "4K Ultra HD", value: "4K", width: 3840, height: 2160 },
  { label: "8K Super HD", value: "8K", width: 7680, height: 4320 },
  { label: "Portrait 4K", value: "4K Portrait", width: 2160, height: 3840 },
];

const CATEGORY_OPTIONS = ["Abstract", "AMOLED", "4K/8K", "Anime", "Cars", "Nature", "Space", "Architecture"];

export default function AiLab() {
  const [prompt, setPrompt] = useState("");
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTION_OPTIONS[1]);
  const [selectedCategory, setSelectedCategory] = useState("Abstract");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateMutation = useGenerateWallpaper();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({ title: "Please enter a prompt", variant: "destructive" });
      return;
    }

    generateMutation.mutate({
      data: {
        prompt: prompt.trim(),
        width: selectedResolution.width,
        height: selectedResolution.height,
        category: selectedCategory,
        upscale: false,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWallpapersQueryKey() });
        toast({ title: "Wallpaper generated!", description: "Your creation has been added to the gallery." });
      },
      onError: (err) => {
        toast({
          title: "Generation failed",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive"
        });
      }
    });
  };

  const handleDownload = () => {
    if (!generateMutation.data?.imageUrl) return;
    const filename = `chaopixels-ai-${Date.now()}.jpg`;
    const proxyUrl = `${BASE}/api/proxy-download?url=${encodeURIComponent(generateMutation.data.imageUrl)}&filename=${encodeURIComponent(filename)}`;
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Flux.1 AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent mb-4">
            AI Wallpaper Lab
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe your perfect wallpaper and watch AI bring it to life in stunning 4K/8K resolution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5"
            >
              <label className="text-sm font-medium text-foreground mb-2 block">Describe your wallpaper</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cosmic nebula with violet and electric blue hues, ultra detailed, 8K..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all"
                data-testid="textarea-prompt"
              />
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
                <div className="flex flex-col gap-1.5">
                  {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                      className="text-left text-xs text-muted-foreground hover:text-violet-300 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-all flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Resolution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5"
            >
              <label className="text-sm font-medium text-foreground mb-3 block">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                {RESOLUTION_OPTIONS.map((res) => (
                  <button
                    key={res.value}
                    onClick={() => setSelectedResolution(res)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                      selectedResolution.value === res.value
                        ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                    data-testid={`button-resolution-${res.value.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="font-semibold">{res.value}</span>
                    <br />
                    <span className="opacity-70">{res.width}×{res.height}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Category */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5"
            >
              <label className="text-sm font-medium text-foreground mb-3 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-violet-600/30 border border-violet-500/50 text-violet-200"
                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`button-category-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* AI notice */}
            <div className="flex gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/80">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>AI generates at optimized resolution. High resolutions may take 15-30 seconds.</span>
            </div>

            {/* Generate button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-900 disabled:to-indigo-900 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all"
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Wallpaper
                </>
              )}
            </motion.button>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden h-full min-h-[400px] flex flex-col"
            >
              <AnimatePresence mode="wait">
                {generateMutation.isPending && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-6 p-8"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-xl animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-medium">Creating your masterpiece...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Flux.1 AI is generating at {selectedResolution.label}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {generateMutation.data && !generateMutation.isPending && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 relative overflow-hidden">
                      <img
                        src={generateMutation.data.imageUrl}
                        alt="Generated wallpaper"
                        className="w-full h-full object-cover"
                        style={{ maxHeight: "500px" }}
                        data-testid="img-generated"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white text-sm font-medium line-clamp-2">{generateMutation.data.prompt}</p>
                        <p className="text-white/60 text-xs mt-1">
                          {generateMutation.data.width} × {generateMutation.data.height} px
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border-t border-white/5 flex gap-3">
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-medium text-white transition-all"
                        data-testid="button-download-generated"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => generateMutation.reset()}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                      >
                        New
                      </button>
                    </div>
                  </motion.div>
                )}

                {!generateMutation.isPending && !generateMutation.data && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-white/5 flex items-center justify-center mb-6">
                      <Wand2 className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-foreground font-medium">Your AI wallpaper will appear here</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      Enter a creative prompt and click Generate to create a unique wallpaper
                    </p>
                    <div className="mt-8 flex flex-col gap-1.5 w-full max-w-xs">
                      {PROMPT_SUGGESTIONS.slice(3).map((s) => (
                        <button
                          key={s}
                          onClick={() => setPrompt(s)}
                          className="text-left text-xs text-muted-foreground hover:text-violet-300 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-all flex items-center gap-1.5"
                        >
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{s}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
