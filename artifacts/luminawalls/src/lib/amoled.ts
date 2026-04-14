export function isAmoledWallpaper(wallpaper: {
  category: string;
  tags: string[];
  imageUrl: string;
}): boolean {
  if (wallpaper.category === "AMOLED") return true;
  const lower = wallpaper.tags.map((t) => t.toLowerCase());
  return lower.some((t) =>
    ["amoled", "pure black", "pitch black", "oled", "true black", "dark mode", "black"].includes(t)
  );
}

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const rw = width / d;
  const rh = height / d;
  const commonRatios: Record<string, string> = {
    "16:9": "16:9", "4:3": "4:3", "3:2": "3:2", "21:9": "21:9",
    "9:16": "9:16", "9:19": "9:19", "9:20": "9:20", "1:1": "1:1",
    "9:21": "9:21",
  };
  const key = `${rw}:${rh}`;
  return commonRatios[key] ?? `${rw}:${rh}`;
}

export function getMegapixels(width: number, height: number): string {
  const mp = (width * height) / 1_000_000;
  return mp >= 1 ? `${mp.toFixed(1)} MP` : `${(mp * 1000).toFixed(0)} KP`;
}

export function getResolutionGrade(width: number, height: number): string {
  const px = width * height;
  if (px >= 7680 * 4320) return "8K Ultra HD";
  if (px >= 3840 * 2160) return "4K Ultra HD";
  if (px >= 2560 * 1440) return "2K QHD";
  if (px >= 1920 * 1080) return "Full HD";
  if (px >= 1280 * 720) return "HD";
  return "SD";
}
