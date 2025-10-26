"use client";

import { PiggyBank } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target } from "lucide-react";

interface PiggyBankCardProps {
  piggyBank: PiggyBank;
  membership: {
    role: string;
  };
  onClick: () => void;
}

export function PiggyBankCard({
  piggyBank,
  membership,
  onClick,
}: PiggyBankCardProps) {
  const progress =
    (parseFloat(piggyBank.currentAmount) / parseFloat(piggyBank.goalAmount)) *
    100;
  const daysLeft = piggyBank.goalDeadline
    ? Math.ceil(
        (new Date(piggyBank.goalDeadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              {piggyBank.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{membership.role}</Badge>
            <Badge
              variant={
                piggyBank.status === "active"
                  ? "success"
                  : piggyBank.status === "completed"
                    ? "default"
                    : "outline"
              }
            >
              {piggyBank.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>Goal: {parseFloat(piggyBank.goalAmount).toFixed(4)} ETH</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Current</p>
            <p className="font-semibold text-foreground">
              {parseFloat(piggyBank.currentAmount).toFixed(4)} ETH
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold text-foreground">
              {(
                parseFloat(piggyBank.goalAmount) -
                parseFloat(piggyBank.currentAmount)
              ).toFixed(4)}{" "}
              ETH
            </p>
          </div>
        </div>

        {/* Deadline */}
        {daysLeft !== null && (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {daysLeft > 0 ? (
                <span className="font-medium text-foreground">
                  {daysLeft} days left
                </span>
              ) : (
                <span className="font-medium text-destructive">
                  Deadline passed
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
