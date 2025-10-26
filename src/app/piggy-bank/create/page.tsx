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
    let contractAddress: string | null = null;
    let piggyBankId: string | null = null;

    try {
      // Validate access token early
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Step 1: Deploy smart contract
      toast({
        title: "Deploying contract...",
        description: "Please confirm the transaction in your wallet",
      });

      try {
        contractAddress = await createPiggyBank(
          data.partnerAddress,
          data.goalAmount,
          data.goalDeadline
            ? Math.floor(new Date(data.goalDeadline).getTime() / 1000)
            : 0,
        );

        // Validate contract deployment
        if (!contractAddress) {
          throw new Error("Contract deployment failed - no address returned");
        }

        console.log("Contract deployed successfully:", contractAddress);
      } catch (error) {
        console.error("Contract deployment failed:", error);
        throw new Error(
          `Contract deployment failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }

      // Step 2: Save to database
      toast({
        title: "Saving piggy bank...",
        description: "Creating your piggy bank record",
      });

      let result;
      try {
        result = await apiClient.createPiggyBank(
          {
            name: data.name,
            goalAmount: data.goalAmount,
            goalDeadline: data.goalDeadline,
            contractAddress,
          },
          token,
        );

        if (!result.piggyBank?.id) {
          throw new Error("Database save failed - no piggy bank ID returned");
        }

        piggyBankId = result.piggyBank.id;
        console.log("Piggy bank saved successfully:", piggyBankId);
      } catch (error) {
        console.error("Database save failed:", error);

        // Compensating action: Record orphaned contract for ops reconciliation
        try {
          await apiClient.recordOrphanedContract(
            {
              contractAddress,
              reason: "database_save_failed",
              error: error instanceof Error ? error.message : "Unknown error",
              userData: {
                name: data.name,
                goalAmount: data.goalAmount,
                partnerAddress: data.partnerAddress,
              },
            },
            token,
          );
          console.log("Orphaned contract recorded for reconciliation");
        } catch (auditError) {
          console.error("Failed to record orphaned contract:", auditError);
        }

        throw new Error(
          `Failed to save piggy bank: ${
            error instanceof Error ? error.message : "Database error"
          }. Contract was deployed but not saved. Support has been notified.`,
        );
      }

      // Step 3: Invite partner with retry logic
      if (piggyBankId) {
        toast({
          title: "Inviting partner...",
          description: "Sending invitation to your partner",
        });

        let inviteSuccess = false;
        let lastInviteError: Error | null = null;

        // Retry logic with exponential backoff
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await apiClient.invitePartner(
              piggyBankId,
              data.partnerAddress,
              token,
            );
            inviteSuccess = true;
            console.log("Partner invited successfully");
            break;
          } catch (error) {
            lastInviteError =
              error instanceof Error ? error : new Error("Unknown error");
            console.error(`Invite attempt ${attempt} failed:`, error);

            if (attempt < 3) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.pow(2, attempt - 1) * 1000;
              console.log(`Retrying invite in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        if (!inviteSuccess) {
          // Record pending invite for retry
          try {
            await apiClient.recordPendingInvite(
              {
                piggyBankId,
                partnerAddress: data.partnerAddress,
                attempts: 3,
                lastError: lastInviteError?.message || "Unknown error",
              },
              token,
            );
            console.log("Pending invite recorded for retry");
          } catch (auditError) {
            console.error("Failed to record pending invite:", auditError);
          }

          // Show partial success message
          toast({
            title: "Piggy bank created!",
            description:
              "Partner invitation is pending. They will be notified shortly.",
          });
        } else {
          toast({
            title: "Success!",
            description: "Your piggy bank has been created and partner invited",
          });
        }
      }

      // Redirect to piggy bank page
      if (piggyBankId) {
        router.push(`/piggy-bank/${piggyBankId}`);
      }
    } catch (error) {
      console.error("Failed to create piggy bank:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to create piggy bank";

      toast({
        title: "Error",
        description: errorMessage,
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
