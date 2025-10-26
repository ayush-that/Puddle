import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { users, piggyBanks, piggyBankMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserPiggyBanks } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/piggy-banks - Starting");
    const authUser = await getAuthUser(request);
    console.log("Auth user for piggy banks:", authUser);

    if (!authUser) {
      console.log("No auth user found for piggy banks");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    console.log("Looking for user with privyUserId:", authUser.privyUserId);
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, authUser.privyUserId))
      .limit(1);

    console.log("Found users:", existingUsers);

    if (!existingUsers.length) {
      console.log("User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = existingUsers[0];

    // Get user's piggy banks
    const userPiggyBanks = await getUserPiggyBanks(user.id);

    return NextResponse.json({ piggyBanks: userPiggyBanks });
  } catch (error) {
    console.error("Failed to get piggy banks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, goalAmount, goalDeadline, contractAddress } = body;

    // Validate input
    if (!name || !goalAmount || !contractAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user from database
    console.log("Looking for user with privyUserId:", authUser.privyUserId);
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, authUser.privyUserId))
      .limit(1);

    console.log("Found users:", existingUsers);

    if (!existingUsers.length) {
      console.log("User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = existingUsers[0];

    // Create piggy bank
    const newPiggyBanks = await db
      .insert(piggyBanks)
      .values({
        name,
        goalAmount,
        currentAmount: "0",
        status: "active",
        goalDeadline: goalDeadline ? new Date(goalDeadline) : null,
        contractAddress: contractAddress.toLowerCase(),
      })
      .returning();

    const piggyBank = newPiggyBanks[0];

    // Add creator as first member
    await db.insert(piggyBankMembers).values({
      piggyBankId: piggyBank.id,
      userId: user.id,
      role: "creator",
    });

    return NextResponse.json({ piggyBank }, { status: 201 });
  } catch (error) {
    console.error("Failed to create piggy bank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
