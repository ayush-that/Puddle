"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBankCard } from "@/components/piggy-bank/piggy-bank-card";
import { ThemeToggle } from "@/components/theme-toggle";

import { PiggyBank as PiggyBankIcon, Plus, Bell } from "lucide-react";

interface PiggyBankWithMembership {
  piggyBank: {
    id: string;
    name: string;
    goalAmount: string;
    currentAmount: string;
    status: "active" | "completed" | "cancelled";
    goalDeadline: string | null;
    contractAddress: string;
    createdAt: string;
  };
  membership: {
    role: string;
  };
}

export default function Dashboard() {
  const { user, authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [piggyBanks, setPiggyBanks] = useState<PiggyBankWithMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!authenticated || !user) return;

    const loadPiggyBanks = async () => {
      try {
        const token = await getAccessToken();
        // TODO: Replace with actual API call
        // const data = await apiClient.getPiggyBanks(token);
        // setPiggyBanks(data.piggyBanks);

        // Mock data for now
        setPiggyBanks([]);
      } catch (error) {
        console.error("Failed to load piggy banks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPiggyBanks();
  }, [authenticated, user, getAccessToken]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PiggyBankIcon className="h-8 w-8 text-foreground" />
              <h1 className="text-2xl font-bold text-foreground">
                My Piggy Banks
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                onClick={() => router.push("/piggy-bank/create")}
                variant="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {piggyBanks.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <PiggyBankIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  No Piggy Banks Yet
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Create your first piggy bank and start saving with a partner!
                </p>
                <Button
                  onClick={() => router.push("/piggy-bank/create")}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Piggy Bank
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {piggyBanks.map((pb) => (
              <PiggyBankCard
                key={pb.piggyBank.id}
                piggyBank={pb.piggyBank}
                membership={pb.membership}
                onClick={() => router.push(`/piggy-bank/${pb.piggyBank.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
