import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { users, piggyBanks, piggyBankMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: piggyBankId } = await params;
    const body = await request.json();
    const { partnerAddress } = body;

    if (!partnerAddress) {
      return NextResponse.json(
        { error: "Partner address is required" },
        { status: 400 },
      );
    }

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

    // Check member count
    const memberCount = await db
      .select()
      .from(piggyBankMembers)
      .where(eq(piggyBankMembers.piggyBankId, piggyBankId));

    if (memberCount.length >= 2) {
      return NextResponse.json(
        { error: "Piggy bank already has 2 members" },
        { status: 400 },
      );
    }

    // Get or create partner user
    const partnerResults = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, partnerAddress.toLowerCase()))
      .limit(1);

    let partner = partnerResults[0];

    if (!partner) {
      // Create placeholder user for partner
      const newPartners = await db
        .insert(users)
        .values({
          privyUserId: `pending_${partnerAddress.toLowerCase()}`,
          walletAddress: partnerAddress.toLowerCase(),
        })
        .returning();

      partner = newPartners[0];
    }

    // Add partner as member
    await db.insert(piggyBankMembers).values({
      piggyBankId: piggyBank.id,
      userId: partner.id,
      role: "partner",
    });

    // Send Push notification
    try {
      await PiggyBankNotifications.invitedToJoin(
        partnerAddress,
        authUser.walletAddress,
        piggyBank.name,
        piggyBank.id,
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to invite partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
