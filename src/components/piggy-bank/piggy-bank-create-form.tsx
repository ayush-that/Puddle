"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PiggyBank as PiggyBankIcon, Users, Target, Calendar } from "lucide-react";

const createPiggyBankSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  goalAmount: z.string().min(0.0001, "Goal amount must be greater than 0"),
  partnerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  goalDeadline: z.string().optional(),
});

type CreatePiggyBankForm = z.infer<typeof createPiggyBankSchema>;

interface PiggyBankCreateFormProps {
  onSubmit: (data: CreatePiggyBankForm) => Promise<void>;
  isLoading?: boolean;
}

export function PiggyBankCreateForm({ onSubmit, isLoading = false }: PiggyBankCreateFormProps) {
  const form = useForm<CreatePiggyBankForm>({
    resolver: zodResolver(createPiggyBankSchema),
    defaultValues: {
      name: "",
      goalAmount: "",
      partnerAddress: "",
      goalDeadline: "",
    },
  });

  const handleSubmit = async (data: CreatePiggyBankForm) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Failed to create piggy bank:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <PiggyBankIcon className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Create a New Piggy Bank
        </CardTitle>
        <p className="text-muted-foreground">
          Start saving towards your goal with a partner
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <PiggyBankIcon className="h-4 w-4" />
                    Piggy Bank Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Vacation Fund, Wedding Savings"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goal Amount (ETH)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="e.g., 1.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Partner Wallet Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goalDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Goal Deadline (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Piggy Bank"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

