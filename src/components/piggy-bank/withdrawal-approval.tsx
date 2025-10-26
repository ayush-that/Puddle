"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface WithdrawalApproval {
  id: string;
  withdrawalAmount: string;
  initiator: {
    walletAddress: string;
  };
  approved: boolean;
  approvedAt: string | null;
  executed: boolean;
  createdAt: string;
}

interface WithdrawalApprovalProps {
  withdrawal: WithdrawalApproval;
  onApprove: (withdrawalId: string) => Promise<void>;
  onReject: (withdrawalId: string) => Promise<void>;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function WithdrawalApproval({
  withdrawal,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: WithdrawalApprovalProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = () => {
    if (withdrawal.executed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (withdrawal.approved) {
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (withdrawal.executed) return "Executed";
    if (withdrawal.approved) return "Approved";
    return "Pending Approval";
  };

  const getStatusColor = () => {
    if (withdrawal.executed) return "bg-green-100 text-green-800";
    if (withdrawal.approved) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Withdrawal Approval
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A withdrawal has been requested. Both partners must approve before
            funds can be withdrawn.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Withdrawal Details */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">
                {withdrawal.withdrawalAmount} ETH
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Requested by</span>
              <span className="font-medium text-gray-900">
                {formatAddress(withdrawal.initiator.walletAddress)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requested</span>
              <span className="text-sm text-gray-500">
                {formatDistance(new Date(withdrawal.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor()}`}
              >
                {getStatusText()}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          {!withdrawal.executed && !withdrawal.approved && (
            <div className="flex gap-2">
              <Button
                onClick={() => onApprove(withdrawal.id)}
                disabled={isApproving}
                className="flex-1"
                variant="default"
              >
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button
                onClick={() => onReject(withdrawal.id)}
                disabled={isRejecting}
                className="flex-1"
                variant="destructive"
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}

          {withdrawal.approved && !withdrawal.executed && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Withdrawal approved! Waiting for execution.
              </p>
            </div>
          )}

          {withdrawal.executed && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Withdrawal executed successfully.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
