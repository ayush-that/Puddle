import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: piggyBankId } = await params;

    // Get transactions for piggy bank
    const transactionHistory = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        status: transactions.status,
        transactionHash: transactions.transactionHash,
        createdAt: transactions.createdAt,
        user: {
          id: users.id,
          walletAddress: users.walletAddress,
        },
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.piggyBankId, piggyBankId))
      .orderBy(transactions.createdAt);

    return NextResponse.json({ transactions: transactionHistory });
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
