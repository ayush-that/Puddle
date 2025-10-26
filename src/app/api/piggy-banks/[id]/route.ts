import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  piggyBanks,
  piggyBankMembers,
  transactions,
  withdrawalApprovals,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Get piggy bank
    const piggyBankResults = await db
      .select()
      .from(piggyBanks)
      .where(eq(piggyBanks.id, piggyBankId))
      .limit(1);

    if (!piggyBankResults.length) {
      return NextResponse.json(
        { error: "Piggy bank not found" },
        { status: 404 },
      );
    }

    const piggyBank = piggyBankResults[0];

    // Get members with user details
    const members = await db
      .select({
        role: piggyBankMembers.role,
        joinedAt: piggyBankMembers.joinedAt,
        user: {
          id: users.id,
          walletAddress: users.walletAddress,
          email: users.email,
        },
      })
      .from(piggyBankMembers)
      .innerJoin(users, eq(piggyBankMembers.userId, users.id))
      .where(eq(piggyBankMembers.piggyBankId, piggyBankId));

    // Get transaction history
    const transactionHistory = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        status: transactions.status,
        transactionHash: transactions.transactionHash,
        createdAt: transactions.createdAt,
        user: {
          walletAddress: users.walletAddress,
        },
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.piggyBankId, piggyBankId))
      .orderBy(transactions.createdAt);

    // Get pending withdrawals
    const pendingWithdrawals = await db
      .select({
        id: withdrawalApprovals.id,
        withdrawalAmount: withdrawalApprovals.withdrawalAmount,
        approved: withdrawalApprovals.approved,
        approvedAt: withdrawalApprovals.approvedAt,
        executed: withdrawalApprovals.executed,
        initiator: {
          walletAddress: users.walletAddress,
        },
      })
      .from(withdrawalApprovals)
      .innerJoin(users, eq(withdrawalApprovals.initiatorId, users.id))
      .where(
        and(
          eq(withdrawalApprovals.piggyBankId, piggyBankId),
          eq(withdrawalApprovals.executed, false),
        ),
      );

    return NextResponse.json({
      piggyBank: {
        ...piggyBank,
        members,
        transactions: transactionHistory,
        pendingWithdrawal: pendingWithdrawals[0] || null,
      },
    });
  } catch (error) {
    console.error("Failed to get piggy bank details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
