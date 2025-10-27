import {
  pgTable,
  index,
  unique,
  uuid,
  text,
  numeric,
  timestamp,
  uniqueIndex,
  foreignKey,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["creator", "partner"]);
export const piggyBankStatus = pgEnum("piggy_bank_status", [
  "active",
  "completed",
  "cancelled",
]);
export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
]);
export const transactionType = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
]);

export const piggyBanks = pgTable(
  "piggy_banks",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    goalAmount: numeric("goal_amount", { precision: 18, scale: 8 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 18, scale: 8 })
      .default("0")
      .notNull(),
    contractAddress: text("contract_address").notNull(),
    status: piggyBankStatus().default("active").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    goalDeadline: timestamp("goal_deadline", { mode: "string" }),
  },
  (table) => [
    index("contract_address_idx").using(
      "btree",
      table.contractAddress.asc().nullsLast().op("text_ops"),
    ),
    index("status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    unique("piggy_banks_contract_address_unique").on(table.contractAddress),
  ],
);

export const piggyBankMembers = pgTable(
  "piggy_bank_members",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    piggyBankId: uuid("piggy_bank_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRole().default("partner").notNull(),
    joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("piggy_bank_id_idx").using(
      "btree",
      table.piggyBankId.asc().nullsLast().op("uuid_ops"),
    ),
    uniqueIndex("piggy_bank_member_unique").using(
      "btree",
      table.piggyBankId.asc().nullsLast().op("uuid_ops"),
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.piggyBankId],
      foreignColumns: [piggyBanks.id],
      name: "piggy_bank_members_piggy_bank_id_piggy_banks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "piggy_bank_members_user_id_users_id_fk",
    }).onDelete("cascade"),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    privyUserId: text("privy_user_id").notNull(),
    walletAddress: text("wallet_address"),
    email: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("privy_user_id_idx").using(
      "btree",
      table.privyUserId.asc().nullsLast().op("text_ops"),
    ),
    index("wallet_address_idx").using(
      "btree",
      table.walletAddress.asc().nullsLast().op("text_ops"),
    ),
    unique("users_privy_user_id_unique").on(table.privyUserId),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    piggyBankId: uuid("piggy_bank_id").notNull(),
    userId: uuid("user_id").notNull(),
    amount: numeric({ precision: 18, scale: 8 }).notNull(),
    transactionHash: text("transaction_hash").notNull(),
    type: transactionType().notNull(),
    status: transactionStatus().default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transaction_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("transaction_hash_idx").using(
      "btree",
      table.transactionHash.asc().nullsLast().op("text_ops"),
    ),
    index("transaction_piggy_bank_id_idx").using(
      "btree",
      table.piggyBankId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.piggyBankId],
      foreignColumns: [piggyBanks.id],
      name: "transactions_piggy_bank_id_piggy_banks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "transactions_user_id_users_id_fk",
    }).onDelete("cascade"),
    unique("transactions_transaction_hash_unique").on(table.transactionHash),
  ],
);

export const withdrawalApprovals = pgTable(
  "withdrawal_approvals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    piggyBankId: uuid("piggy_bank_id").notNull(),
    withdrawalAmount: numeric("withdrawal_amount", {
      precision: 18,
      scale: 8,
    }).notNull(),
    initiatorId: uuid("initiator_id").notNull(),
    approverId: uuid("approver_id"),
    approved: boolean().default(false).notNull(),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    executed: boolean().default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("executed_idx").using(
      "btree",
      table.executed.asc().nullsLast().op("bool_ops"),
    ),
    index("withdrawal_piggy_bank_id_idx").using(
      "btree",
      table.piggyBankId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.piggyBankId],
      foreignColumns: [piggyBanks.id],
      name: "withdrawal_approvals_piggy_bank_id_piggy_banks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.initiatorId],
      foreignColumns: [users.id],
      name: "withdrawal_approvals_initiator_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.approverId],
      foreignColumns: [users.id],
      name: "withdrawal_approvals_approver_id_users_id_fk",
    }),
  ],
);
