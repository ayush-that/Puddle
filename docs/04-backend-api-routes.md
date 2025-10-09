# Stage 4: Backend API Routes (Next.js App Router)

## Overview

This guide covers creating Next.js API routes for piggy bank management, deposits, withdrawals, and integrating with Privy authentication, smart contracts, and database.

## Architecture

```
src/app/api/
├── auth/
│   └── user/route.ts          # Get or create user
├── piggy-banks/
│   ├── route.ts                # GET all, POST create
│   ├── [id]/
│   │   ├── route.ts            # GET details
│   │   ├── invite/route.ts     # POST invite partner
│   │   ├── join/route.ts       # POST accept invitation
│   │   └── transactions/route.ts # GET transaction history
├── deposits/
│   └── record/route.ts         # POST record deposit
├── withdrawals/
│   ├── request/route.ts        # POST request withdrawal
│   └── [id]/
│       └── approve/route.ts    # POST approve withdrawal
└── notifications/
    └── subscribe/route.ts      # POST subscribe to Push
```

## Step 1: Create Authentication Utilities

Create `src/lib/auth.ts`:

```typescript
import { headers } from "next/headers";
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

    return {
      privyUserId: payload.sub,
      walletAddress: payload.wallet_address,
      email: payload.email,
    };
  } catch (error) {
    console.error("Failed to parse auth token:", error);
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
      walletAddress: data.user.wallet?.address,
      email: data.user.email?.address,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
```

## Step 2: Create User Management Route

Create `src/app/api/auth/user/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createUser, getUserByPrivyId } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user
    let user = await getUserByPrivyId(authUser.privyUserId);

    if (!user) {
      user = await createUser({
        privyUserId: authUser.privyUserId,
        walletAddress: authUser.walletAddress,
        email: authUser.email,
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Step 3: Create Piggy Bank Routes

Create `src/app/api/piggy-banks/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createPiggyBank,
  getUserPiggyBanks,
  getUserByPrivyId,
  addMemberToPiggyBank,
} from "@/db/queries";
import { PiggyBankNotifications } from "@/services/notifications";

// GET all piggy banks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByPrivyId(authUser.privyUserId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const piggyBanks = await getUserPiggyBanks(user.id);

    return NextResponse.json({ piggyBanks });
  } catch (error) {
    console.error("Get piggy banks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST create new piggy bank
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

    const user = await getUserByPrivyId(authUser.privyUserId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create piggy bank
    const piggyBank = await createPiggyBank({
      name,
      goalAmount: goalAmount.toString(),
      currentAmount: "0",
      contractAddress,
      status: "active",
      goalDeadline: goalDeadline ? new Date(goalDeadline) : null,
    });

    // Add creator as first member
    await addMemberToPiggyBank({
      piggyBankId: piggyBank.id,
      userId: user.id,
      role: "creator",
    });

    return NextResponse.json({ piggyBank }, { status: 201 });
  } catch (error) {
    console.error("Create piggy bank error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

Create `src/app/api/piggy-banks/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPiggyBankById, getPiggyBankMembers } from "@/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const piggyBank = await getPiggyBankById(params.id);

    if (!piggyBank) {
      return NextResponse.json(
        { error: "Piggy bank not found" },
        { status: 404 },
      );
    }

    // Get members
    const members = await getPiggyBankMembers(piggyBank.id);

    return NextResponse.json({
      piggyBank,
      members,
    });
  } catch (error) {
    console.error("Get piggy bank error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Step 4: Create Invitation Routes

Create `src/app/api/piggy-banks/[id]/invite/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getPiggyBankById,
  getUserByWalletAddress,
  addMemberToPiggyBank,
  getPiggyBankMembers,
} from "@/db/queries";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { partnerWalletAddress } = body;

    if (!partnerWalletAddress) {
      return NextResponse.json(
        { error: "Partner wallet address required" },
        { status: 400 },
      );
    }

    const piggyBank = await getPiggyBankById(params.id);

    if (!piggyBank) {
      return NextResponse.json(
        { error: "Piggy bank not found" },
        { status: 404 },
      );
    }

    // Check if already has 2 members
    const currentMembers = await getPiggyBankMembers(piggyBank.id);

    if (currentMembers.length >= 2) {
      return NextResponse.json(
        { error: "Piggy bank already has 2 members" },
        { status: 400 },
      );
    }

    // Get or create partner user
    let partner = await getUserByWalletAddress(partnerWalletAddress);

    // Add partner as member
    if (partner) {
      await addMemberToPiggyBank({
        piggyBankId: piggyBank.id,
        userId: partner.id,
        role: "partner",
      });

      // Send notification
      await PiggyBankNotifications.invitedToJoin(
        partnerWalletAddress,
        authUser.walletAddress,
        piggyBank.name,
        piggyBank.id,
      );
    }

    return NextResponse.json({
      success: true,
      message: partner
        ? "Partner invited successfully"
        : "Invitation pending - partner needs to sign up",
    });
  } catch (error) {
    console.error("Invite partner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Step 5: Create Transaction Recording Route

Create `src/app/api/deposits/record/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createTransaction,
  getUserByPrivyId,
  getPiggyBankByContractAddress,
  getPiggyBankMembers,
} from "@/db/queries";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractAddress, amount, transactionHash } = body;

    if (!contractAddress || !amount || !transactionHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await getUserByPrivyId(authUser.privyUserId);
    const piggyBank = await getPiggyBankByContractAddress(contractAddress);

    if (!user || !piggyBank) {
      return NextResponse.json(
        { error: "User or piggy bank not found" },
        { status: 404 },
      );
    }

    // Record transaction
    const transaction = await createTransaction({
      piggyBankId: piggyBank.id,
      userId: user.id,
      amount: amount.toString(),
      transactionHash,
      type: "deposit",
      status: "completed",
    });

    // Get members to notify partner
    const members = await getPiggyBankMembers(piggyBank.id);
    const partner = members.find((m) => m.user.id !== user.id);

    if (partner) {
      await PiggyBankNotifications.depositMade(
        partner.user.walletAddress!,
        authUser.walletAddress,
        amount,
        piggyBank.name,
        piggyBank.id,
      );
    }

    // Check for goal milestones (25%, 50%, 75%, 100%)
    const currentAmount = parseFloat(transaction.amount);
    const goalAmount = parseFloat(piggyBank.goalAmount);
    const progress = (currentAmount / goalAmount) * 100;

    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      if (progress >= milestone && progress < milestone + 10) {
        const memberAddresses = members.map((m) => m.user.walletAddress!);
        await PiggyBankNotifications.goalMilestone(
          memberAddresses,
          milestone,
          piggyBank.name,
          piggyBank.id,
        );
      }
    }

    if (progress >= 100) {
      const memberAddresses = members.map((m) => m.user.walletAddress!);
      await PiggyBankNotifications.goalReached(
        memberAddresses,
        piggyBank.name,
        piggyBank.goalAmount,
        piggyBank.id,
      );
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Record deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Step 6: Create Withdrawal Routes

Create `src/app/api/withdrawals/request/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createWithdrawalRequest,
  getUserByPrivyId,
  getPiggyBankById,
  getPiggyBankMembers,
} from "@/db/queries";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { piggyBankId, amount } = body;

    if (!piggyBankId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await getUserByPrivyId(authUser.privyUserId);
    const piggyBank = await getPiggyBankById(piggyBankId);

    if (!user || !piggyBank) {
      return NextResponse.json(
        { error: "User or piggy bank not found" },
        { status: 404 },
      );
    }

    // Create withdrawal request
    const withdrawal = await createWithdrawalRequest({
      piggyBankId: piggyBank.id,
      withdrawalAmount: amount.toString(),
      initiatorId: user.id,
      approved: false,
      executed: false,
    });

    // Notify partner
    const members = await getPiggyBankMembers(piggyBank.id);
    const partner = members.find((m) => m.user.id !== user.id);

    if (partner) {
      await PiggyBankNotifications.withdrawalRequested(
        partner.user.walletAddress!,
        authUser.walletAddress,
        amount,
        piggyBank.name,
        piggyBank.id,
      );
    }

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

Create `src/app/api/withdrawals/[id]/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  approveWithdrawal,
  getUserByPrivyId,
  getPiggyBankMembers,
} from "@/db/queries";
import { PiggyBankNotifications } from "@/services/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByPrivyId(authUser.privyUserId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Approve withdrawal
    const withdrawal = await approveWithdrawal(params.id, user.id);

    // Note: Actual execution happens on-chain via smart contract
    // This just records the approval in the database

    return NextResponse.json({ withdrawal });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Step 7: Create Middleware for Auth

Create `src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if API route requires authentication
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Allow auth routes without token
    if (request.nextUrl.pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
```

## Step 8: Create API Client for Frontend

Create `src/lib/api-client.ts`:

```typescript
import { usePrivy } from "@privy-io/react-auth";

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    // This will be called from React components with access to usePrivy
    // You'll need to pass the token when creating requests
    return null;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authToken?: string,
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    return response.json();
  }

  // Piggy Bank endpoints
  async getPiggyBanks(authToken: string) {
    return this.request("/piggy-banks", {}, authToken);
  }

  async createPiggyBank(data: any, authToken: string) {
    return this.request(
      "/piggy-banks",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      authToken,
    );
  }

  async getPiggyBank(id: string, authToken: string) {
    return this.request(`/piggy-banks/${id}`, {}, authToken);
  }

  async recordDeposit(data: any, authToken: string) {
    return this.request(
      "/deposits/record",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      authToken,
    );
  }

  async requestWithdrawal(data: any, authToken: string) {
    return this.request(
      "/withdrawals/request",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      authToken,
    );
  }

  async approveWithdrawal(id: string, authToken: string) {
    return this.request(
      `/withdrawals/${id}/approve`,
      {
        method: "POST",
      },
      authToken,
    );
  }
}

export const apiClient = new APIClient();
```

## Testing API Routes

Create test file `tests/api.test.ts` (using your preferred testing framework):

```typescript
describe("API Routes", () => {
  it("should create piggy bank", async () => {
    // Test implementation
  });

  it("should record deposit", async () => {
    // Test implementation
  });

  it("should request withdrawal", async () => {
    // Test implementation
  });
});
```

## Next Steps

- ✅ API routes created
- ✅ Authentication integrated
- ✅ Database queries connected
- ✅ Push notifications triggered
- ⏭️ Next: Frontend Components (Stage 5)
