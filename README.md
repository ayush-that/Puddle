# 🐷 Puddle - Onchain Piggy Bank Platform

**Save money together with your partner using blockchain technology.**

A mobile-first web3 application for creating shared savings goals with multi-signature security, real-time notifications, and partner chat.

---

## ✨ Features

### Core Functionality

- 🏦 **Shared Piggy Banks** - Create collaborative savings goals with a partner
- 🔐 **Multi-Sig Security** - Both partners must approve withdrawals
- 💰 **Deposits & Withdrawals** - Easy on-chain transactions
- 📊 **Goal Tracking** - Visual progress bars and milestone notifications
- 📱 **Mobile-First** - Optimized for mobile devices (320-428px)

### Communication

- 🔔 **Push Notifications** - Real-time updates for deposits, withdrawals, milestones
- 💬 **Partner Chat** - Encrypted messaging powered by Push Protocol
- 🎯 **Milestone Alerts** - Celebrate 25%, 50%, 75%, 100% goal completion

### Web3 Integration

- 🔗 **Push Chain** - Fast, low-cost blockchain transactions
- 👛 **Privy Auth** - Seamless wallet connection with embedded wallets
- ⛽ **Low Gas Fees** - Affordable transactions using PUSH tokens
- 📜 **Smart Contracts** - Solidity contracts with Foundry testing

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (or **Bun** recommended)
- **PostgreSQL** database
- **Push Chain** testnet tokens
- **Privy** account (free)
- **Push Protocol** channel (optional for notifications)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/puddle.git
cd puddle

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
bun run db:push

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
puddle/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # User dashboard
│   │   ├── piggy-bank/         # Piggy bank pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── piggy-bank/         # Piggy bank features
│   │   ├── push/               # Push Protocol components
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and helpers
│   ├── services/               # Backend services
│   ├── db/                     # Database schema (Drizzle ORM)
│   └── contracts/              # Contract ABIs and configs
├── contracts/                  # Solidity smart contracts
│   ├── src/                    # Contract source files
│   ├── test/                   # Foundry tests
│   └── script/                 # Deployment scripts
├── docs/                       # Comprehensive documentation
├── TESTING_GUIDE.md           # Testing procedures
├── DEPLOYMENT.md              # Deployment guide
└── USER_GUIDE.md              # User documentation
```

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Mobile-first styling
- **Privy** - Web3 authentication
- **Viem** - Ethereum interactions

### Backend

- **Next.js API Routes** - Serverless backend
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries

### Blockchain

- **Solidity ^0.8.24** - Smart contract language
- **Foundry** - Contract development & testing
- **Push Chain** - EVM-compatible blockchain
- **Push Protocol** - Web3 notifications & chat

---

## 🔧 Development

### Run Development Server

```bash
bun dev
```

### Database Management

```bash
# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Generate migrations (if needed)
bun run db:generate
```

### Smart Contracts

```bash
cd contracts

# Compile contracts
forge build

# Run tests
forge test -vvv

# Run specific test
forge test --match-test test_withdrawal -vvv

# Gas report
forge test --gas-report

# Deploy to Push Chain Testnet
forge script script/Deploy.s.sol --rpc-url push_testnet --broadcast
```

### Code Quality

```bash
# Format code
bun run format

# Type check
bun run type-check

# Lint
bun run lint
```

---

## 🧪 Testing

Comprehensive testing guide available in [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### Quick Test Commands

```bash
# Smart contract tests
cd contracts && forge test -vvv

# Build application
bun run build

# Test API endpoints
./test-api.sh
```

### Test Coverage

- ✅ Smart contract unit tests (Foundry)
- ✅ API endpoint tests (curl scripts)
- ✅ Frontend user flow tests (manual)
- ✅ Mobile device tests (iPhone/Android)
- ✅ Error scenario tests
- ✅ Performance tests (Lighthouse)

---

## 📦 Deployment

Detailed deployment guide available in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Required for production:

```bash
# Database
DATABASE_URL="postgresql://..."

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID="..."
NEXT_PUBLIC_PRIVY_CLIENT_ID="..."

# Push Chain
NEXT_PUBLIC_PUSH_CHAIN_RPC_URL="https://evm.rpc-testnet-node1.push.org/"
NEXT_PUBLIC_FACTORY_ADDRESS="0x0E2514e3aaF9a60cBD82B5e1f996d339AD16ead9"

# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="..."
PUSH_CHANNEL_PRIVATE_KEY="..."
NEXT_PUBLIC_PUSH_ENV="staging"

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

---

## 📚 Documentation

### For Developers

- [Getting Started](./docs/00-getting-started.md)
- [Database Setup](./docs/01-database-setup-drizzle.md)
- [Smart Contracts](./docs/02-smart-contract-foundry.md)
- [Push Protocol](./docs/03-push-protocol-integration.md)
- [API Routes](./docs/04-backend-api-routes.md)
- [Frontend Components](./docs/05-frontend-components.md)
- [Contract Hooks](./docs/06-contract-interaction-hooks.md)
- [Deployment](./docs/07-deployment-guide.md)
- [Quick Reference](./docs/08-quick-reference.md)

### For Users

- [User Guide](./USER_GUIDE.md) - How to use the app
- [FAQ](./USER_GUIDE.md#faq) - Common questions

### For Deployment

- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive testing
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

---

## 🏗️ Architecture

### Smart Contract Architecture

```
PiggyBankFactory.sol
└── Creates → PiggyBank.sol
                ├── Deposits (partner1, partner2)
                ├── Multi-sig Withdrawals
                ├── Goal Tracking
                └── Event Emissions
```

**Key Contracts**:

- `PiggyBankFactory.sol` - Deploys and tracks piggy banks
- `PiggyBank.sol` - Individual piggy bank with multi-sig logic

**Deployed Addresses**:

- Factory (Push Chain Testnet): `0x0E2514e3aaF9a60cBD82B5e1f996d339AD16ead9`

### Database Schema

```
users
├── id (UUID)
├── privy_user_id
├── wallet_address
└── email (optional)

piggy_banks
├── id (UUID)
├── name
├── goal_amount
├── current_amount
├── contract_address
├── status
└── goal_deadline

piggy_bank_members
├── piggy_bank_id → piggy_banks.id
├── user_id → users.id
└── role (creator, partner)

transactions
├── piggy_bank_id → piggy_banks.id
├── user_id → users.id
├── amount
├── type (deposit, withdrawal)
├── transaction_hash
└── status

withdrawal_approvals
├── piggy_bank_id → piggy_banks.id
├── initiator_id → users.id
├── approver_id → users.id
├── withdrawal_amount
├── approved
└── executed
```

### API Routes

**Authentication**:

- `GET /api/auth/user` - Get/create user

**Piggy Banks**:

- `POST /api/piggy-banks` - Create piggy bank
- `GET /api/piggy-banks` - List user's piggy banks
- `GET /api/piggy-banks/[id]` - Get piggy bank details
- `POST /api/piggy-banks/[id]/invite` - Invite partner

**Transactions**:

- `POST /api/deposits/record` - Record deposit
- `POST /api/withdrawals/request` - Request withdrawal
- `POST /api/withdrawals/[id]/approve` - Approve withdrawal

**Notifications**:

- `POST /api/notifications/subscribe` - Subscribe to Push channel

---

## 🔐 Security

### Smart Contract Security

- ✅ Reentrancy guards
- ✅ Access control (only partners)
- ✅ Safe math (Solidity ^0.8.0)
- ✅ Event logging
- ✅ Input validation
- ✅ Multi-signature withdrawals

### Application Security

- ✅ JWT authentication (Privy)
- ✅ Parameterized queries (Drizzle)
- ✅ HTTPS only
- ✅ Environment variable protection
- ✅ No private keys in client code
- ✅ CORS configuration

### Best Practices

- Never commit `.env` files
- Use Vercel secrets for sensitive data
- Backup wallet recovery phrases
- Test on testnet before mainnet
- Consider smart contract audit for mainnet

---

## 🎨 Design Principles

### Mobile-First

- Designed exclusively for mobile (320-428px width)
- Touch-friendly targets (≥44x44px)
- Portrait orientation only
- One-handed use optimized
- Safe area insets for notched devices

### User Experience

- Clean, intuitive interface
- Fast loading (< 2s)
- Smooth 60fps scrolling
- Clear error messages
- Progress feedback
- Optimistic updates

### Accessibility

- Proper heading hierarchy
- Alt text for images
- ARIA labels
- Sufficient color contrast (4.5:1)
- Screen reader friendly
- Keyboard navigation support

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the coding style in `.cursorrules`
- Write tests for new features
- Update documentation
- Test on mobile devices
- Ensure all tests pass

---

## 📊 Roadmap

### Phase 1: MVP ✅ Complete

- [x] Smart contracts deployed
- [x] Database schema
- [x] API routes
- [x] Frontend components
- [x] Push Protocol integration
- [x] Mobile-responsive UI

### Phase 2: Testing & Deployment (In Progress)

- [ ] Comprehensive testing
- [ ] Push Protocol channel setup
- [ ] Production deployment
- [ ] User documentation
- [ ] Mobile device testing

### Phase 3: Enhanced Features (Planned)

- [ ] Group piggy banks (3+ members)
- [ ] Recurring deposits
- [ ] Savings challenges
- [ ] Goal templates
- [ ] Analytics dashboard
- [ ] Export transaction history

### Phase 4: Advanced Features (Future)

- [ ] Multi-chain support
- [ ] Token swaps
- [ ] Yield generation
- [ ] Social features
- [ ] Gamification
- [ ] Mobile native apps

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Push Protocol** - Web3 notifications and chat
- **Privy** - Seamless wallet authentication
- **Vercel** - Hosting and deployment
- **Foundry** - Smart contract development
- **Drizzle** - Type-safe database queries

---

## 📞 Support

### Documentation

- [User Guide](./USER_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Developer Docs](./docs/)

### Community

- GitHub Issues: [Report bugs or request features]
- Twitter: [@your_twitter]
- Discord: [your_discord]

### Resources

- [Push Protocol Docs](https://docs.push.org)
- [Privy Docs](https://docs.privy.io)
- [Foundry Book](https://book.getfoundry.sh)
- [Next.js Docs](https://nextjs.org/docs)

---

## 🌟 Show Your Support

If you find this project useful, please consider:

- ⭐ Starring the repository
- 🐦 Sharing on Twitter
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code

---

**Built with ❤️ for the web3 community**

**Happy Saving! 🐷💰**

---

_Status: Ready for Testing & Deployment_
_Version: 1.0.0_
_Last Updated: January 2025_
