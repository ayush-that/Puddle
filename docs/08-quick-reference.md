# Quick Reference - Onchain Piggy Bank Platform

## 📋 Essential Commands

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Format code
pnpm format
```

### Database

```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
```

### Smart Contracts

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Verify contract
forge verify-contract <ADDRESS> <CONTRACT> --chain sepolia

# Get gas report
forge test --gas-report

# Check coverage
forge coverage
```

### Deployment

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

## 🔑 Environment Variables Template

```bash
# ===== PRIVY =====
NEXT_PUBLIC_PRIVY_APP_ID="your-app-id-from-privy-dashboard"
NEXT_PUBLIC_PRIVY_CLIENT_ID="your-client-id-from-privy-dashboard"

# ===== DATABASE =====
# Local PostgreSQL
DATABASE_URL="postgresql://localhost:5432/piggybank_db"

# Vercel Postgres (production)
# DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb?pgbouncer=true"

# ===== ETHEREUM =====
NEXT_PUBLIC_ETHEREUM_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
NEXT_PUBLIC_FACTORY_ADDRESS="0x..." # Deployed factory contract address

# ===== PUSH PROTOCOL =====
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0x..." # Your Push channel address
PUSH_CHANNEL_PRIVATE_KEY="xxx" # Private key of channel creator wallet
NEXT_PUBLIC_PUSH_ENV="staging" # or "prod" for mainnet

# ===== APPLICATION =====
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Change in production
```

## 📂 Key File Locations

### Smart Contracts

- **Main Contract**: `contracts/src/PiggyBank.sol`
- **Factory**: `contracts/src/PiggyBankFactory.sol`
- **Tests**: `contracts/test/PiggyBank.t.sol`
- **Deploy Script**: `contracts/script/Deploy.s.sol`
- **Config**: `contracts/foundry.toml`

### Database

- **Schema**: `src/db/schema.ts`
- **Connection**: `src/db/index.ts`
- **Queries**: `src/db/queries.ts`
- **Config**: `drizzle.config.ts`

### Frontend

- **Landing**: `src/app/page.tsx`
- **Dashboard**: `src/app/dashboard/page.tsx`
- **Piggy Bank Detail**: `src/app/piggy-bank/[id]/page.tsx`
- **Create Form**: `src/app/piggy-bank/create/page.tsx`

### Components

- **Piggy Bank Card**: `src/components/piggy-bank/piggy-bank-card.tsx`
- **Goal Progress**: `src/components/piggy-bank/goal-progress.tsx`
- **Deposit Form**: `src/components/piggy-bank/deposit-form.tsx`
- **Transaction History**: `src/components/piggy-bank/transaction-history.tsx`
- **Chat Window**: `src/components/push/chat-window.tsx`
- **Notification Bell**: `src/components/push/notification-bell.tsx`

### API Routes

- **User**: `src/app/api/auth/user/route.ts`
- **Piggy Banks**: `src/app/api/piggy-banks/route.ts`
- **Deposit**: `src/app/api/deposits/record/route.ts`
- **Withdrawal Request**: `src/app/api/withdrawals/request/route.ts`
- **Withdrawal Approve**: `src/app/api/withdrawals/[id]/approve/route.ts`

### Hooks

- **Contract Base**: `src/hooks/useContract.ts`
- **Piggy Bank**: `src/hooks/usePiggyBank.ts`
- **Deposit**: `src/hooks/useDeposit.ts`
- **Withdrawal**: `src/hooks/useWithdrawal.ts`
- **Events**: `src/hooks/useContractEvents.ts`

### Services

- **Push Protocol**: `src/lib/push-protocol.ts`
- **Notifications**: `src/services/notifications.ts`
- **API Client**: `src/lib/api-client.ts`
- **Auth**: `src/lib/auth.ts`

## 🎨 Important Code Snippets

### Initialize Privy in Layout

```typescript
// src/app/layout.tsx
import Providers from "@/providers/providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Using Privy Wallet

```typescript
import { usePrivy } from '@privy-io/react-auth';

function Component() {
  const { user, login, logout, authenticated } = usePrivy();

  return (
    <div>
      {authenticated ? (
        <>
          <p>Wallet: {user?.wallet?.address}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

### Reading from Contract

```typescript
import { useContract } from "@/hooks/useContract";
import { contracts } from "@/contracts/config";

const publicClient = getPublicClient();

const balance = await publicClient.readContract({
  address: contractAddress,
  abi: contracts.piggyBank.abi,
  functionName: "getBalance",
});
```

### Writing to Contract

```typescript
const walletClient = await getWalletClient();
const publicClient = getPublicClient();

const { request } = await publicClient.simulateContract({
  address: contractAddress,
  abi: contracts.piggyBank.abi,
  functionName: "deposit",
  value: parseEther("0.1"),
  account: walletClient.account,
});

const hash = await walletClient.writeContract(request);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

### Database Query

```typescript
import { db } from '@/db';
import { piggyBanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Select
const piggyBank = await db
  .select()
  .from(piggyBanks)
  .where(eq(piggyBanks.id, id));

// Insert
const newPiggyBank = await db
  .insert(piggyBanks)
  .values({ name, goalAmount, ... })
  .returning();

// Update
const updated = await db
  .update(piggyBanks)
  .set({ currentAmount })
  .where(eq(piggyBanks.id, id))
  .returning();
```

### Sending Push Notification

```typescript
import { PiggyBankNotifications } from "@/services/notifications";

await PiggyBankNotifications.depositMade(
  recipientAddress,
  depositorName,
  amount,
  piggyBankName,
  piggyBankId,
);
```

### API Call with Auth

```typescript
import { apiClient } from "@/lib/api-client";
import { usePrivy } from "@privy-io/react-auth";

const { getAccessToken } = usePrivy();
const token = await getAccessToken();

const data = await apiClient.getPiggyBanks(token);
```

## 🔐 Security Best Practices

### Smart Contracts

- ✅ Use custom errors for gas efficiency
- ✅ Follow checks-effects-interactions pattern
- ✅ Validate all inputs
- ✅ Use immutable for constants
- ✅ Emit events for all state changes
- ❌ Never use `tx.origin`
- ❌ Avoid loops with unbounded length

### Backend

- ✅ Verify Privy JWT tokens
- ✅ Validate all user inputs
- ✅ Use parameterized queries (Drizzle handles this)
- ✅ Rate limit API endpoints
- ✅ Never expose private keys
- ❌ Don't trust client-side data

### Frontend

- ✅ Validate user inputs
- ✅ Handle errors gracefully
- ✅ Show transaction status
- ✅ Use environment variables for config
- ❌ Never store private keys in localStorage

## 📊 Gas Optimization Tips

```solidity
// ✅ Good: Use immutable for constructor-set values
address public immutable partner1;

// ❌ Bad: Using storage for constants
address public partner1;

// ✅ Good: Pack structs efficiently
struct WithdrawalRequest {
    uint128 amount;  // 16 bytes
    uint128 timestamp;  // 16 bytes
    address initiator;  // 20 bytes (uses new slot)
    bool executed;  // 1 byte
}

// ✅ Good: Use custom errors
error Unauthorized();
if (msg.sender != partner1) revert Unauthorized();

// ❌ Bad: Use require with strings
require(msg.sender == partner1, "Unauthorized");
```

## 🎯 Common Error Solutions

### "Transaction Reverted"

- Check wallet has enough ETH for gas
- Verify function arguments are correct
- Ensure contract is on correct network
- Check contract state allows the operation

### "Database Connection Failed"

- Verify DATABASE_URL is correct
- Check database is running
- For serverless, use connection pooling URL
- Ensure migrations are run

### "Privy Authentication Failed"

- Check app ID and client ID
- Verify domain is allowed in Privy dashboard
- Clear browser cache and cookies
- Check redirect URLs are configured

### "Push Notification Not Sent"

- Verify channel address is correct
- Check private key matches channel creator
- Ensure recipient is subscribed to channel
- Check Push Protocol network status

## 📱 Useful Links

### Dashboards

- [Privy Dashboard](https://dashboard.privy.io)
- [Push Protocol](https://app.push.org)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Sepolia Etherscan](https://sepolia.etherscan.io)

### Documentation

- [Privy Docs](https://docs.privy.io)
- [Push Protocol Docs](https://docs.push.org)
- [Viem Docs](https://viem.sh)
- [Foundry Book](https://book.getfoundry.sh)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Next.js Docs](https://nextjs.org/docs)

### Tools

- [Alchemy](https://dashboard.alchemy.com)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Etherscan Contract Verifier](https://sepolia.etherscan.io/verifyContract)

## 🧪 Testing Checklist

### Smart Contracts

- [ ] All functions have tests
- [ ] Edge cases covered
- [ ] Gas usage acceptable
- [ ] Events emitted correctly
- [ ] Access control working
- [ ] Reentrancy protection works

### Frontend

- [ ] User can login
- [ ] Wallet created automatically
- [ ] Can create piggy bank
- [ ] Can deposit funds
- [ ] Can request withdrawal
- [ ] Can approve withdrawal
- [ ] Notifications received
- [ ] Chat works
- [ ] Transaction history displays
- [ ] Error states handled

### API

- [ ] Authentication working
- [ ] All endpoints respond correctly
- [ ] Database queries execute
- [ ] Errors handled gracefully
- [ ] Rate limiting works

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Smart contracts deployed to Sepolia
- [ ] Contracts verified on Etherscan
- [ ] Database migrations run
- [ ] Push channel created

### Deployment

- [ ] Environment variables set in Vercel
- [ ] Build succeeds
- [ ] Database connected
- [ ] Application accessible
- [ ] SSL certificate active

### Post-Deployment

- [ ] Test all user flows
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Verify notifications working
- [ ] Test on mobile devices

## 💡 Pro Tips

1. **Development**
   - Use `pnpm` for faster installs
   - Enable Turbopack for faster dev server
   - Use Drizzle Studio to inspect database
   - Keep Foundry updated

2. **Testing**
   - Test on Sepolia before mainnet
   - Use small amounts for testing
   - Keep test wallets separate
   - Document test cases

3. **Deployment**
   - Use preview deployments
   - Monitor logs after deployment
   - Set up error tracking (Sentry)
   - Keep backup of database

4. **Maintenance**
   - Update dependencies regularly
   - Monitor gas prices
   - Check for security updates
   - Backup database weekly

## 📊 Performance Targets

- **Page Load**: < 2 seconds
- **Database Query**: < 100ms
- **Contract Read**: < 500ms
- **Contract Write**: 15-30 seconds (blockchain confirmation)
- **API Response**: < 200ms

## 🎉 Success Metrics

- Users can create piggy bank in < 2 minutes
- Deposit transaction confirms in < 30 seconds
- Notifications arrive within 10 seconds
- Zero critical bugs in production
- 99% uptime

---

**Last Updated**: Built for Hackathon 2025
