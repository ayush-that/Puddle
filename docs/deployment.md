# Deployment Guide - Onchain Piggy Bank Platform

## Overview

This guide covers the complete deployment process from development to production, including database setup, Push Protocol configuration, smart contracts, and Vercel deployment.

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass (see TESTING_GUIDE.md)
- [ ] No console errors in development
- [ ] Mobile responsive on real devices
- [ ] Smart contracts audited/reviewed
- [ ] Environment variables documented
- [ ] Database backup strategy in place
- [ ] Monitoring tools configured
- [ ] Git repository up to date

---

## Part 1: Production Database Setup

### Option A: Neon (Recommended)

**Steps**:

1. Go to https://neon.tech
2. Create account and new project
3. Name: "onchain-piggy-bank-prod"
4. Region: Choose closest to your users
5. Copy connection string

**Connection String Format**:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Option B: Supabase

**Steps**:

1. Go to https://supabase.com
2. Create new project
3. Name: "onchain-piggy-bank"
4. Copy database connection string from Settings → Database
5. Use "Connection Pooling" for better performance

### Option C: Railway

**Steps**:

1. Go to https://railway.app
2. New Project → Provision PostgreSQL
3. Copy DATABASE_URL from variables tab

### Run Migrations

```bash
# Set production database URL
export DATABASE_URL="your-production-db-url"

# Push schema to production
bun run db:push

# Verify tables created
bun run db:studio
# Open Drizzle Studio and check tables exist
```

### Database Backup Strategy

**Automated Backups**:

- Neon: Automatic daily backups (7-day retention on free tier)
- Supabase: Automatic daily backups
- Railway: Automated backups available

**Manual Backup**:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Part 2: Push Protocol Production Setup

### 2.1 Create Production Channel

**Prerequisites**:

- Mainnet wallet with funds
- 50 PUSH tokens (for channel creation)
- ETH for gas fees

**Get PUSH Tokens**:

1. Buy on Uniswap or other DEX
2. Need 50 PUSH for channel creation fee

**Create Channel**:

1. **Visit Push Production App**:
   - Go to https://app.push.org/dashboard
   - Connect your production wallet
   - Ensure wallet is on Ethereum Mainnet

2. **Navigate to Channel Creation**:
   - Click "Developers" in sidebar
   - Click "Create Channel"

3. **Fill Channel Details**:

   ```
   Channel Name: Puddle - Save Together
   Channel Logo: [Upload 128x128px PNG]
   Description: Get notified about deposits, withdrawals, and savings milestones in your shared piggy banks. Save money together with your partner using blockchain technology.
   Website URL: https://your-app.vercel.app
   Network: Ethereum Mainnet
   Channel Alias: Push Chain Mainnet
   ```

4. **Set Channel Alias**:
   - Click "Add Alias Network"
   - Select "Push Chain Mainnet"
   - Use same wallet address as alias
   - Confirm transactions

5. **Complete Transactions**:
   - Approve 50 PUSH tokens (Mainnet)
   - Create channel on Ethereum
   - Verify channel on Push Chain
   - Wait for confirmations

6. **Save Credentials**:

   ```bash
   # Channel address (your wallet address that created the channel)
   NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0x..."

   # Export private key from wallet (KEEP SECURE!)
   PUSH_CHANNEL_PRIVATE_KEY="0x..."
   ```

### 2.2 Test Channel

**Subscribe to Channel**:

1. Open https://app.push.org/channels
2. Search for your channel name
3. Subscribe with test wallet
4. Send test notification

**Verify Notifications**:

1. Check Push inbox: https://app.push.org/inbox
2. Notifications should appear within seconds

---

## Part 3: Smart Contract Deployment

### 3.1 Deploy to Push Chain Testnet (Current)

Already deployed at:

```
Factory Address: 0x0E2514e3aaF9a60cBD82B5e1f996d339AD16ead9
```

### 3.2 Deploy to Push Chain Mainnet (Production)

**Prerequisites**:

- PUSH tokens for gas fees on mainnet
- Wallet private key with funds

**Deployment Steps**:

1. **Update Environment Variables**:

   ```bash
   cd contracts
   cp .env.example .env

   # Edit .env:
   PUSH_MAINNET_RPC_URL="https://evm.rpc-mainnet-node1.push.org/"
   PRIVATE_KEY="your-deployer-private-key"
   ETHERSCAN_API_KEY="" # Optional for verification
   ```

2. **Update Foundry Config**:

   ```toml
   # foundry.toml
   [rpc_endpoints]
   push_mainnet = "${PUSH_MAINNET_RPC_URL}"
   ```

3. **Test Deployment (Dry Run)**:

   ```bash
   forge script script/Deploy.s.sol \
     --rpc-url push_mainnet \
     --slow
   ```

4. **Deploy to Mainnet**:

   ```bash
   forge script script/Deploy.s.sol \
     --rpc-url push_mainnet \
     --broadcast \
     --verify
   ```

5. **Save Factory Address**:

   ```bash
   # From deployment output:
   Factory deployed at: 0x...

   # Save for environment variables
   NEXT_PUBLIC_FACTORY_ADDRESS="0x..."
   ```

6. **Verify Contract (Optional)**:
   ```bash
   # If verification failed during deployment
   forge verify-contract \
     0xYourFactoryAddress \
     src/PiggyBankFactory.sol:PiggyBankFactory \
     --chain-id 42100 \
     --constructor-args $(cast abi-encode "constructor()")
   ```

### 3.3 Update Contract ABIs

If contract changes were made:

```bash
cd contracts
forge build

# Export ABIs
cat out/PiggyBank.sol/PiggyBank.json | jq '.abi' > ../src/contracts/PiggyBankABI.json
cat out/PiggyBankFactory.sol/PiggyBankFactory.json | jq '.abi' > ../src/contracts/PiggyBankFactoryABI.json
```

---

## Part 4: Vercel Deployment

### 4.1 Prepare Repository

**Commit All Changes**:

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

**Verify Build Locally**:

```bash
bun run build
bun start

# Test on http://localhost:3000
# Ensure no build errors
```

### 4.2 Create Vercel Project

1. **Visit Vercel**:
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Repository**:
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:

   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: bun run build
   Output Directory: .next
   Install Command: bun install
   ```

4. **Add Environment Variables** (see below)

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### 4.3 Environment Variables

**Required Variables** (Add in Vercel Dashboard → Settings → Environment Variables):

```bash
# Database
DATABASE_URL="postgresql://..."

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID="clxxxxx..."
NEXT_PUBLIC_PRIVY_CLIENT_ID="xxxxx"

# Push Chain Network
NEXT_PUBLIC_PUSH_CHAIN_RPC_URL="https://evm.rpc-mainnet-node1.push.org/"
NEXT_PUBLIC_CHAIN_ID="42100"

# Smart Contracts (Use mainnet addresses)
NEXT_PUBLIC_FACTORY_ADDRESS="0x..."

# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0x..."
PUSH_CHANNEL_PRIVATE_KEY="0x..."
NEXT_PUBLIC_PUSH_ENV="prod"

# Application
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

**Optional Variables**:

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_ID=""

# Error Tracking (Sentry)
SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
```

### 4.4 Configure Privy for Production

1. **Go to Privy Dashboard**:
   - https://dashboard.privy.io
   - Select your app

2. **Update Settings**:

   ```
   Allowed Origins:
   - https://your-app.vercel.app
   - https://*.vercel.app (for preview deployments)

   Redirect URIs:
   - https://your-app.vercel.app/auth/callback
   - https://your-app.vercel.app

   Supported Chains:
   - Push Chain Mainnet (42100)

   Wallet Settings:
   - Embedded Wallets: Enabled
   - Email Authentication: Enabled
   ```

3. **Copy Production Credentials**:
   - Copy App ID and Client ID
   - Add to Vercel environment variables

### 4.5 Custom Domain (Optional)

**Steps**:

1. **Buy Domain** (e.g., Namecheap, GoDaddy)

2. **Add to Vercel**:
   - Vercel Dashboard → Settings → Domains
   - Add your domain: `puddle.app`
   - Add www subdomain: `www.puddle.app`

3. **Configure DNS**:
   - Add A record: `@ → 76.76.21.21`
   - Add CNAME: `www → cname.vercel-dns.com`

4. **Enable HTTPS**:
   - Vercel automatically provisions SSL
   - Wait 24-48 hours for DNS propagation

---

## Part 5: Post-Deployment Verification

### 5.1 Production Smoke Tests

**Test on Production URL**:

1. **Homepage**:
   - [ ] Page loads without errors
   - [ ] Theme toggle works
   - [ ] Login button visible

2. **Authentication**:
   - [ ] Can connect wallet
   - [ ] Privy modal opens
   - [ ] Wallet connects successfully
   - [ ] Redirects to dashboard

3. **Create Piggy Bank**:
   - [ ] Form loads
   - [ ] Can submit form
   - [ ] Transaction confirms
   - [ ] Redirects to piggy bank page

4. **Deposit**:
   - [ ] Can make deposit
   - [ ] Balance updates
   - [ ] Transaction recorded

5. **Withdrawal**:
   - [ ] Can request withdrawal
   - [ ] Partner can approve
   - [ ] Funds transferred

6. **Notifications**:
   - [ ] Bell icon shows
   - [ ] Notifications received
   - [ ] Can subscribe to channel

7. **Chat**:
   - [ ] Chat window loads
   - [ ] Can send messages
   - [ ] Messages sync between partners

### 5.2 Mobile Testing

**Test on Real Devices**:

1. Open production URL on:
   - [ ] iPhone (Safari)
   - [ ] Android (Chrome)

2. Verify:
   - [ ] Layout responsive
   - [ ] Touch targets work
   - [ ] Wallet connection works
   - [ ] Forms submit correctly
   - [ ] No horizontal scroll

### 5.3 Performance Check

**Run Lighthouse Audit**:

```bash
# Use Chrome DevTools on production URL
# Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
```

### 5.4 Error Monitoring

**Check Vercel Logs**:

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Monitor for errors
4. Check "Functions" for API route logs

**Set Up Alerts**:

1. Vercel Dashboard → Settings → Notifications
2. Enable error notifications
3. Add email or Slack webhook

---

## Part 6: Monitoring & Maintenance

### 6.1 Set Up Monitoring

**Vercel Analytics** (Built-in):

- Automatically enabled
- View in Dashboard → Analytics
- Monitor page views, performance, visitors

**Sentry (Recommended for Error Tracking)**:

1. **Create Sentry Account**:
   - Go to https://sentry.io
   - Create new project (Next.js)

2. **Install Sentry**:

   ```bash
   bun add @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

3. **Configure**:
   - Follow wizard prompts
   - Add DSN to Vercel env vars

4. **Monitor Errors**:
   - Check Sentry dashboard for errors
   - Set up alerts for critical issues

### 6.2 Database Monitoring

**Check Connection Pooling**:

- Monitor active connections
- Ensure not hitting connection limits
- Use Neon/Supabase dashboard

**Query Performance**:

- Monitor slow queries
- Add indexes if needed
- Check database logs

### 6.3 Smart Contract Monitoring

**Block Explorer**:

- Push Chain Explorer: https://pushscan.io
- Monitor factory contract
- Track deployed piggy banks
- Verify transactions

**Event Monitoring** (Optional):

- Use The Graph for indexing
- Monitor Deposit/Withdrawal events
- Track goal completions

### 6.4 Cost Monitoring

**Vercel**:

- Free tier limits:
  - 100 GB bandwidth/month
  - 100 GB-hours serverless execution
  - 6,000 build minutes

**Database**:

- Neon free tier: 0.5 GB storage
- Monitor usage in dashboard
- Upgrade if needed

**Push Protocol**:

- Free for notifications
- Monitor channel usage
- Check quota limits

---

## Part 7: Backup & Recovery

### 7.1 Database Backups

**Automated** (via provider):

- Neon: Daily automated backups
- Supabase: Daily backups + point-in-time recovery
- Railway: Manual backups available

**Manual Backup Script**:

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3 or cloud storage
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

echo "Backup saved: $BACKUP_FILE"
```

### 7.2 Code Backups

**Git Repository**:

- Main code on GitHub
- All commits preserved
- Can roll back anytime

**Vercel Deployments**:

- Each deployment preserved
- Can roll back in dashboard
- Deployment history maintained

### 7.3 Recovery Procedures

**Database Recovery**:

```bash
# Restore from backup
psql $DATABASE_URL < backup_20250101.sql
```

**Code Rollback**:

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

**Smart Contract** (No rollback):

- Contracts immutable once deployed
- Deploy new version if needed
- Update factory address in app

---

## Part 8: Security Best Practices

### 8.1 Environment Variables

**Never Commit**:

- Private keys
- Database passwords
- API secrets
- Channel private keys

**Use Vercel Secrets**:

```bash
# Add sensitive vars as Vercel secrets
vercel env add PUSH_CHANNEL_PRIVATE_KEY production
```

### 8.2 API Security

**Rate Limiting** (Recommended):

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: Request) {
  const ip = request.headers.get("x-forwarded-for");
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }
}
```

### 8.3 Smart Contract Security

**Best Practices**:

- ✅ Reentrancy guards in place
- ✅ Access control implemented
- ✅ Events emitted for all state changes
- ✅ Input validation
- ✅ Safe math (built-in ^0.8.0)

**Consider Audit**:

- Use Slither for static analysis
- Consider professional audit for mainnet
- Test extensively on testnet first

---

## Part 9: Documentation

### Update README

```markdown
# Onchain Piggy Bank Platform

🔗 **Live App**: https://your-app.vercel.app
📜 **Smart Contracts**: https://pushscan.io/address/0x...
📚 **Documentation**: /docs

## Features

- Collaborative savings with multi-sig withdrawals
- Real-time notifications via Push Protocol
- Partner chat for coordination
- Mobile-first responsive design

## Tech Stack

- Next.js 15 + React 19
- Push Chain (blockchain)
- Push Protocol (notifications)
- Privy (wallet authentication)
- PostgreSQL + Drizzle ORM
```

### Create User Guide

See USER_GUIDE.md (create this file with):

- How to create account
- How to create piggy bank
- How to invite partner
- How to deposit
- How to withdraw
- How to use chat
- FAQ section

---

## Part 10: Launch Checklist

### Pre-Launch

- [ ] All tests passed
- [ ] Mobile tested on real devices
- [ ] Performance metrics met
- [ ] Security review completed
- [ ] Database migrated
- [ ] Smart contracts deployed
- [ ] Push channel created
- [ ] Vercel environment configured
- [ ] Privy configured for production
- [ ] Custom domain set up (optional)

### Launch Day

- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Monitor error logs
- [ ] Test with real users
- [ ] Check notification delivery
- [ ] Monitor transaction success rate
- [ ] Verify database connections

### Post-Launch

- [ ] Set up monitoring alerts
- [ ] Schedule daily health checks
- [ ] Monitor user feedback
- [ ] Track analytics
- [ ] Plan feature updates
- [ ] Engage with community

---

## Troubleshooting

### Build Fails on Vercel

**Issue**: "Module not found" or type errors

**Solution**:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Rebuild
bun run build
```

### Database Connection Failed

**Issue**: "Unable to connect to database"

**Solution**:

- Verify DATABASE_URL is correct
- Check SSL mode: `?sslmode=require`
- Verify database is accessible from Vercel IPs
- Check connection limit not exceeded

### Wallet Connection Fails

**Issue**: Users can't connect wallet

**Solution**:

- Verify Privy App ID and Client ID
- Check allowed origins in Privy dashboard
- Ensure network configuration correct
- Test with different wallet providers

### Notifications Not Received

**Issue**: Push notifications not working

**Solution**:

- Verify channel exists on Push Protocol
- Check PUSH_CHANNEL_PRIVATE_KEY is correct
- Ensure users subscribed to channel
- Verify Push environment (staging vs prod)
- Check notification logs in API

---

## Support

For deployment issues:

- Vercel Support: https://vercel.com/help
- Neon Support: https://neon.tech/docs
- Push Protocol: https://docs.push.org
- Privy Docs: https://docs.privy.io

---

## Next Steps

After successful deployment:

1. 📊 Monitor analytics and errors
2. 📱 Gather user feedback
3. 🐛 Fix bugs as reported
4. ✨ Plan feature updates
5. 📈 Optimize performance
6. 🎉 Celebrate launch!

---

**Deployment Status**: ⏳ Ready to Deploy

Once deployed, update this to:
**Deployment Status**: ✅ Live at https://your-app.vercel.app
