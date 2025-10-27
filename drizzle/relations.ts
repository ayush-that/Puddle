import { relations } from "drizzle-orm/relations";
import {
  piggyBanks,
  piggyBankMembers,
  users,
  transactions,
  withdrawalApprovals,
} from "./schema";

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

export const piggyBanksRelations = relations(piggyBanks, ({ many }) => ({
  piggyBankMembers: many(piggyBankMembers),
  transactions: many(transactions),
  withdrawalApprovals: many(withdrawalApprovals),
}));

export const usersRelations = relations(users, ({ many }) => ({
  piggyBankMembers: many(piggyBankMembers),
  transactions: many(transactions),
  withdrawalApprovals_initiatorId: many(withdrawalApprovals, {
    relationName: "withdrawalApprovals_initiatorId_users_id",
  }),
  withdrawalApprovals_approverId: many(withdrawalApprovals, {
    relationName: "withdrawalApprovals_approverId_users_id",
  }),
}));

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
    user_initiatorId: one(users, {
      fields: [withdrawalApprovals.initiatorId],
      references: [users.id],
      relationName: "withdrawalApprovals_initiatorId_users_id",
    }),
    user_approverId: one(users, {
      fields: [withdrawalApprovals.approverId],
      references: [users.id],
      relationName: "withdrawalApprovals_approverId_users_id",
    }),
  }),
);
