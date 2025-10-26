"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { PiggyBankCreateForm } from "@/components/piggy-bank/piggy-bank-create-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreatePiggyBank() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

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
      // TODO: Implement actual piggy bank creation
      // 1. Deploy smart contract
      // 2. Save to database
      // 3. Redirect to piggy bank page

      console.log("Creating piggy bank with data:", data);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to dashboard for now
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create piggy bank:", error);
      alert("Failed to create piggy bank. Please try again.");
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
