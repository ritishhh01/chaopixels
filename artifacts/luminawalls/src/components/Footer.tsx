import { Link } from "wouter";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t mt-16 border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-violet-500/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              Chao<span className="text-violet-500">Pixels</span>
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Discover</Link>
            <Link href="/ai-lab" className="hover:text-foreground transition-colors">AI Lab</Link>
            <Link href="/favorites" className="hover:text-foreground transition-colors">Favorites</Link>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-xs text-muted-foreground">
              Made with <span className="text-rose-500">♥</span> by{" "}
              <a
                href="https://github.com/chaotechh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:text-violet-400 font-medium transition-colors"
              >
                chaotechh
              </a>
            </p>
            <p className="text-xs text-muted-foreground/50">
              Discover & generate 4K/8K wallpapers with AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
