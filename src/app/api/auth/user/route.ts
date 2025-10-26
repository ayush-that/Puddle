import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/auth/user - Starting");
    const authUser = await getAuthUser(request);
    console.log("Auth user:", authUser);

    if (!authUser) {
      console.log("No auth user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, authUser.privyUserId))
      .limit(1);

    let user = existingUsers[0];

    // Create user if doesn't exist
    if (!user) {
      const newUsers = await db
        .insert(users)
        .values({
          privyUserId: authUser.privyUserId,
          walletAddress: authUser.walletAddress.toLowerCase(),
          email: authUser.email,
        })
        .returning();

      user = newUsers[0];
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to get/create user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
