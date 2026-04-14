import { motion } from "framer-motion";
import { Layers, Cpu, Palette, Car, Star, Sparkles, Zap } from "lucide-react";

export const CATEGORIES = [
  { label: "All", value: null, icon: <Layers className="w-3.5 h-3.5" /> },
  { label: "AMOLED", value: "AMOLED", icon: <Cpu className="w-3.5 h-3.5" /> },
  { label: "4K/8K", value: "4K/8K", icon: <Star className="w-3.5 h-3.5" /> },
  { label: "Anime", value: "Anime", icon: <Palette className="w-3.5 h-3.5" /> },
  { label: "Cars", value: "Cars", icon: <Car className="w-3.5 h-3.5" /> },
  { label: "Abstract", value: "Abstract", icon: <Layers className="w-3.5 h-3.5" /> },
  { label: "Chaotechh Reviews", value: "Chaotechh Reviews", icon: <Zap className="w-3.5 h-3.5" /> },
];

interface CategoryNavProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryNav({ selected, onSelect }: CategoryNavProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.value;
        const isChaotechh = cat.value === "Chaotechh Reviews";
        return (
          <motion.button
            key={cat.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? isChaotechh
                  ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                : isChaotechh
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
            data-testid={`button-category-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cat.icon}
            {cat.label}
          </motion.button>
        );
      })}
    </div>
  );
}
