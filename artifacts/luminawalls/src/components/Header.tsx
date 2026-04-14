import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Search, Sparkles, Heart, Menu, X, Zap } from "lucide-react";
import { useUser, useClerk, Show } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ searchQuery = "", onSearchChange }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Discover" },
    { href: "/ai-lab", label: "AI Lab", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { href: "/favorites", label: "Favorites", icon: <Heart className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
          </div>
          <span className="text-base font-bold tracking-tight hidden sm:block text-white">
            Chao<span className="text-violet-500">Pixels</span>
          </span>
        </Link>

        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search wallpapers, tags, styles..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                data-testid="input-search"
              />
            </div>
          </div>
        )}

        <div className="flex-1" />

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location === link.href
                  ? "bg-violet-500/20 text-violet-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 ml-2">
          <Show when="signed-in">
            <div className="flex items-center gap-2">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-7 h-7 rounded-full ring-1 ring-violet-500/40"
                />
              )}
              <span className="text-sm text-muted-foreground max-w-[100px] truncate">
                {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                data-testid="button-logout"
              >
                Log out
              </button>
            </div>
          </Show>
          <Show when="signed-out">
            <button
              onClick={() => setLocation("/sign-in")}
              className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-medium text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
              data-testid="button-login"
            >
              Log in
            </button>
          </Show>
        </div>

        <button
          className="md:hidden p-2 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {onSearchChange !== undefined && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search wallpapers..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-black/80 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location === link.href
                      ? "bg-violet-500/20 text-violet-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
                <Show when="signed-in">
                  <button onClick={() => signOut()} className="w-full text-left px-3 py-2 text-sm text-muted-foreground">
                    Log out
                  </button>
                </Show>
                <Show when="signed-out">
                  <button
                    onClick={() => { setLocation("/sign-in"); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-medium text-white"
                  >
                    Log in
                  </button>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
