<!-- b44fb2ec-cb56-4f6a-88d6-bc2b909cfd3b 47dd1dc5-0dd6-40b2-bd62-56f273d57c63 -->

# Onchain Piggy Bank Platform - Hackathon Plan

## Overview

A platform for friends/couples to create shared onchain piggy banks with collaborative savings goals. Partners pool funds into Ethereum smart contracts, communicate via Push Protocol chat, receive notifications for activities, and require mutual approval for withdrawals.

## Tech Stack

- **Frontend**: Next.js 15 (existing), React 19, TypeScript, Tailwind CSS
- **Wallet**: Privy embedded wallets (Ethereum)
- **Blockchain**: Ethereum (via existing Privy setup)
- **Communication**: Push Protocol (@pushprotocol/restapi, @pushprotocol/uiweb)
- **Database**: PostgreSQL + Drizzle ORM
- **Smart Contracts**: Solidity (PiggyBank contract with multi-sig withdrawals)

## Key Features

1. **Notifications & Chat**: Push Protocol channels for deposit/goal alerts + partner chat
2. **Smart Contract**: Holds pooled funds from both partners' wallets
3. **Ethereum**: Primary blockchain network
4. **Multi-sig Withdrawals**: Both partners must approve before funds are released

## Implementation Steps

### 1. Database Setup with PostgreSQL & Drizzle ORM

**Database Schema:**

```typescript
// Users table
- id (uuid, primary key)
- privy_user_id (text, unique)
- wallet_address (text)
- email (text)
- created_at (timestamp)

// PiggyBanks table
- id (uuid, primary key)
- name (text)
- goal_amount (numeric)
- current_amount (numeric)
- contract_address (text, unique)
- status (enum: active, completed, cancelled)
- created_at (timestamp)
- goal_deadline (timestamp, nullable)

// PiggyBankMembers table
- id (uuid, primary key)
- piggy_bank_id (uuid, foreign key)
- user_id (uuid, foreign key)
- role (enum: creator, partner)
- joined_at (timestamp)

// Transactions table
- id (uuid, primary key)
- piggy_bank_id (uuid, foreign key)
- user_id (uuid, foreign key)
- amount (numeric)
- transaction_hash (text)
- type (enum: deposit, withdrawal)
- status (enum: pending, completed, failed)
- created_at (timestamp)

// WithdrawalApprovals table
- id (uuid, primary key)
- piggy_bank_id (uuid, foreign key)
- withdrawal_amount (numeric)
- initiator_id (uuid, foreign key)
- approver_id (uuid, foreign key, nullable)
- approved (boolean)
- approved_at (timestamp, nullable)
- executed (boolean)
- created_at (timestamp)
```

**Actions:**

- Install: `drizzle-orm`, `drizzle-kit`, `postgres`, `@types/pg`
- Create `src/db/schema.ts` with Drizzle schema definitions
- Create `src/db/index.ts` for database connection
- Setup `drizzle.config.ts` for migrations
- Create migration files and run initial migration

### 2. Smart Contract Development (Solidity)

**PiggyBank Contract Features:**

- Accepts deposits from two whitelisted addresses (partners)
- Tracks individual contributions and total balance
- Withdrawal requires approval from BOTH partners
- Goal tracking and status management
- Event emissions for deposits, approvals, withdrawals

**Contract Structure:**

```solidity
contract PiggyBank {
    address public partner1;
    address public partner2;
    uint256 public goalAmount;
    uint256 public totalDeposited;
    mapping(address => uint256) public contributions;

    struct WithdrawalRequest {
        uint256 amount;
        address initiator;
        bool partner1Approved;
        bool partner2Approved;
        bool executed;
    }

    WithdrawalRequest public pendingWithdrawal;

    // Functions: deposit(), requestWithdrawal(), approveWithdrawal(), executeWithdrawal()
}
```

**Actions:**

- Create `contracts/PiggyBank.sol`
- Install Hardhat: `hardhat`, `@nomicfoundation/hardhat-toolbox`, `@nomicfoundation/hardhat-viem`
- Write deployment script
- Test on Ethereum Sepolia testnet
- Store ABI in `src/contracts/PiggyBankABI.json`

### 3. Push Protocol Integration

**Notifications (Push Channels):**

- Create channel for the app
- Send notifications for: deposits, withdrawal requests, approvals, goal milestones
- Subscribe users to channel when they join a piggy bank

**Chat:**

- Initialize peer-to-peer chat between partners
- Create group chat for each piggy bank
- Real-time messaging for discussing savings goals

**Actions:**

- Install: `@pushprotocol/restapi`, `@pushprotocol/uiweb`, `@pushprotocol/socket`
- Create `src/lib/push-protocol.ts` for Push SDK initialization
- Create notification service in `src/services/notifications.ts`
- Create chat component in `src/components/sections/piggy-bank-chat.tsx`
- Register Push Protocol channel via dashboard
- Implement opt-in notification subscription flow

### 4. Backend API Routes (Next.js App Router)

**API Endpoints:**

```
POST   /api/piggy-banks/create        - Deploy new PiggyBank contract
GET    /api/piggy-banks                - List user's piggy banks
GET    /api/piggy-banks/[id]          - Get piggy bank details
POST   /api/piggy-banks/[id]/invite   - Invite partner
POST   /api/piggy-banks/[id]/join     - Accept invitation
GET    /api/piggy-banks/[id]/transactions - Transaction history
POST   /api/withdrawals/request       - Request withdrawal
POST   /api/withdrawals/[id]/approve  - Approve withdrawal
GET    /api/notifications/subscribe   - Subscribe to Push notifications
```

**Actions:**

- Create route handlers in `src/app/api/`
- Implement Privy authentication middleware
- Add smart contract interaction logic using viem
- Integrate Drizzle ORM queries
- Add Push Protocol notification triggers

### 5. Frontend Components

**New Pages:**

- `/dashboard` - List of user's piggy banks, create new, invitations
- `/piggy-bank/[id]` - Individual piggy bank details, deposit, withdraw, chat
- `/piggy-bank/create` - Create new piggy bank form

**New Components:**

```
src/components/piggy-bank/
  - piggy-bank-card.tsx           - Display piggy bank summary
  - piggy-bank-create-form.tsx    - Form to create new piggy bank
  - piggy-bank-details.tsx        - Full details view
  - deposit-form.tsx              - Deposit funds into piggy bank
  - withdrawal-request.tsx        - Request withdrawal UI
  - withdrawal-approval.tsx       - Approve/reject withdrawal
  - goal-progress.tsx             - Visual goal progress indicator
  - transaction-history.tsx       - List all transactions
  - partner-invite.tsx            - Invite partner via email/address

src/components/push/
  - notification-bell.tsx         - Notification dropdown
  - chat-window.tsx               - Push Protocol chat interface
  - chat-message.tsx              - Individual message component
```

**Actions:**

- Create all component files
- Integrate Privy wallet hooks for transactions
- Add contract interaction using viem and wagmi hooks
- Style with existing Tailwind setup
- Add loading states and error handling

### 6. Contract Interaction Layer

**Smart Contract Integration:**

- Use viem for contract reads/writes
- Implement hooks for: deposit, requestWithdrawal, approveWithdrawal
- Listen to contract events for real-time updates
- Handle transaction confirmations

**Actions:**

- Create `src/hooks/usePiggyBank.ts` for contract interactions
- Create `src/hooks/useDeposit.ts` for deposit flow
- Create `src/hooks/useWithdrawal.ts` for withdrawal flow
- Add contract event listeners in `src/lib/contract-events.ts`

### 7. Push Protocol Features Implementation

**Notification System:**

- Send notification when partner deposits
- Alert on withdrawal requests
- Notify when withdrawal approved
- Celebrate goal milestones (25%, 50%, 75%, 100%)

**Chat System:**

- Initialize chat when piggy bank created
- Auto-create group chat for both partners
- Persist chat messages
- Show unread message indicators

**Actions:**

- Implement notification sending in API routes
- Create Push Protocol chat UI component
- Add notification permission requests
- Style notifications to match app theme

### 8. Environment & Configuration

**Environment Variables:**

```
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=
DATABASE_URL=
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS=
PUSH_CHANNEL_PRIVATE_KEY=
NEXT_PUBLIC_ETHEREUM_RPC_URL=
PIGGY_BANK_FACTORY_ADDRESS=
```

**Actions:**

- Update `.env.local` with all required variables
- Configure Privy dashboard for Ethereum
- Set up PostgreSQL database (local or Vercel Postgres)
- Deploy contracts and save addresses

### 9. Testing & Deployment

**Testing:**

- Test smart contract functions on Sepolia
- Test deposit flow end-to-end
- Test multi-sig withdrawal approval
- Test Push notifications and chat
- Test database operations

**Deployment:**

- Deploy PostgreSQL on Vercel Postgres or Railway
- Deploy Next.js app on Vercel
- Deploy smart contracts on Ethereum Sepolia (or mainnet)
- Register and verify Push Protocol channel

**Actions:**

- Run contract tests with Hardhat
- Test all user flows manually
- Deploy to Vercel
- Verify all integrations work in production

## Critical Files to Create/Modify

**New Files:**

- `contracts/PiggyBank.sol` - Main smart contract
- `src/db/schema.ts` - Database schema
- `src/db/index.ts` - DB connection
- `src/lib/push-protocol.ts` - Push SDK setup
- `src/services/notifications.ts` - Notification service
- `src/hooks/usePiggyBank.ts` - Contract hooks
- `src/app/dashboard/page.tsx` - Dashboard page
- `src/app/piggy-bank/[id]/page.tsx` - Piggy bank detail page
- `src/app/api/piggy-banks/route.ts` - API routes
- `src/components/piggy-bank/*` - All piggy bank components
- `src/components/push/*` - Push Protocol components

**Modify:**

- `src/providers/providers.tsx` - Keep Ethereum config, remove Solana
- `package.json` - Add new dependencies
- `.env.local` - Add environment variables

## Dependencies to Install

```bash
# Database
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg

# Smart Contracts
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-viem

# Push Protocol
pnpm add @pushprotocol/restapi @pushprotocol/uiweb @pushprotocol/socket

# Additional utilities
pnpm add date-fns ethers@5.7.2
```

## Development Timeline (Hackathon - 48 hours)

**Hour 0-6:** Database + Smart Contracts

- Set up PostgreSQL, Drizzle schemas, migrations
- Write and test PiggyBank.sol contract
- Deploy to Sepolia testnet

**Hour 6-12:** Backend API

- Create all API routes
- Implement contract deployment logic
- Set up Push Protocol channel

**Hour 12-24:** Frontend Core

- Build dashboard, create piggy bank flow
- Implement deposit functionality
- Add transaction history

**Hour 24-36:** Multi-sig Withdrawals

- Build withdrawal request UI
- Implement approval flow
- Test end-to-end withdrawal

**Hour 36-42:** Push Protocol Integration

- Add notification system
- Implement chat interface
- Test real-time features

**Hour 42-48:** Polish & Deploy

- Fix bugs, improve UI/UX
- Deploy to production
- Prepare demo

## Success Metrics

- Users can create piggy banks with partners
- Both partners can deposit funds
- Withdrawals require approval from both partners
- Notifications sent for all major events
- Partners can chat about their savings goals
- Smart contracts secure funds properly

### To-dos

- [ ] Set up PostgreSQL database with Drizzle ORM, create schemas for users, piggy banks, members, transactions, and withdrawal approvals
- [ ] Write PiggyBank.sol smart contract with multi-sig withdrawal logic, deploy to Ethereum Sepolia testnet
- [ ] Install Push Protocol SDKs, create channel, set up notification and chat infrastructure
- [ ] Create Next.js API routes for piggy bank CRUD, deposits, withdrawals, and approvals
- [ ] Build React hooks for contract interactions (deposit, withdraw request, approve withdrawal) using viem
- [ ] Build dashboard, piggy bank creation, detail pages, and deposit/withdrawal UI components
- [ ] Implement Push Protocol notifications for deposits, withdrawal requests, approvals, and milestones
- [ ] Build Push Protocol chat interface for partners to communicate about savings goals
- [ ] Test all flows end-to-end, deploy to Vercel, verify smart contracts and Push Protocol integration
