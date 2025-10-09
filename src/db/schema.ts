import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
  boolean,
  index,
  uniqueIndex,
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
    piggyBankMemberUnique: uniqueIndex("piggy_bank_member_unique").on(
      table.piggyBankId,
      table.userId,
    ),
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
