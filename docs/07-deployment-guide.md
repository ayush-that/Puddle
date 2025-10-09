# Stage 7: Testing & Deployment Guide

## Overview

This guide covers testing your application and deploying it to production with Vercel, PostgreSQL, and Ethereum Sepolia/Mainnet.

## Pre-Deployment Checklist

- [ ] All smart contracts tested with Foundry
- [ ] Frontend components tested manually
- [ ] API routes functional
- [ ] Database migrations run successfully
- [ ] Push Protocol channel created
- [ ] Environment variables documented

## Step 1: Testing Smart Contracts

### Run Foundry Tests

```bash
cd contracts

# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test test_Deposit -vvv

# Check test coverage
forge coverage

# Generate gas report
forge test --gas-report
```

### Test on Local Network

```bash
# Start local Anvil node
anvil

# Deploy contracts locally
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

## Step 2: Deploy Smart Contracts to Sepolia

### Setup Wallet

```bash
# Add your private key to .env in contracts folder
PRIVATE_KEY="your-private-key-here"
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

### Deploy Factory Contract

```bash
# Source environment
source .env

# Deploy to Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv

# Save the deployed factory address
echo "NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddress" >> ../.env.local
```

### Verify Contract

```bash
# If verification fails during deployment
forge verify-contract \
  0xYourFactoryAddress \
  src/PiggyBankFactory.sol:PiggyBankFactory \
  --chain sepolia \
  --watch
```

## Step 3: Setup PostgreSQL Database

### Option A: Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create piggybank-db

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.local
```

### Option B: Railway

1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy connection string
4. Add to `.env.local`:

```bash
DATABASE_URL="postgresql://user:pass@host:port/db"
```

### Option C: Supabase

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy "Connection Pooling" URL (for serverless)
4. Add to `.env.local`

### Run Migrations

```bash
# Generate migrations
pnpm db:generate

# Push to database
pnpm db:push

# Or run migrations
pnpm db:migrate
```

## Step 4: Configure Push Protocol

### Create Channel

1. Visit https://app.push.org
2. Connect wallet
3. Click "Create Channel"
4. Fill details and deploy (requires gas)
5. Save channel address:

```bash
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYourChannelAddress"
```

### Get Channel Private Key

The private key is the same wallet private key used to create the channel. Store it securely:

```bash
PUSH_CHANNEL_PRIVATE_KEY="your-channel-wallet-private-key"
```

## Step 5: Environment Variables

Create `.env.local` with all required variables:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PUBLIC_PRIVY_CLIENT_ID="your-privy-client-id"

# Database
DATABASE_URL="postgresql://..."

# Ethereum
NEXT_PUBLIC_ETHEREUM_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY"
NEXT_PUBLIC_FACTORY_ADDRESS="0xYourFactoryAddress"

# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYourChannelAddress"
PUSH_CHANNEL_PRIVATE_KEY="your-channel-private-key"
NEXT_PUBLIC_PUSH_ENV="staging"

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

## Step 6: Build and Test Locally

```bash
# Install dependencies
pnpm install

# Build the app
pnpm build

# Start production server locally
pnpm start
```

Test all functionality:

- [ ] User can login with Privy
- [ ] Wallet is created automatically
- [ ] Can create piggy bank
- [ ] Can deposit funds
- [ ] Can request withdrawal
- [ ] Can approve withdrawal
- [ ] Notifications work
- [ ] Chat works

## Step 7: Deploy to Vercel

### Configure Vercel Project

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Set Environment Variables in Vercel

```bash
# Set all environment variables
vercel env add NEXT_PUBLIC_PRIVY_APP_ID
vercel env add NEXT_PUBLIC_PRIVY_CLIENT_ID
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_ETHEREUM_RPC_URL
vercel env add NEXT_PUBLIC_FACTORY_ADDRESS
vercel env add NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS
vercel env add PUSH_CHANNEL_PRIVATE_KEY
vercel env add NEXT_PUBLIC_PUSH_ENV
vercel env add NEXT_PUBLIC_APP_URL
```

Or add them via Vercel Dashboard:

1. Go to project settings
2. Navigate to "Environment Variables"
3. Add all variables for Production, Preview, and Development

### Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

## Step 8: Configure Privy for Production

1. Go to https://dashboard.privy.io
2. Select your app
3. Go to Settings → Allowed domains
4. Add your Vercel domain: `https://your-app.vercel.app`
5. Configure redirect URLs
6. Update Ethereum network settings

## Step 9: Post-Deployment Testing

### Test on Production

- [ ] Visit your production URL
- [ ] Test login flow
- [ ] Create a test piggy bank
- [ ] Make a small deposit (0.001 ETH)
- [ ] Request and approve withdrawal
- [ ] Check database for records
- [ ] Verify notifications sent
- [ ] Test chat functionality

### Monitor Errors

```bash
# View Vercel logs
vercel logs

# Or check Vercel dashboard for errors
```

## Step 10: Security Considerations

### Secure Environment Variables

- [ ] Never commit `.env` files
- [ ] Use Vercel environment variables
- [ ] Rotate keys regularly
- [ ] Use different keys for dev/prod

### Smart Contract Security

- [ ] Audit smart contracts
- [ ] Test on testnet thoroughly
- [ ] Use multi-sig for factory owner
- [ ] Monitor contract activity

### API Security

- [ ] Verify Privy JWT tokens
- [ ] Rate limit API endpoints
- [ ] Validate all inputs
- [ ] Use HTTPS only

## Step 11: Monitoring & Analytics

### Setup Monitoring

```bash
# Install Sentry (optional)
pnpm add @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

### Monitor Smart Contracts

Use services like:

- Tenderly for transaction monitoring
- OpenZeppelin Defender for security
- Etherscan for contract verification

### Database Monitoring

- Use Vercel Postgres Analytics
- Monitor query performance
- Set up alerts for errors

## Step 12: Backup Strategy

### Database Backups

```bash
# Backup database (if using Railway/Supabase)
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Contract Backups

- Keep deployment scripts in git
- Save all deployed addresses
- Document contract versions

## Troubleshooting

### Common Issues

**Database Connection Fails**

```bash
# Check DATABASE_URL format
# For Vercel, use connection pooling URL
DATABASE_URL="postgres://user:pass@host/db?pgbouncer=true"
```

**Transaction Fails**

- Check wallet has enough ETH
- Verify contract address is correct
- Check gas limit settings
- Ensure RPC URL is working

**Push Notifications Not Working**

- Verify channel is created
- Check private key is correct
- Ensure users are subscribed
- Check Push Protocol status

**Privy Authentication Fails**

- Verify app ID and client ID
- Check allowed domains
- Ensure redirect URLs are correct

## Production Checklist

- [ ] Smart contracts deployed and verified
- [ ] Database running and migrated
- [ ] All environment variables set
- [ ] Privy configured for production domain
- [ ] Push Protocol channel created
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained on maintenance

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check error logs
   - Monitor gas prices
   - Review database performance

2. **Monthly**
   - Update dependencies
   - Review security alerts
   - Backup database

3. **Quarterly**
   - Smart contract audit
   - Performance review
   - User feedback analysis

## Scaling Considerations

### When to Scale

- More than 1000 active users
- Database queries slow (>500ms)
- High transaction volume
- Need for multiple chains

### How to Scale

1. **Database**
   - Add read replicas
   - Implement caching (Redis)
   - Optimize queries

2. **API**
   - Use API routes caching
   - Implement rate limiting
   - Add CDN for static assets

3. **Smart Contracts**
   - Deploy factory on multiple chains
   - Optimize gas usage
   - Implement batching

## Support & Resources

- **Privy Docs**: https://docs.privy.io
- **Push Protocol Docs**: https://docs.push.org
- **Viem Docs**: https://viem.sh
- **Foundry Book**: https://book.getfoundry.sh
- **Vercel Docs**: https://vercel.com/docs

## Next Steps

- ✅ Application deployed to production
- ✅ All systems tested and monitored
- ✅ Backup strategy in place
- 🎉 Ready for users!
