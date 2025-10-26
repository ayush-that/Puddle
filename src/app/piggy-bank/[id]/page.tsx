"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalProgress } from "@/components/piggy-bank/goal-progress";
import { DepositForm } from "@/components/piggy-bank/deposit-form";
import { WithdrawalRequest } from "@/components/piggy-bank/withdrawal-request";
import { WithdrawalApproval } from "@/components/piggy-bank/withdrawal-approval";
import { TransactionHistory } from "@/components/piggy-bank/transaction-history";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  PiggyBank as PiggyBankIcon,
  Users,
  Target,
} from "lucide-react";

interface PiggyBankData {
  id: string;
  name: string;
  goalAmount: string;
  currentAmount: string;
  status: string;
  goalDeadline: string | null;
  contractAddress: string;
  createdAt: string;
  members: Array<{
    role: string;
    user: {
      walletAddress: string;
    };
  }>;
  transactions: Array<{
    id: string;
    amount: string;
    type: "deposit" | "withdrawal";
    status: "pending" | "completed" | "failed";
    transactionHash: string;
    createdAt: string;
    user: {
      walletAddress: string;
    };
  }>;
  pendingWithdrawal?: {
    id: string;
    withdrawalAmount: string;
    initiator: {
      walletAddress: string;
    };
    approved: boolean;
    approvedAt: string | null;
    executed: boolean;
    createdAt: string;
  };
}

export default function PiggyBankPage() {
  const { user, authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const params = useParams();
  const piggyBankId = params.id as string;

  const [piggyBank, setPiggyBank] = useState<PiggyBankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!authenticated || !user || !piggyBankId) return;

    const loadPiggyBank = async () => {
      try {
        const token = await getAccessToken();
        // TODO: Replace with actual API call
        // const data = await apiClient.getPiggyBank(piggyBankId, token);
        // setPiggyBank(data);

        // Mock data for now
        setPiggyBank({
          id: piggyBankId,
          name: "Vacation Fund",
          goalAmount: "2.0",
          currentAmount: "0.5",
          status: "active",
          goalDeadline: "2024-12-31",
          contractAddress: "0x1234567890123456789012345678901234567890",
          createdAt: "2024-01-01T00:00:00Z",
          members: [
            {
              role: "creator",
              user: {
                walletAddress: "0x1234567890123456789012345678901234567890",
              },
            },
            {
              role: "partner",
              user: {
                walletAddress: "0x0987654321098765432109876543210987654321",
              },
            },
          ],
          transactions: [],
        });
      } catch (error) {
        console.error("Failed to load piggy bank:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPiggyBank();
  }, [authenticated, user, getAccessToken, piggyBankId]);

  const handleDeposit = async (amount: string, piggyBankId: string) => {
    setIsDepositing(true);
    try {
      // TODO: Implement actual deposit
      console.log("Depositing", amount, "to piggy bank", piggyBankId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Deposit failed:", error);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRequestWithdrawal = async (
    amount: string,
    piggyBankId: string,
  ) => {
    setIsRequestingWithdrawal(true);
    try {
      // TODO: Implement actual withdrawal request
      console.log(
        "Requesting withdrawal of",
        amount,
        "from piggy bank",
        piggyBankId,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Withdrawal request failed:", error);
    } finally {
      setIsRequestingWithdrawal(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    setIsApproving(true);
    try {
      // TODO: Implement actual withdrawal approval
      console.log("Approving withdrawal", withdrawalId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Withdrawal approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      // TODO: Implement actual withdrawal rejection
      console.log("Rejecting withdrawal", withdrawalId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Withdrawal rejection failed:", error);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!piggyBank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Piggy bank not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <PiggyBankIcon className="h-6 w-6 text-foreground" />
                <h1 className="text-xl font-semibold text-foreground">
                  {piggyBank.name}
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress and Actions */}
          <div className="lg:col-span-2 space-y-6">
            <GoalProgress
              currentAmount={piggyBank.currentAmount}
              goalAmount={piggyBank.goalAmount}
              goalDeadline={piggyBank.goalDeadline}
            />

            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit">
                <DepositForm
                  contractAddress={piggyBank.contractAddress as `0x${string}`}
                  piggyBankId={piggyBank.id}
                  onDeposit={handleDeposit}
                  isDepositing={isDepositing}
                />
              </TabsContent>

              <TabsContent value="withdraw">
                <WithdrawalRequest
                  contractAddress={piggyBank.contractAddress as `0x${string}`}
                  piggyBankId={piggyBank.id}
                  currentBalance={piggyBank.currentAmount}
                  onRequestWithdrawal={handleRequestWithdrawal}
                  isRequesting={isRequestingWithdrawal}
                />
              </TabsContent>
            </Tabs>

            {piggyBank.pendingWithdrawal && (
              <WithdrawalApproval
                withdrawal={piggyBank.pendingWithdrawal}
                onApprove={handleApproveWithdrawal}
                onReject={handleRejectWithdrawal}
                isApproving={isApproving}
              />
            )}
          </div>

          {/* Right Column - Members and Transactions */}
          <div className="space-y-6">
            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {piggyBank.members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {member.role}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.user.walletAddress.slice(0, 6)}...
                          {member.user.walletAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <TransactionHistory transactions={piggyBank.transactions} />
          </div>
        </div>
      </main>
    </div>
  );
}
