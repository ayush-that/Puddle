"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  User,
  Wallet,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = usePrivy();

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile",
          description: "Manage your profile information",
          action: () => console.log("Profile clicked"),
        },
        {
          icon: Mail,
          label: "Email",
          description: user?.email?.address || "Not connected",
          action: () => console.log("Email clicked"),
        },
        {
          icon: Wallet,
          label: "Wallet",
          description: user?.wallet?.address
            ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
            : "Not connected",
          action: () => console.log("Wallet clicked"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notification settings",
          action: () => console.log("Notifications clicked"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "Get help with your account",
          action: () => console.log("Help clicked"),
        },
        {
          icon: Shield,
          label: "Privacy & Security",
          description: "Manage your privacy settings",
          action: () => console.log("Privacy clicked"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground">
                  {user?.email?.address || "User"}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.wallet?.address
                    ? `${user.wallet.address.slice(0, 12)}...${user.wallet.address.slice(-8)}`
                    : "No wallet connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🎨</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {section.title}
            </h3>
            <Card>
              <CardContent className="p-0">
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={`
                        w-full flex items-center gap-3 p-4
                        hover:bg-accent transition-colors
                        active:scale-99 transition-transform
                        ${index !== section.items.length - 1 ? "border-b border-border" : ""}
                      `}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Button variant="destructive" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>

        {/* App Version */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Puddle v1.0.0</p>
        </div>
      </main>
    </div>
  );
}
