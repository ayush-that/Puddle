"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart3, PlusCircle, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  showQuickActions?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", path: "/dashboard", icon: Home },
  { name: "Stats", path: "/dashboard/stats", icon: BarChart3 },
  { name: "New", path: "", icon: PlusCircle, showQuickActions: true },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
  { name: "Activity", path: "/dashboard/activity", icon: Activity },
];

interface BottomNavigationProps {
  onQuickActionsOpen: () => void;
}

export function BottomNavigation({
  onQuickActionsOpen,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (item: NavItem) => {
    if (item.showQuickActions) {
      onQuickActionsOpen();
    } else {
      router.push(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                "active:bg-accent active:scale-95 transition-transform duration-100",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary")} />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
