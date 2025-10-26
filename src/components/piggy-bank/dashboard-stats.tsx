"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PiggyBank as PiggyBankIcon,
  TrendingUp,
  Target,
  DollarSign,
} from "lucide-react";
import { PiggyBank } from "@/db/schema";

interface PiggyBankWithMembership {
  piggyBank: PiggyBank;
  membership: {
    role: string;
  };
}

interface DashboardStatsProps {
  piggyBanks: PiggyBankWithMembership[];
}

export function DashboardStats({ piggyBanks }: DashboardStatsProps) {
  // Calculate statistics
  const totalSaved = piggyBanks.reduce(
    (sum, pb) => sum + parseFloat(pb.piggyBank.currentAmount),
    0,
  );
  const totalGoal = piggyBanks.reduce(
    (sum, pb) => sum + parseFloat(pb.piggyBank.goalAmount),
    0,
  );
  const activeBanks = piggyBanks.filter(
    (pb) => pb.piggyBank.status === "active",
  ).length;
  const completedBanks = piggyBanks.filter(
    (pb) => pb.piggyBank.status === "completed",
  ).length;
  const averageProgress =
    piggyBanks.length > 0
      ? piggyBanks.reduce((sum, pb) => {
          const progress =
            (parseFloat(pb.piggyBank.currentAmount) /
              parseFloat(pb.piggyBank.goalAmount)) *
            100;
          return sum + progress;
        }, 0) / piggyBanks.length
      : 0;

  const stats = [
    {
      title: "Total Saved",
      value: `${totalSaved.toFixed(2)} ETH`,
      icon: DollarSign,
      description: "Across all piggy banks",
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Active Banks",
      value: activeBanks.toString(),
      icon: PiggyBankIcon,
      description: "Currently saving",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Completed",
      value: completedBanks.toString(),
      icon: Target,
      description: "Goals achieved",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Avg Progress",
      value: `${averageProgress.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Overall progress",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
