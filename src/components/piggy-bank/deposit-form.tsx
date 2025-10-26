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
import { ArrowDown, Wallet } from "lucide-react";

const depositSchema = z.object({
  amount: z.string().min(0.0001, "Amount must be greater than 0"),
});

type DepositForm = z.infer<typeof depositSchema>;

interface DepositFormProps {
  contractAddress: `0x${string}`;
  piggyBankId: string;
  onSuccess?: () => void;
  onDeposit: (amount: string, piggyBankId: string) => Promise<void>;
  isDepositing?: boolean;
}

export function DepositForm({
  contractAddress,
  piggyBankId,
  onSuccess,
  onDeposit,
  isDepositing = false,
}: DepositFormProps) {
  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleSubmit = async (data: DepositForm) => {
    try {
      await onDeposit(data.amount, piggyBankId);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5" />
          Make a Deposit
        </CardTitle>
      </CardHeader>

      <CardContent>
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
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Amount (ETH)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isDepositing}>
              {isDepositing ? "Depositing..." : "Deposit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
