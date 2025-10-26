"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  ArrowUpCircle,
  Bell,
  Share2,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      title: "Create New",
      description: "Start a new piggy bank",
      icon: Plus,
      onClick: () => router.push("/piggy-bank/create"),
      variant: "default" as const,
      className: "bg-primary hover:bg-primary/90",
    },
    {
      title: "Quick Deposit",
      description: "Add funds to active banks",
      icon: ArrowUpCircle,
      onClick: () => {
        // TODO: Open quick deposit modal
        console.log("Quick deposit clicked");
      },
      variant: "outline" as const,
      className:
        "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    },
    {
      title: "Notifications",
      description: "View all alerts",
      icon: Bell,
      onClick: () => {
        // TODO: Open notifications panel
        console.log("Notifications clicked");
      },
      variant: "outline" as const,
      className:
        "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white",
    },
    {
      title: "Share Bank",
      description: "Invite a partner",
      icon: Share2,
      onClick: () => {
        // TODO: Open share modal
        console.log("Share clicked");
      },
      variant: "outline" as const,
      className:
        "border-green-500 text-green-500 hover:bg-green-500 hover:text-white",
    },
  ];

  const quickStats = [
    {
      title: "Active Banks",
      value: "4",
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Partners",
      value: "3",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.title}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className={`w-full justify-start h-auto p-4 ${action.className}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-80">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Settings Button */}
      <Button
        variant="ghost"
        onClick={() => {
          // TODO: Open settings
          console.log("Settings clicked");
        }}
        className="w-full justify-start h-auto p-4 text-muted-foreground hover:text-foreground"
      >
        <div className="flex items-center gap-3 w-full">
          <Settings className="h-5 w-5 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-medium">Settings</div>
            <div className="text-xs opacity-80">Preferences & account</div>
          </div>
        </div>
      </Button>
    </div>
  );
}
