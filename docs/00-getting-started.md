# Getting Started - Onchain Piggy Bank Platform

## 🚀 Quick Start Guide

This hackathon project guide will help you build a fully functional onchain piggy bank platform where friends and couples can save money together using Ethereum smart contracts, Privy embedded wallets, and Push Protocol notifications.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed
- **pnpm** package manager (`npm install -g pnpm`)
- **Foundry** for smart contracts (`curl -L https://foundry.paradigm.xyz | bash`)
- **PostgreSQL** (local or cloud)
- **Git** for version control
- Basic knowledge of React, TypeScript, and Solidity

### Required Accounts

Create accounts for the following services:

1. **Privy** - https://dashboard.privy.io
   - Sign up and create a new app
   - Note down your App ID and Client ID

2. **Alchemy** or **Infura** - For Ethereum RPC
   - Get a free API key for Sepolia testnet

3. **Etherscan** - https://etherscan.io/apis
   - Get API key for contract verification

4. **Push Protocol** - https://app.push.org
   - You'll create a channel later (requires testnet ETH)

5. **Vercel** (for deployment) - https://vercel.com
   - Sign up with GitHub

## 📚 Implementation Order

Follow these guides in sequence:

### Stage 1: Database Setup (2-3 hours)

**File**: `01-database-setup-drizzle.md`

- Setup PostgreSQL database
- Configure Drizzle ORM
- Define schemas for users, piggy banks, transactions, and approvals
- Create database queries and utilities

**Deliverable**: Working database with all tables and relationships

---

### Stage 2: Smart Contracts (3-4 hours)

**File**: `02-smart-contract-foundry.md`

- Write PiggyBank.sol contract
- Create PiggyBankFactory.sol
- Write comprehensive tests
- Deploy to Sepolia testnet
- Verify contracts on Etherscan

**Deliverable**: Deployed and verified smart contracts

---

### Stage 3: Push Protocol Integration (2-3 hours)

**File**: `03-push-protocol-integration.md`

- Install Push Protocol SDKs
- Create notification service
- Build chat functionality
- Setup notification channels
- Create UI components for notifications and chat

**Deliverable**: Working notification and chat system

---

### Stage 4: Backend API Routes (3-4 hours)

**File**: `04-backend-api-routes.md`

- Create authentication utilities
- Build API endpoints for piggy banks
- Implement deposit/withdrawal routes
- Setup Privy authentication middleware
- Connect to database and smart contracts

**Deliverable**: RESTful API for all features

---

### Stage 5: Frontend Components (4-5 hours)

**File**: `05-frontend-components.md`

- Build dashboard page
- Create piggy bank components
- Design deposit/withdrawal forms
- Implement goal progress visualizations
- Setup transaction history display

**Deliverable**: Complete user interface

---

### Stage 6: Contract Interaction Hooks (2-3 hours)

**File**: `06-contract-interaction-hooks.md`

- Create React hooks for contract interactions
- Implement deposit logic
- Build withdrawal request/approval flows
- Setup event listeners
- Handle transaction states

**Deliverable**: Frontend connected to smart contracts

---

### Stage 7: Testing & Deployment (2-3 hours)

**File**: `07-deployment-guide.md`

- Test all functionality
- Deploy to Vercel
- Configure production environment
- Setup monitoring
- Create backup strategy

**Deliverable**: Live production application

---

## 🎯 Total Estimated Time: 18-25 hours

Perfect for a weekend hackathon or a week of focused development.

## 🏗️ Project Structure

```
create-next-app/
├── contracts/                    # Foundry smart contracts
│   ├── src/
│   │   ├── PiggyBank.sol
│   │   └── PiggyBankFactory.sol
│   ├── test/
│   │   └── PiggyBank.t.sol
│   └── script/
│       └── Deploy.s.sol
│
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── dashboard/
│   │   ├── piggy-bank/
│   │   └── api/                  # API routes
│   │
│   ├── components/
│   │   ├── piggy-bank/          # Piggy bank components
│   │   └── push/                # Push Protocol components
│   │
│   ├── hooks/                    # React hooks for contracts
│   │   ├── usePiggyBank.ts
│   │   ├── useDeposit.ts
│   │   └── useWithdrawal.ts
│   │
│   ├── lib/                      # Utilities
│   │   ├── push-protocol.ts
│   │   ├── api-client.ts
│   │   └── auth.ts
│   │
│   ├── services/                 # Backend services
│   │   └── notifications.ts
│   │
│   ├── db/                       # Database
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── queries.ts
│   │
│   ├── contracts/                # Contract ABIs and types
│   │   ├── PiggyBankABI.json
│   │   └── types.ts
│   │
│   └── providers/
│       └── providers.tsx
│
├── docs/                         # Implementation guides
│   ├── 00-getting-started.md    # This file
│   ├── 01-database-setup-drizzle.md
│   ├── 02-smart-contract-foundry.md
│   ├── 03-push-protocol-integration.md
│   ├── 04-backend-api-routes.md
│   ├── 05-frontend-components.md
│   ├── 06-contract-interaction-hooks.md
│   └── 07-deployment-guide.md
│
├── drizzle/                      # Database migrations
├── .env.local                    # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🔑 Environment Variables Setup

Create `.env.local` in the project root:

```bash
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PUBLIC_PRIVY_CLIENT_ID="your-privy-client-id"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/piggybank_db"

# Ethereum
NEXT_PUBLIC_ETHEREUM_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
NEXT_PUBLIC_FACTORY_ADDRESS="0x..." # After deploying contracts

# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0x..." # After creating channel
PUSH_CHANNEL_PRIVATE_KEY="your-channel-private-key"
NEXT_PUBLIC_PUSH_ENV="staging"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🚦 Quick Development Workflow

### 1. Clone and Install

```bash
git clone <your-repo>
cd create-next-app
pnpm install
```

### 2. Setup Database

```bash
# Start PostgreSQL
# Then run:
pnpm db:generate
pnpm db:push
```

### 3. Deploy Smart Contracts

```bash
cd contracts
forge install
forge test
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "@privy-io/react-auth": "^2.25.0",
    "@pushprotocol/restapi": "latest",
    "@pushprotocol/uiweb": "latest",
    "drizzle-orm": "latest",
    "postgres": "latest",
    "viem": "^2.37.6",
    "ethers": "^5.7.2",
    "next": "15.5.3",
    "react": "19.1.0"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "@types/pg": "latest",
    "hardhat": "latest",
    "@nomicfoundation/hardhat-toolbox": "latest"
  }
}
```

## 🎨 Design Philosophy

### User Experience

- **Simple**: Clean, intuitive interface
- **Fast**: Optimistic updates, minimal loading states
- **Transparent**: All transactions visible on-chain
- **Secure**: Self-custodial wallets, multi-sig withdrawals

### Technical Approach

- **Type-Safe**: TypeScript throughout
- **Modern Stack**: Latest Next.js, React 19, Tailwind CSS
- **Gas Optimized**: Efficient Solidity patterns
- **Scalable**: Modular architecture, easy to extend

## 🔧 Development Tips

### Debugging Smart Contracts

```bash
# Use Foundry's verbose mode
forge test -vvvv --match-test test_name

# Check gas usage
forge test --gas-report
```

### Debugging Frontend

```bash
# Enable detailed logs
export DEBUG=true

# Check Privy wallet connection
console.log(user?.wallet)
```

### Database Debugging

```bash
# Open Drizzle Studio
pnpm db:studio

# Check migrations
pnpm db:generate
```

## 📝 Testing Strategy

### Smart Contracts

- Unit tests for all functions
- Integration tests for multi-step flows
- Fuzz testing for edge cases

### Frontend

- Component testing with React Testing Library
- E2E tests with Playwright (optional)
- Manual testing of user flows

### API

- Route testing with supertest
- Database query testing
- Auth middleware testing

## 🎓 Learning Resources

### Privy

- [Privy Documentation](https://docs.privy.io)
- [Embedded Wallets Guide](https://docs.privy.io/guide/embedded-wallets)

### Push Protocol

- [Push Documentation](https://docs.push.org)
- [Notification Guide](https://docs.push.org/developers/developer-guides/sending-notifications)
- [Chat Integration](https://docs.push.org/developers/developer-guides/chat)

### Smart Contracts

- [Foundry Book](https://book.getfoundry.sh)
- [Solidity by Example](https://solidity-by-example.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

### Frontend

- [Next.js Docs](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Support

If you encounter issues:

1. Check the specific implementation guide
2. Review error messages carefully
3. Check environment variables are set correctly
4. Verify contracts are deployed to correct network
5. Check database connection
6. Review Privy/Push Protocol dashboards

## 🎉 What You'll Build

By the end of this guide, you'll have:

✅ A fully functional dApp with:

- User authentication via Privy
- Embedded Ethereum wallets
- Smart contracts managing shared funds
- Multi-signature withdrawal system
- Real-time notifications via Push Protocol
- Partner chat functionality
- Beautiful, responsive UI
- Production deployment on Vercel

✅ Skills in:

- Solidity smart contract development
- Web3 frontend development
- Database design and management
- API development
- Real-time notifications
- Deployment and DevOps

## 🚀 Ready to Start?

Begin with **Stage 1: Database Setup** → `01-database-setup-drizzle.md`

Good luck with your hackathon! 🏆
