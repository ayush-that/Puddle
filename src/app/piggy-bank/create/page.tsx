"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { PiggyBankCreateForm } from "@/components/piggy-bank/piggy-bank-create-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatePiggyBank } from "@/hooks/usePiggyBank";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function CreatePiggyBank() {
  const { authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { createPiggyBank } = useCreatePiggyBank();
  const { toast } = useToast();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    router.push("/");
    return null;
  }

  const handleCreatePiggyBank = async (data: any) => {
    setIsCreating(true);

    try {
      // 1. Deploy smart contract
      toast({
        title: "Deploying contract...",
        description: "Please confirm the transaction in your wallet",
      });

      const contractAddress = await createPiggyBank(
        data.partnerAddress,
        data.goalAmount,
        data.goalDeadline
          ? Math.floor(new Date(data.goalDeadline).getTime() / 1000)
          : 0,
      );

      // 2. Save to database
      toast({
        title: "Saving piggy bank...",
        description: "Creating your piggy bank record",
      });

      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }
      const result = await apiClient.createPiggyBank(
        {
          name: data.name,
          goalAmount: data.goalAmount,
          goalDeadline: data.goalDeadline,
          contractAddress,
        },
        token,
      );

      // 3. Invite partner
      if (result.piggyBank?.id) {
        await apiClient.invitePartner(
          result.piggyBank.id,
          data.partnerAddress,
          token,
        );
      }

      toast({
        title: "Success!",
        description: "Your piggy bank has been created",
      });

      // 4. Redirect to piggy bank page
      router.push(`/piggy-bank/${result.piggyBank.id}`);
    } catch (error) {
      console.error("Failed to create piggy bank:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create piggy bank",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

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
              <h1 className="text-xl font-semibold text-foreground">
                Create Piggy Bank
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PiggyBankCreateForm
          onSubmit={handleCreatePiggyBank}
          isLoading={isCreating}
        />
      </main>
    </div>
  );
}
