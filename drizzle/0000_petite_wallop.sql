CREATE TYPE "public"."member_role" AS ENUM('creator', 'partner');--> statement-breakpoint
CREATE TYPE "public"."piggy_bank_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal');--> statement-breakpoint
CREATE TABLE "piggy_bank_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piggy_bank_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'partner' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piggy_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"goal_amount" numeric(18, 8) NOT NULL,
	"current_amount" numeric(18, 8) DEFAULT '0' NOT NULL,
	"contract_address" text NOT NULL,
	"status" "piggy_bank_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"goal_deadline" timestamp,
	CONSTRAINT "piggy_banks_contract_address_unique" UNIQUE("contract_address")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piggy_bank_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"transaction_hash" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_user_id" text NOT NULL,
	"wallet_address" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_user_id_unique" UNIQUE("privy_user_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piggy_bank_id" uuid NOT NULL,
	"withdrawal_amount" numeric(18, 8) NOT NULL,
	"initiator_id" uuid NOT NULL,
	"approver_id" uuid,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"executed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "piggy_bank_members" ADD CONSTRAINT "piggy_bank_members_piggy_bank_id_piggy_banks_id_fk" FOREIGN KEY ("piggy_bank_id") REFERENCES "public"."piggy_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piggy_bank_members" ADD CONSTRAINT "piggy_bank_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_piggy_bank_id_piggy_banks_id_fk" FOREIGN KEY ("piggy_bank_id") REFERENCES "public"."piggy_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_piggy_bank_id_piggy_banks_id_fk" FOREIGN KEY ("piggy_bank_id") REFERENCES "public"."piggy_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "piggy_bank_id_idx" ON "piggy_bank_members" USING btree ("piggy_bank_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "piggy_bank_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contract_address_idx" ON "piggy_banks" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX "status_idx" ON "piggy_banks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_piggy_bank_id_idx" ON "transactions" USING btree ("piggy_bank_id");--> statement-breakpoint
CREATE INDEX "transaction_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_hash_idx" ON "transactions" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "transaction_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "privy_user_id_idx" ON "users" USING btree ("privy_user_id");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "withdrawal_piggy_bank_id_idx" ON "withdrawal_approvals" USING btree ("piggy_bank_id");--> statement-breakpoint
CREATE INDEX "executed_idx" ON "withdrawal_approvals" USING btree ("executed");