"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PiggyBank, Shield, Users, Target, ArrowRight } from "lucide-react";

export default function Home() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PiggyBank className="h-8 w-8 text-foreground" />
              <h1 className="text-xl font-bold text-foreground">
                Onchain Piggy Bank
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={login}
                variant="default"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-4xl w-full text-center text-foreground">
          <div className="mb-8">
            <PiggyBank className="h-24 w-24 mx-auto mb-6 text-foreground" />
            <h1 className="text-5xl font-bold mb-4 text-foreground">
              Save Together, Achieve Together
            </h1>
            <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
              Create shared savings goals with your partner on the blockchain. 
              Secure, transparent, and collaborative.
            </p>
          </div>

          <Button
            onClick={login}
            size="lg"
            className="px-8 py-4 text-lg"
          >
            Start Saving Together
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-foreground" />
                <h3 className="font-bold text-xl mb-2 text-foreground">Secure</h3>
                <p className="text-muted-foreground">
                  Your funds are secured by smart contracts on Ethereum
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-foreground" />
                <h3 className="font-bold text-xl mb-2 text-foreground">
                  Collaborative
                </h3>
                <p className="text-muted-foreground">
                  Both partners must approve withdrawals
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-foreground" />
                <h3 className="font-bold text-xl mb-2 text-foreground">
                  Goal-Oriented
                </h3>
                <p className="text-muted-foreground">
                  Set goals and track your progress together
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
