import { Link, useLocation } from "wouter";
import { Home, Sparkles, Heart } from "lucide-react";

const NAV = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/ai-lab", label: "AI Lab", icon: Sparkles },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-bottom bg-black/85 border-white/8">
      <div className="flex items-stretch h-16">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all ${
                active ? "text-violet-500" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
