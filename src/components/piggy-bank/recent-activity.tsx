"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "deposit" | "withdrawal" | "goal_reached" | "bank_created";
  piggyBankName: string;
  amount?: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

interface RecentActivityProps {
  className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
  // Mock activity data
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "deposit",
      piggyBankName: "Vacation Fund 2025",
      amount: "0.5",
      timestamp: "2025-01-28T14:30:00Z",
      status: "completed"
    },
    {
      id: "2",
      type: "goal_reached",
      piggyBankName: "New Laptop Fund",
      amount: "1.5",
      timestamp: "2025-01-27T10:15:00Z",
      status: "completed"
    },
    {
      id: "3",
      type: "deposit",
      piggyBankName: "Emergency Savings",
      amount: "1.2",
      timestamp: "2025-01-26T16:45:00Z",
      status: "completed"
    },
    {
      id: "4",
      type: "bank_created",
      piggyBankName: "Gaming Setup",
      amount: "3.0",
      timestamp: "2025-01-25T11:30:00Z",
      status: "completed"
    },
    {
      id: "5",
      type: "deposit",
      piggyBankName: "Wedding Expenses",
      amount: "0.8",
      timestamp: "2025-01-24T09:20:00Z",
      status: "pending"
    },
    {
      id: "6",
      type: "withdrawal",
      piggyBankName: "Cancelled Project",
      amount: "0.8",
      timestamp: "2025-01-23T13:10:00Z",
      status: "completed"
    }
  ];

  const getActivityIcon = (type: string, status: string) => {
    if (status === "pending") {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    switch (type) {
      case "deposit":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case "goal_reached":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case "bank_created":
        return <ArrowUpCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "deposit":
        return `Deposited ${activity.amount} ETH to`;
      case "withdrawal":
        return `Withdrew ${activity.amount} ETH from`;
      case "goal_reached":
        return `Goal reached for`;
      case "bank_created":
        return `Created new piggy bank`;
      default:
        return "Activity in";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground font-medium">
                    {getActivityText(activity)} {activity.piggyBankName}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(activity.status)}`}
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
