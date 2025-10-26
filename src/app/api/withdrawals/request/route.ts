import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  piggyBanks,
  withdrawalApprovals,
  piggyBankMembers,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { piggyBankId, amount } = body;

    // Validate input
    if (!piggyBankId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

    // Create withdrawal request
    const newWithdrawals = await db
      .insert(withdrawalApprovals)
      .values({
        piggyBankId: piggyBank.id,
        initiatorId: user.id,
        withdrawalAmount: amount,
        approved: false,
        executed: false,
      })
      .returning();

    const withdrawal = newWithdrawals[0];

    // Get partner to send notification
    const members = await db
      .select({
        user: {
          walletAddress: users.walletAddress,
        },
      })
      .from(piggyBankMembers)
      .innerJoin(users, eq(piggyBankMembers.userId, users.id))
      .where(eq(piggyBankMembers.piggyBankId, piggyBank.id));

    const partner = members.find(
      (m) => m.user.walletAddress !== user.walletAddress,
    );

    // Send notification to partner for approval
    if (partner && partner.user.walletAddress && user.walletAddress) {
      try {
        await PiggyBankNotifications.withdrawalRequested(
          partner.user.walletAddress,
          user.walletAddress,
          amount,
          piggyBank.name,
          piggyBank.id,
        );
      } catch (error) {
        console.error("Failed to send withdrawal request notification:", error);
      }
    }

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    console.error("Failed to request withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
