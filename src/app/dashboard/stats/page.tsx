"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/piggy-bank/dashboard-stats";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
} from "lucide-react";

export default function StatsPage() {
  // Mock data - replace with actual data
  const mockPiggyBanks = [
    {
      piggyBank: {
        id: "1",
        name: "Vacation Fund 2025",
        goalAmount: "2.5",
        currentAmount: "1.2",
        status: "active" as const,
        goalDeadline: new Date("2025-12-31T23:59:59Z"),
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        createdAt: new Date("2025-01-15T10:30:00Z"),
      },
      membership: { role: "creator" },
    },
    {
      piggyBank: {
        id: "2",
        name: "Emergency Savings",
        goalAmount: "5.0",
        currentAmount: "4.8",
        status: "active" as const,
        goalDeadline: new Date("2025-06-30T23:59:59Z"),
        contractAddress: "0x2345678901bcdef1234567890abcdef123456789",
        createdAt: new Date("2025-01-10T14:20:00Z"),
      },
      membership: { role: "partner" },
    },
  ];

  const stats = [
    {
      title: "This Month",
      value: "0.85 ETH",
      change: "+12.5%",
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      title: "Average Savings",
      value: "0.32 ETH",
      change: "per bank",
      trend: "neutral" as const,
      icon: DollarSign,
    },
    {
      title: "Goals Reached",
      value: "3",
      change: "this year",
      trend: "up" as const,
      icon: Target,
    },
    {
      title: "Active Banks",
      value: "5",
      change: "2 expiring soon",
      trend: "neutral" as const,
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your savings progress
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Overview Stats */}
        <DashboardStats piggyBanks={mockPiggyBanks} />

        {/* Detailed Stats Grid */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Detailed Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {stat.trend === "up" && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-foreground mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Savings Trend Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Chart coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Banks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Banks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPiggyBanks.map((pb, index) => {
              const progress =
                (parseFloat(pb.piggyBank.currentAmount) /
                  parseFloat(pb.piggyBank.goalAmount)) *
                100;
              return (
                <div key={pb.piggyBank.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {pb.piggyBank.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
