"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") {
      return <Sun className="h-4 w-4" />;
    } else {
      return <Moon className="h-4 w-4" />;
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme} className="p-2">
      {getIcon()}
    </Button>
  );
}
