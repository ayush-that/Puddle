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
import { ChatWindow } from "@/components/push/chat-window";
import {
  ArrowLeft,
  PiggyBank as PiggyBankIcon,
  Users,
  Target,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useDeposit } from "@/hooks/useDeposit";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { useToast } from "@/hooks/use-toast";

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
  const { deposit } = useDeposit();
  const { approveWithdrawal } = useWithdrawal();
  const { toast } = useToast();

  const loadPiggyBank = async () => {
    if (!authenticated || !user || !piggyBankId) return;

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        console.error("No access token available");
        return;
      }
      const data = await apiClient.getPiggyBank(piggyBankId, token);
      setPiggyBank(data.piggyBank);
    } catch (error) {
      console.error("Failed to load piggy bank:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    loadPiggyBank();
  }, [authenticated, user, piggyBankId]);

  const handleDeposit = async (amount: string, piggyBankId: string) => {
    if (!piggyBank?.contractAddress) return;

    setIsDepositing(true);
    try {
      // 1. Call smart contract deposit function
      toast({
        title: "Processing deposit...",
        description: "Please confirm the transaction in your wallet",
      });

      const txHash = await deposit(
        piggyBank.contractAddress as `0x${string}`,
        amount,
      );

      // 2. Update database
      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }
      await apiClient.recordDeposit(
        {
          contractAddress: piggyBank.contractAddress,
          amount,
          transactionHash: txHash,
        },
        token,
      );

      toast({
        title: "Deposit successful!",
        description: `Deposited ${amount} PUSH`,
      });

      // 3. Refresh piggy bank data
      await loadPiggyBank();
    } catch (error) {
      console.error("Deposit failed:", error);
      toast({
        title: "Deposit failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
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
      toast({
        title: "Requesting withdrawal...",
        description: "Notifying your partner for approval",
      });

      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }
      await apiClient.requestWithdrawal(
        {
          piggyBankId,
          amount,
        },
        token,
      );

      toast({
        title: "Withdrawal requested!",
        description: "Your partner will be notified to approve",
      });

      // Refresh piggy bank data
      await loadPiggyBank();
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      toast({
        title: "Request failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRequestingWithdrawal(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!piggyBank?.contractAddress) return;

    setIsApproving(true);
    try {
      // 1. Call smart contract to approve withdrawal
      toast({
        title: "Approving withdrawal...",
        description: "Please confirm the transaction in your wallet",
      });

      await approveWithdrawal(piggyBank.contractAddress as `0x${string}`);

      // 2. Update database to record approval
      toast({
        title: "Updating records...",
        description: "Recording approval in database",
      });

      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }
      await apiClient.approveWithdrawal(withdrawalId, token);

      // 3. Smart contract auto-executes if both partners approved
      toast({
        title: "Withdrawal executed!",
        description: "Funds have been transferred successfully",
      });

      // 4. Refresh piggy bank data
      await loadPiggyBank();
    } catch (error) {
      console.error("Withdrawal approval failed:", error);
      toast({
        title: "Approval failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      toast({
        title: "Rejecting withdrawal...",
        description: "This feature will be implemented soon",
      });
      // TODO: Implement withdrawal rejection API endpoint
    } catch (error) {
      console.error("Withdrawal rejection failed:", error);
      toast({
        title: "Rejection failed",
        description: "Please try again",
        variant: "destructive",
      });
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
                contractAddress={piggyBank.contractAddress as `0x${string}`}
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

            {/* Chat */}
            <ChatWindow
              piggyBankName={piggyBank.name}
              partnerAddress={
                piggyBank.members.find(
                  (m) => m.user.walletAddress !== user?.wallet?.address,
                )?.user.walletAddress
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
