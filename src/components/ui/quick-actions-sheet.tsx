"use client";

import { useRouter } from "next/navigation";
import { PlusCircle, Coins, Bell, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
}

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionsSheet({ isOpen, onClose }: QuickActionsSheetProps) {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      id: "create",
      title: "Create New",
      description: "Start a new piggy bank",
      icon: PlusCircle,
      action: () => {
        onClose();
        router.push("/piggy-bank/create");
      },
    },
    {
      id: "deposit",
      title: "Quick Deposit",
      description: "Add funds to active banks",
      icon: Coins,
      action: () => {
        onClose();
        // TODO: Implement quick deposit modal
        console.log("Quick deposit clicked");
      },
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "View all alerts",
      icon: Bell,
      action: () => {
        onClose();
        router.push("/dashboard/activity");
      },
    },
    {
      id: "share",
      title: "Share Bank",
      description: "Invite a partner",
      icon: Share2,
      action: () => {
        onClose();
        // TODO: Implement share modal
        console.log("Share bank clicked");
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl pb-safe">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
              <p className="text-sm text-muted-foreground">Choose an action</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Actions Grid */}
          <div className="p-4 space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl",
                    "bg-background hover:bg-accent transition-colors",
                    "border border-border",
                    "active:scale-98 transition-transform duration-100",
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-foreground">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom padding for navigation */}
          <div className="h-20" />
        </div>
      </div>
    </>
  );
}
