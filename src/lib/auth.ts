import { NextRequest } from "next/server";

export interface AuthUser {
  privyUserId: string;
  walletAddress: string;
  email?: string;
}

/**
 * Get authenticated user from Privy JWT
 * In production, verify the JWT signature
 */
export async function getAuthUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // In production, verify JWT with Privy's public key
    // For now, we'll decode the payload (DO NOT USE IN PRODUCTION WITHOUT VERIFICATION)
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    console.log("JWT Payload:", payload);

    return {
      privyUserId: payload.sub,
      walletAddress: payload.wallet_address || payload.address,
      email: payload.email,
    };
  } catch (error) {
    console.error("Failed to parse auth token:", error);
    console.error("Token:", token);
    return null;
  }
}

/**
 * Verify Privy JWT (production-ready)
 */
export async function verifyPrivyToken(
  token: string,
): Promise<AuthUser | null> {
  try {
    const response = await fetch("https://auth.privy.io/api/v1/verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      privyUserId: data.user.id,
      walletAddress: data.user.wallet?.address || "",
      email: data.user.email?.address,
    };
  } catch (error) {
    console.error("Failed to verify Privy token:", error);
    return null;
  }
}
