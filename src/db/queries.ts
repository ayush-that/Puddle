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

export const addMemberToPiggyBankUpsert = async (data: NewPiggyBankMember) => {
  const [member] = await db
    .insert(piggyBankMembers)
    .values(data)
    .onConflictDoUpdate({
      target: [piggyBankMembers.piggyBankId, piggyBankMembers.userId],
      set: {
        role: data.role,
        joinedAt: new Date(),
      },
    })
    .returning();
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
