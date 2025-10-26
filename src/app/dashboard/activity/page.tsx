"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  UserPlus,
  Target,
  Bell,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface Activity {
  id: string;
  type: "deposit" | "withdrawal" | "invite" | "goal_reached" | "notification";
  title: string;
  description: string;
  amount?: string;
  timestamp: Date;
  status?: "completed" | "pending" | "failed";
  piggyBankName?: string;
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<
    "all" | "deposits" | "withdrawals" | "notifications"
  >("all");

  // Mock activities - replace with actual data
  const activities: Activity[] = [
    {
      id: "1",
      type: "deposit",
      title: "Deposit Received",
      description: "Added to Emergency Savings",
      amount: "0.5 ETH",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "completed",
      piggyBankName: "Emergency Savings",
    },
    {
      id: "2",
      type: "goal_reached",
      title: "Goal Reached! 🎉",
      description: "New Laptop Fund reached its goal",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "completed",
      piggyBankName: "New Laptop Fund",
    },
    {
      id: "3",
      type: "invite",
      title: "Partner Joined",
      description: "Sarah joined Vacation Fund 2025",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      status: "completed",
      piggyBankName: "Vacation Fund 2025",
    },
    {
      id: "4",
      type: "withdrawal",
      title: "Withdrawal Pending",
      description: "Waiting for partner approval",
      amount: "1.0 ETH",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      status: "pending",
      piggyBankName: "Wedding Expenses",
    },
    {
      id: "5",
      type: "deposit",
      title: "Deposit Received",
      description: "Added to Gaming Setup",
      amount: "0.3 ETH",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "completed",
      piggyBankName: "Gaming Setup",
    },
    {
      id: "6",
      type: "notification",
      title: "Deadline Approaching",
      description: "Emergency Savings goal deadline in 7 days",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      status: "completed",
      piggyBankName: "Emergency Savings",
    },
  ];

  const getActivityIcon = (
    type: Activity["type"],
    status?: Activity["status"],
  ) => {
    switch (type) {
      case "deposit":
        return ArrowDownCircle;
      case "withdrawal":
        return ArrowUpCircle;
      case "invite":
        return UserPlus;
      case "goal_reached":
        return Target;
      case "notification":
        return Bell;
      default:
        return Bell;
    }
  };

  const getActivityColor = (
    type: Activity["type"],
    status?: Activity["status"],
  ) => {
    if (status === "failed") return "text-destructive";
    if (status === "pending") return "text-yellow-500";

    switch (type) {
      case "deposit":
        return "text-green-500";
      case "withdrawal":
        return "text-blue-500";
      case "invite":
        return "text-purple-500";
      case "goal_reached":
        return "text-primary";
      case "notification":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    if (filter === "deposits") return activity.type === "deposit";
    if (filter === "withdrawals") return activity.type === "withdrawal";
    if (filter === "notifications") return activity.type === "notification";
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your transactions and updates
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "deposits", label: "Deposits" },
            { value: "withdrawals", label: "Withdrawals" },
            { value: "notifications", label: "Alerts" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-colors
                ${
                  filter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type, activity.status);
              const color = getActivityColor(activity.type, activity.status);

              return (
                <Card key={activity.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-foreground">
                            {activity.title}
                          </h3>
                          {activity.amount && (
                            <span className="font-semibold text-foreground whitespace-nowrap">
                              {activity.amount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.piggyBankName && (
                            <Badge variant="outline" className="text-xs">
                              {activity.piggyBankName}
                            </Badge>
                          )}
                          {activity.status &&
                            activity.status !== "completed" && (
                              <Badge
                                variant={
                                  activity.status === "pending"
                                    ? "warning"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {activity.status}
                              </Badge>
                            )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(activity.timestamp, new Date(), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
