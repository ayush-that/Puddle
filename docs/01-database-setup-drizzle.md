# Stage 1: Database Setup with PostgreSQL & Drizzle ORM

## Overview

This guide covers setting up PostgreSQL database with Drizzle ORM for the Onchain Piggy Bank platform. We'll define schemas for users, piggy banks, members, transactions, and withdrawal approvals.

## Prerequisites

- PostgreSQL installed locally or access to a cloud PostgreSQL instance (Vercel Postgres, Railway, Supabase)
- pnpm package manager
- Node.js 18+

## Step 1: Install Dependencies

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg pg
```

## Step 2: Database Configuration

### Create Database Connection File

Create `src/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client);
```

## Step 3: Define Database Schema

Create `src/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const piggyBankStatusEnum = pgEnum("piggy_bank_status", [
  "active",
  "completed",
  "cancelled",
]);
export const memberRoleEnum = pgEnum("member_role", ["creator", "partner"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
]);

// Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    privyUserId: text("privy_user_id").unique().notNull(),
    walletAddress: text("wallet_address"),
    email: text("email"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    privyUserIdIdx: index("privy_user_id_idx").on(table.privyUserId),
    walletAddressIdx: index("wallet_address_idx").on(table.walletAddress),
  }),
);

// PiggyBanks Table
export const piggyBanks = pgTable(
  "piggy_banks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    goalAmount: numeric("goal_amount", { precision: 18, scale: 8 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 18, scale: 8 })
      .default("0")
      .notNull(),
    contractAddress: text("contract_address").unique().notNull(),
    status: piggyBankStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    goalDeadline: timestamp("goal_deadline"),
  },
  (table) => ({
    contractAddressIdx: index("contract_address_idx").on(table.contractAddress),
    statusIdx: index("status_idx").on(table.status),
  }),
);

// PiggyBankMembers Table
export const piggyBankMembers = pgTable(
  "piggy_bank_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    piggyBankId: uuid("piggy_bank_id")
      .references(() => piggyBanks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: memberRoleEnum("role").default("partner").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    piggyBankIdIdx: index("piggy_bank_id_idx").on(table.piggyBankId),
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

// Transactions Table
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    piggyBankId: uuid("piggy_bank_id")
      .references(() => piggyBanks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
    transactionHash: text("transaction_hash").unique().notNull(),
    type: transactionTypeEnum("type").notNull(),
    status: transactionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    piggyBankIdIdx: index("transaction_piggy_bank_id_idx").on(
      table.piggyBankId,
    ),
    userIdIdx: index("transaction_user_id_idx").on(table.userId),
    transactionHashIdx: index("transaction_hash_idx").on(table.transactionHash),
    createdAtIdx: index("transaction_created_at_idx").on(table.createdAt),
  }),
);

// WithdrawalApprovals Table
export const withdrawalApprovals = pgTable(
  "withdrawal_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    piggyBankId: uuid("piggy_bank_id")
      .references(() => piggyBanks.id, { onDelete: "cascade" })
      .notNull(),
    withdrawalAmount: numeric("withdrawal_amount", {
      precision: 18,
      scale: 8,
    }).notNull(),
    initiatorId: uuid("initiator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    approverId: uuid("approver_id").references(() => users.id),
    approved: boolean("approved").default(false).notNull(),
    approvedAt: timestamp("approved_at"),
    executed: boolean("executed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    piggyBankIdIdx: index("withdrawal_piggy_bank_id_idx").on(table.piggyBankId),
    executedIdx: index("executed_idx").on(table.executed),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  piggyBankMemberships: many(piggyBankMembers),
  transactions: many(transactions),
  initiatedWithdrawals: many(withdrawalApprovals, {
    relationName: "initiator",
  }),
  approvedWithdrawals: many(withdrawalApprovals, { relationName: "approver" }),
}));

export const piggyBanksRelations = relations(piggyBanks, ({ many }) => ({
  members: many(piggyBankMembers),
  transactions: many(transactions),
  withdrawalApprovals: many(withdrawalApprovals),
}));

export const piggyBankMembersRelations = relations(
  piggyBankMembers,
  ({ one }) => ({
    piggyBank: one(piggyBanks, {
      fields: [piggyBankMembers.piggyBankId],
      references: [piggyBanks.id],
    }),
    user: one(users, {
      fields: [piggyBankMembers.userId],
      references: [users.id],
    }),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  piggyBank: one(piggyBanks, {
    fields: [transactions.piggyBankId],
    references: [piggyBanks.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const withdrawalApprovalsRelations = relations(
  withdrawalApprovals,
  ({ one }) => ({
    piggyBank: one(piggyBanks, {
      fields: [withdrawalApprovals.piggyBankId],
      references: [piggyBanks.id],
    }),
    initiator: one(users, {
      fields: [withdrawalApprovals.initiatorId],
      references: [users.id],
      relationName: "initiator",
    }),
    approver: one(users, {
      fields: [withdrawalApprovals.approverId],
      references: [users.id],
      relationName: "approver",
    }),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PiggyBank = typeof piggyBanks.$inferSelect;
export type NewPiggyBank = typeof piggyBanks.$inferInsert;
export type PiggyBankMember = typeof piggyBankMembers.$inferSelect;
export type NewPiggyBankMember = typeof piggyBankMembers.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type WithdrawalApproval = typeof withdrawalApprovals.$inferSelect;
export type NewWithdrawalApproval = typeof withdrawalApprovals.$inferInsert;
```

## Step 4: Configure Drizzle Kit

Create `drizzle.config.ts` in the project root:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## Step 5: Create Environment Variables

Update `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/piggybank_db"
```

For local development with PostgreSQL:

```bash
# On macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb piggybank_db

# Update DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/piggybank_db"
```

## Step 6: Generate and Run Migrations

```bash
# Generate migration files
pnpm drizzle-kit generate

# Push changes to database
pnpm drizzle-kit push

# Or migrate
pnpm drizzle-kit migrate
```

## Step 7: Create Database Query Utilities

Create `src/db/queries.ts`:

```typescript
import { eq, and, desc } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  piggyBanks,
  piggyBankMembers,
  transactions,
  withdrawalApprovals,
  type NewUser,
  type NewPiggyBank,
  type NewPiggyBankMember,
  type NewTransaction,
  type NewWithdrawalApproval,
} from "./schema";

// User Queries
export const createUser = async (data: NewUser) => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

export const getUserByPrivyId = async (privyUserId: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.privyUserId, privyUserId));
  return user;
};

export const getUserByWalletAddress = async (walletAddress: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress));
  return user;
};

// PiggyBank Queries
export const createPiggyBank = async (data: NewPiggyBank) => {
  const [piggyBank] = await db.insert(piggyBanks).values(data).returning();
  return piggyBank;
};

export const getPiggyBankById = async (id: string) => {
  const [piggyBank] = await db
    .select()
    .from(piggyBanks)
    .where(eq(piggyBanks.id, id));
  return piggyBank;
};

export const getPiggyBankByContractAddress = async (
  contractAddress: string,
) => {
  const [piggyBank] = await db
    .select()
    .from(piggyBanks)
    .where(eq(piggyBanks.contractAddress, contractAddress));
  return piggyBank;
};

export const getUserPiggyBanks = async (userId: string) => {
  return db
    .select({
      piggyBank: piggyBanks,
      membership: piggyBankMembers,
    })
    .from(piggyBankMembers)
    .where(eq(piggyBankMembers.userId, userId))
    .innerJoin(piggyBanks, eq(piggyBankMembers.piggyBankId, piggyBanks.id));
};

// PiggyBank Member Queries
export const addMemberToPiggyBank = async (data: NewPiggyBankMember) => {
  const [member] = await db.insert(piggyBankMembers).values(data).returning();
  return member;
};

export const getPiggyBankMembers = async (piggyBankId: string) => {
  return db
    .select({
      member: piggyBankMembers,
      user: users,
    })
    .from(piggyBankMembers)
    .where(eq(piggyBankMembers.piggyBankId, piggyBankId))
    .innerJoin(users, eq(piggyBankMembers.userId, users.id));
};

// Transaction Queries
export const createTransaction = async (data: NewTransaction) => {
  const [transaction] = await db.insert(transactions).values(data).returning();
  return transaction;
};

export const getPiggyBankTransactions = async (piggyBankId: string) => {
  return db
    .select({
      transaction: transactions,
      user: users,
    })
    .from(transactions)
    .where(eq(transactions.piggyBankId, piggyBankId))
    .innerJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt));
};

export const updateTransactionStatus = async (
  transactionHash: string,
  status: "pending" | "completed" | "failed",
) => {
  const [transaction] = await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.transactionHash, transactionHash))
    .returning();
  return transaction;
};

// Withdrawal Approval Queries
export const createWithdrawalRequest = async (data: NewWithdrawalApproval) => {
  const [withdrawal] = await db
    .insert(withdrawalApprovals)
    .values(data)
    .returning();
  return withdrawal;
};

export const getPendingWithdrawals = async (piggyBankId: string) => {
  return db
    .select()
    .from(withdrawalApprovals)
    .where(
      and(
        eq(withdrawalApprovals.piggyBankId, piggyBankId),
        eq(withdrawalApprovals.executed, false),
      ),
    );
};

export const approveWithdrawal = async (id: string, approverId: string) => {
  const [withdrawal] = await db
    .update(withdrawalApprovals)
    .set({
      approved: true,
      approverId,
      approvedAt: new Date(),
    })
    .where(eq(withdrawalApprovals.id, id))
    .returning();
  return withdrawal;
};

export const markWithdrawalExecuted = async (id: string) => {
  const [withdrawal] = await db
    .update(withdrawalApprovals)
    .set({ executed: true })
    .where(eq(withdrawalApprovals.id, id))
    .returning();
  return withdrawal;
};
```

## Step 8: Add Scripts to package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Step 9: Test Database Connection

Create `src/db/test.ts`:

```typescript
import { db } from "./index";
import { createUser, getUserByPrivyId } from "./queries";

async function testDatabase() {
  try {
    console.log("Testing database connection...");

    // Create a test user
    const user = await createUser({
      privyUserId: "test-privy-id",
      walletAddress: "0x1234567890abcdef",
      email: "test@example.com",
    });

    console.log("Created user:", user);

    // Fetch the user
    const fetchedUser = await getUserByPrivyId("test-privy-id");
    console.log("Fetched user:", fetchedUser);

    console.log("Database test successful!");
  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDatabase();
```

Run: `tsx src/db/test.ts`

## Production Setup Options

### Option 1: Vercel Postgres

```bash
# Install Vercel CLI
pnpm add -g vercel

# Create Postgres database
vercel postgres create

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local
```

### Option 2: Railway

1. Go to railway.app
2. Create new project → PostgreSQL
3. Copy `DATABASE_URL` from connection string
4. Add to `.env.local`

### Option 3: Supabase

1. Create project at supabase.com
2. Get connection string from Settings → Database
3. Use "Connection Pooling" URL for serverless
4. Add to `.env.local`

## Next Steps

- ✅ Database schema defined
- ✅ Drizzle ORM configured
- ✅ Migrations created
- ⏭️ Next: Smart Contract Development (Stage 2)
