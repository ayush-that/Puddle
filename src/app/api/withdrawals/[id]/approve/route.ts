import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { users, piggyBanks, withdrawalApprovals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: withdrawalId } = await params;

    // Get user from database
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, authUser.privyUserId))
      .limit(1);

    if (!existingUsers.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = existingUsers[0];

    // Get withdrawal request
    const withdrawalResults = await db
      .select()
      .from(withdrawalApprovals)
      .where(eq(withdrawalApprovals.id, withdrawalId))
      .limit(1);

    if (!withdrawalResults.length) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 },
      );
    }

    const withdrawal = withdrawalResults[0];

    // Check if initiator already approved (auto-approved on request)
    const initiatorApproved = true; // Initiator auto-approves on request

    // Update withdrawal approval and mark as executed since both partners approved
    const updatedWithdrawals = await db
      .update(withdrawalApprovals)
      .set({
        approved: true,
        approverId: user.id,
        approvedAt: new Date(),
        executed: true, // Smart contract auto-executes on second approval
      })
      .where(eq(withdrawalApprovals.id, withdrawalId))
      .returning();

    const updatedWithdrawal = updatedWithdrawals[0];

    // Update piggy bank current amount (reduce by withdrawal amount)
    if (updatedWithdrawal) {
      const piggyBankResults = await db
        .select()
        .from(piggyBanks)
        .where(eq(piggyBanks.id, withdrawal.piggyBankId))
        .limit(1);

      if (piggyBankResults.length) {
        const piggyBank = piggyBankResults[0];
        const newAmount = (
          parseFloat(piggyBank.currentAmount) -
          parseFloat(withdrawal.withdrawalAmount)
        ).toString();

        await db
          .update(piggyBanks)
          .set({ currentAmount: newAmount })
          .where(eq(piggyBanks.id, withdrawal.piggyBankId));
      }
    }

    // Get piggy bank and initiator for notification
    const piggyBankResults = await db
      .select()
      .from(piggyBanks)
      .where(eq(piggyBanks.id, withdrawal.piggyBankId))
      .limit(1);

    const initiatorResults = await db
      .select()
      .from(users)
      .where(eq(users.id, withdrawal.initiatorId))
      .limit(1);

    if (piggyBankResults.length && initiatorResults.length) {
      const piggyBank = piggyBankResults[0];
      const initiator = initiatorResults[0];

      // Notifications removed - Push Protocol integration disabled
      console.log("Withdrawal approved successfully:", {
        amount: withdrawal.withdrawalAmount,
        piggyBankName: piggyBank.name,
        initiator: initiator.walletAddress,
      });
    }

    return NextResponse.json({ withdrawal: updatedWithdrawal });
  } catch (error) {
    console.error("Failed to approve withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
