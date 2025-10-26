"use client";

import { useEffect, useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PiggyBankCard } from "@/components/piggy-bank/piggy-bank-card";
import { PiggyBank } from "@/db/schema";
import { DashboardStats } from "@/components/piggy-bank/dashboard-stats";
import { SkeletonCard, SkeletonStats } from "@/components/ui/skeleton-card";
import { ThemeToggle } from "@/components/theme-toggle";

import { Plus, Search, Filter, X } from "lucide-react";

interface PiggyBankWithMembership {
  piggyBank: PiggyBank;
  membership: {
    role: string;
  };
}

export default function Dashboard() {
  const { user, authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [piggyBanks, setPiggyBanks] = useState<PiggyBankWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

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
        const mockPiggyBanks: PiggyBankWithMembership[] = [
          {
            piggyBank: {
              id: "1",
              name: "Vacation Fund 2025",
              goalAmount: "2.5",
              currentAmount: "1.2",
              status: "active",
              goalDeadline: new Date("2025-12-31T23:59:59Z"),
              contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
              createdAt: new Date("2025-01-15T10:30:00Z"),
            },
            membership: { role: "creator" },
          },
          {
            piggyBank: {
              id: "2",
              name: "Emergency Savings",
              goalAmount: "5.0",
              currentAmount: "4.8",
              status: "active",
              goalDeadline: new Date("2025-06-30T23:59:59Z"),
              contractAddress: "0x2345678901bcdef1234567890abcdef123456789",
              createdAt: new Date("2025-01-10T14:20:00Z"),
            },
            membership: { role: "partner" },
          },
          {
            piggyBank: {
              id: "3",
              name: "New Laptop Fund",
              goalAmount: "1.5",
              currentAmount: "1.5",
              status: "completed",
              goalDeadline: new Date("2025-03-15T23:59:59Z"),
              contractAddress: "0x3456789012cdef1234567890abcdef1234567890",
              createdAt: new Date("2025-01-05T09:15:00Z"),
            },
            membership: { role: "creator" },
          },
          {
            piggyBank: {
              id: "4",
              name: "Wedding Expenses",
              goalAmount: "10.0",
              currentAmount: "2.1",
              status: "active",
              goalDeadline: new Date("2025-08-20T23:59:59Z"),
              contractAddress: "0x4567890123def1234567890abcdef1234567890",
              createdAt: new Date("2025-01-20T16:45:00Z"),
            },
            membership: { role: "partner" },
          },
          {
            piggyBank: {
              id: "5",
              name: "Gaming Setup",
              goalAmount: "3.0",
              currentAmount: "0.3",
              status: "active",
              goalDeadline: new Date("2025-11-30T23:59:59Z"),
              contractAddress: "0x5678901234ef1234567890abcdef1234567890",
              createdAt: new Date("2025-01-25T11:30:00Z"),
            },
            membership: { role: "creator" },
          },
        ];
        setPiggyBanks(mockPiggyBanks);
      } catch (error) {
        console.error("Failed to load piggy banks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPiggyBanks();
  }, [authenticated, user, getAccessToken]);

  // Filter and sort piggy banks
  const filteredAndSortedPiggyBanks = useMemo(() => {
    let filtered = piggyBanks;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((pb) =>
        pb.piggyBank.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((pb) => pb.piggyBank.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.piggyBank.name.localeCompare(b.piggyBank.name);
        case "amount":
          return (
            parseFloat(b.piggyBank.currentAmount) -
            parseFloat(a.piggyBank.currentAmount)
          );
        case "progress":
          const progressA =
            (parseFloat(a.piggyBank.currentAmount) /
              parseFloat(a.piggyBank.goalAmount)) *
            100;
          const progressB =
            (parseFloat(b.piggyBank.currentAmount) /
              parseFloat(b.piggyBank.goalAmount)) *
            100;
          return progressB - progressA;
        case "date":
          return (
            new Date(b.piggyBank.createdAt).getTime() -
            new Date(a.piggyBank.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [piggyBanks, searchQuery, statusFilter, sortBy]);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border pt-safe">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Puddle</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {/* Stats Section */}
        {loading ? (
          <SkeletonStats />
        ) : (
          <DashboardStats piggyBanks={piggyBanks} />
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search piggy banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Piggy Banks Section */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : filteredAndSortedPiggyBanks.length === 0 ? (
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {piggyBanks.length === 0
                      ? "No Piggy Banks Yet"
                      : "No Results Found"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">
                    {piggyBanks.length === 0
                      ? "Create your first piggy bank and start saving with a partner!"
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  <Button
                    onClick={() => router.push("/piggy-bank/create")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {piggyBanks.length === 0
                      ? "Create Your First Piggy Bank"
                      : "Create New Piggy Bank"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAndSortedPiggyBanks.map((pb) => (
                <PiggyBankCard
                  key={pb.piggyBank.id}
                  piggyBank={pb.piggyBank}
                  membership={pb.membership}
                  onClick={() => router.push(`/piggy-bank/${pb.piggyBank.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
