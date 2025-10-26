"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUp, AlertTriangle, Users } from "lucide-react";

const withdrawalSchema = z.object({
  amount: z.string().min(0.0001, "Amount must be greater than 0"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

interface WithdrawalRequestProps {
  contractAddress: `0x${string}`;
  piggyBankId: string;
  currentBalance: string;
  onRequestWithdrawal: (amount: string, piggyBankId: string) => Promise<void>;
  isRequesting?: boolean;
}

export function WithdrawalRequest({
  contractAddress,
  piggyBankId,
  currentBalance,
  onRequestWithdrawal,
  isRequesting = false,
}: WithdrawalRequestProps) {
  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleSubmit = async (data: WithdrawalForm) => {
    try {
      await onRequestWithdrawal(data.amount, piggyBankId);
      form.reset();
    } catch (error) {
      console.error("Withdrawal request failed:", error);
    }
  };

  const maxAmount = parseFloat(currentBalance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="h-5 w-5" />
          Request Withdrawal
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Withdrawals require approval from both partners. Your partner will
            be notified when you request a withdrawal.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            Available balance:{" "}
            <span className="font-semibold">{maxAmount.toFixed(4)} ETH</span>
          </span>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      max={maxAmount}
                      placeholder="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isRequesting}>
              {isRequesting ? "Requesting..." : "Request Withdrawal"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
