import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { transactions, users, piggyBanks, piggyBankMembers } from "@/db/schema";
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

    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Validate and set pagination parameters with safe defaults
    let limit = 50; // Default limit
    let offset = 0; // Default offset

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // Cap at 100 for safety
      }
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
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

    // Verify user has access to this piggy bank
    const userMembership = await db
      .select()
      .from(piggyBankMembers)
      .where(
        and(
          eq(piggyBankMembers.piggyBankId, piggyBankId),
          eq(piggyBankMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (!userMembership.length) {
      return NextResponse.json(
        {
          error:
            "Access denied. You don't have permission to view this piggy bank's transactions.",
        },
        { status: 403 },
      );
    }

    // Get transactions for piggy bank with pagination
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
      .orderBy(transactions.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: transactions.id })
      .from(transactions)
      .where(eq(transactions.piggyBankId, piggyBankId));

    const totalCount = totalCountResult.length;

    return NextResponse.json({
      transactions: transactionHistory,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
