import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) {
        return saved === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="flex items-center gap-2" data-testid="theme-toggle-container">
      <Sun className="w-4 h-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={setIsDark}
        data-testid="switch-theme-toggle"
      />
      <Moon className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
