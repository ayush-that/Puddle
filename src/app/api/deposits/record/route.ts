import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { users, piggyBanks, transactions, piggyBankMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractAddress, amount, transactionHash } = body;

    // Validate input
    if (!contractAddress || !amount || !transactionHash) {
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

    // Get piggy bank by contract address
    const piggyBankResults = await db
      .select()
      .from(piggyBanks)
      .where(eq(piggyBanks.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!piggyBankResults.length) {
      return NextResponse.json(
        { error: "Piggy bank not found" },
        { status: 404 },
      );
    }

    const piggyBank = piggyBankResults[0];

    // Create transaction record
    const newTransactions = await db
      .insert(transactions)
      .values({
        piggyBankId: piggyBank.id,
        userId: user.id,
        amount,
        type: "deposit",
        status: "completed",
        transactionHash,
      })
      .returning();

    const transaction = newTransactions[0];

    // Update piggy bank current amount
    const newAmount = (
      parseFloat(piggyBank.currentAmount) + parseFloat(amount)
    ).toString();

    await db
      .update(piggyBanks)
      .set({ currentAmount: newAmount })
      .where(eq(piggyBanks.id, piggyBank.id));

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

    // Notifications removed - Push Protocol integration disabled
    console.log("Deposit recorded successfully:", {
      amount,
      piggyBankName: piggyBank.name,
      newTotal: newAmount,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Failed to record deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
