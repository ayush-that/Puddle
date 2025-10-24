"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, TrendingUp } from "lucide-react";

interface GoalProgressProps {
  currentAmount: string;
  goalAmount: string;
  goalDeadline?: string | null;
}

export function GoalProgress({ currentAmount, goalAmount, goalDeadline }: GoalProgressProps) {
  const current = parseFloat(currentAmount);
  const goal = parseFloat(goalAmount);
  const progress = (current / goal) * 100;
  const remaining = goal - current;

  const daysLeft = goalDeadline
    ? Math.ceil((new Date(goalDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 100) return "default";
    if (progress >= 75) return "default";
    if (progress >= 50) return "default";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Savings Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Circle */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className={getProgressColor(progress)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getProgressColor(progress)}`}>
                {progress.toFixed(0)}%
              </span>
              <span className="text-xs text-gray-500">Complete</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className={`font-semibold ${getProgressColor(progress)}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Current</p>
            <p className="text-lg font-bold text-blue-600">
              {current.toFixed(4)} ETH
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Goal</p>
            <p className="text-lg font-bold text-gray-600">
              {goal.toFixed(4)} ETH
            </p>
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Remaining</p>
          <p className="text-lg font-semibold text-gray-900">
            {remaining.toFixed(4)} ETH
          </p>
        </div>

        {/* Deadline */}
        {daysLeft !== null && (
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {daysLeft > 0 ? (
                <>
                  <span className="font-semibold text-gray-900">{daysLeft}</span> days remaining
                </>
              ) : (
                <span className="font-semibold text-red-600">Deadline passed</span>
              )}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={getProgressVariant(progress)}
            className="text-sm"
          >
            {progress >= 100 ? "Goal Reached!" : "In Progress"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

