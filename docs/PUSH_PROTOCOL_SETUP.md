# Push Protocol Channel Setup Guide

## Overview

This guide walks you through creating a Push Protocol channel for the Puddle application to enable notifications and chat functionality.

## Prerequisites

- MetaMask or compatible Web3 wallet
- Sepolia ETH for gas fees
- 50 PUSH tokens (testnet version for staging)
- Push Chain testnet funds

## Part 1: Get Testnet Tokens

### 1.1 Get Sepolia ETH

**Option 1: Alchemy Faucet**

- Visit: https://sepoliafaucet.com/
- Connect wallet
- Request testnet ETH

**Option 2: Push Discord**

- Join: https://discord.gg/pushprotocol
- Ask admin for Sepolia ETH in #faucet channel

### 1.2 Get Sepolia PUSH Tokens

**Method: Mint from Contract**

1. Go to: https://sepolia.etherscan.io/token/0x37c779a1564DCc0e3914aB130e0e787d93e21804#writeContract
2. Connect your wallet
3. Find function #5: `mint`
4. Enter: `50000000000000000000` (50 PUSH with 18 decimals)
5. Click "Write" and confirm transaction

### 1.3 Get Push Chain Testnet Funds

**From Push Faucet**:

- Visit: https://faucet.push.org
- Or ask in Push Discord #faucet channel

---

## Part 2: Create Channel on Staging

### 2.1 Visit Push Staging dApp

1. Go to: https://staging.push.org/dashboard
2. Click "Connect Wallet"
3. Select MetaMask (or your wallet)
4. Approve connection

### 2.2 Navigate to Channel Creation

1. Click "Developers" in sidebar
2. Click "Create Channel"
3. You'll see the channel creation form

### 2.3 Fill Channel Details

**Required Information**:

1. **Channel Name**: `Puddle - Save Together`

2. **Channel Logo**:
   - Upload 128x128px PNG/JPG
   - Should be your app logo
   - Keep it simple and recognizable

3. **Channel Description** (250 characters max):

   ```
   Get notified when your partner deposits, requests withdrawals, or reaches savings milestones in your shared piggy bank.
   ```

4. **Website URL**:
   - For testing: `http://localhost:3000`
   - For production: `https://your-app.vercel.app`

5. **Network Selection**:
   - Select: **Ethereum Sepolia** (primary)
   - Toggle on: **Enable Multi-Chain**
   - Select secondary: **Push Chain Testnet**

6. **Channel Alias Address**:
   - When Push Chain Testnet is selected, you'll see "Alias Address" field
   - **Enter your same wallet address** (the one creating the channel)
   - This allows your channel to work on both Sepolia and Push Chain

### 2.4 Complete Transactions

You'll need to do **3 transactions**:

**Transaction 1: Approve PUSH Tokens**

- Purpose: Allow contract to spend 50 PUSH
- Cost: Small gas fee in Sepolia ETH
- Click "Approve" and confirm in wallet

**Transaction 2: Create Channel on Sepolia**

- Purpose: Deploy channel on Ethereum Sepolia
- Cost: 50 PUSH + gas fees
- Click "Create Channel" and confirm in wallet
- Wait for confirmation (may take 30-60 seconds)

**Transaction 3: Verify Channel on Push Chain**

- Purpose: Enable channel on Push Chain Testnet
- After channel creation, you'll see "Verify on Push Chain" button
- Switch network to Push Chain Testnet in MetaMask
- Click "Verify" and confirm transaction
- This links your Sepolia channel with Push Chain

### 2.5 Channel Creation Success

After all transactions complete:

- ✅ Channel is live on Sepolia
- ✅ Channel is verified on Push Chain
- ✅ You can now send notifications
- ✅ Users can subscribe to your channel

---

## Part 3: Get Channel Credentials

### 3.1 Find Your Channel Address

**Method 1: From dApp**

- After creation, you'll see your channel dashboard
- Channel address is displayed at the top
- Format: `0x...` (42 characters)

**Method 2: From URL**

- Your channel URL: `https://staging.push.org/channels/0x...`
- The last part after `/channels/` is your channel address

### 3.2 Get Channel Private Key

⚠️ **IMPORTANT: Keep this secret! Never commit to Git!**

**Your channel private key is your wallet private key**:

**From MetaMask**:

1. Click account icon → Account Details
2. Click "Export Private Key"
3. Enter MetaMask password
4. Copy the private key (starts with 0x)
5. **Store securely** - this is highly sensitive!

**Alternative**: Use a dedicated wallet for the channel

### 3.3 Add to Environment Variables

Create or update `.env.local`:

```bash
# Push Protocol Configuration
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYOUR_CHANNEL_ADDRESS_HERE"
PUSH_CHANNEL_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"
NEXT_PUBLIC_PUSH_ENV="staging"
```

**Security Notes**:

- ✅ `.env.local` is in `.gitignore` - never commit it
- ✅ Only `NEXT_PUBLIC_*` variables are exposed to browser
- ✅ `PUSH_CHANNEL_PRIVATE_KEY` is server-only
- ❌ NEVER put private key in client code
- ❌ NEVER commit private key to Git

---

## Part 4: Test Your Channel

### 4.1 Subscribe to Your Channel

**As a User**:

1. Stay on https://staging.push.org
2. Go to "Channels" tab
3. Search for your channel name: "Puddle"
4. Click "Subscribe" (opt-in)
5. Confirm transaction

### 4.2 Send Test Notification

**From Channel Dashboard**:

1. Go to your channel page
2. Click "Send Notification"
3. Fill in:
   - **Title**: "Test Notification"
   - **Body**: "Testing Push Protocol integration"
   - **Recipient**: Your wallet address (for testing)
4. Click "Send"
5. Confirm transaction

### 4.3 Verify Notification Received

**Check Inbox**:

1. Click "Inbox" in sidebar
2. You should see your test notification
3. Title and body should match what you sent

**Check in Your App**:

1. Start your dev server: `bun run dev`
2. Open http://localhost:3000
3. Login with same wallet
4. Look for NotificationBell (top right)
5. Should show badge with count
6. Click to see notifications

---

## Part 5: Production Setup

### 5.1 Create Production Channel

**When ready for mainnet**:

1. **Get Production Tokens**:
   - 50 PUSH tokens on Ethereum Mainnet
   - ETH for gas fees
   - PUSH tokens on Push Chain Mainnet

2. **Visit Production dApp**:
   - Go to: https://app.push.org/dashboard
   - **NOT** staging.push.org

3. **Create Channel** (same process as staging):
   - Use same name and details
   - Select: **Ethereum Mainnet** + **Push Chain Mainnet** (alias)
   - Complete 3 transactions (costs real PUSH + ETH)

4. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYOUR_PROD_CHANNEL_ADDRESS"
   PUSH_CHANNEL_PRIVATE_KEY="0xYOUR_PROD_PRIVATE_KEY"
   NEXT_PUBLIC_PUSH_ENV="prod"
   ```

---

## Part 6: Channel Management

### 6.1 Adding Delegates

**Delegates can send notifications on your behalf**:

1. Go to channel dashboard
2. Click three dots (⋮) → "Add Delegate"
3. Enter delegate wallet address
4. Confirm transaction
5. Delegate can now send notifications (but not modify channel)

**Use Case**: Backend server wallet as delegate

### 6.2 Channel Settings

**Customize notification preferences**:

- Boolean settings (on/off toggles)
- Slider settings (range values)
- Example: "Alert when balance > X"

**Implementation in code**: Already in `src/lib/push-protocol.ts`

### 6.3 Monitoring Channel

**From Dashboard**:

- View subscriber count
- See notification history
- Check analytics (if enabled)
- Monitor delegate activity

---

## Troubleshooting

### Issue: "Insufficient PUSH balance"

**Solution**:

- Check wallet has ≥ 50 PUSH tokens
- Mint more from testnet contract
- Ask in Discord for testnet tokens

### Issue: "Transaction failed" on channel creation

**Solutions**:

- Ensure you have Sepolia ETH for gas
- Check network is set to Sepolia in MetaMask
- Try again with higher gas limit
- Check Sepolia network status

### Issue: "Alias verification failed"

**Solutions**:

- Ensure same wallet address used for alias
- Switch to Push Chain Testnet in MetaMask
- Check you have PUSH tokens on Push Chain
- Verify RPC endpoint is correct

### Issue: Notifications not appearing in app

**Checks**:

- User subscribed to channel?
- Channel address correct in `.env.local`?
- Private key correct?
- PUSH_ENV set to "staging"?
- Notification sent to correct address format? (`eip155:42101:0x...`)

### Issue: "Channel not found"

**Solutions**:

- Wait 1-2 minutes after creation (indexing delay)
- Refresh dApp page
- Check transaction completed on Etherscan
- Verify on correct network (staging vs prod)

---

## Testing Checklist

Before using in production:

- [ ] Channel created successfully on staging
- [ ] Channel verified on Push Chain Testnet
- [ ] Environment variables set correctly
- [ ] Can subscribe to channel from dApp
- [ ] Test notification sent and received
- [ ] NotificationBell shows notifications
- [ ] Chat functionality works between two wallets
- [ ] Notifications sent on deposit
- [ ] Notifications sent on withdrawal request
- [ ] Notifications sent on withdrawal approval
- [ ] Milestone notifications work (25%, 50%, 75%, 100%)

---

## Important Notes

1. **Staging vs Production**:
   - Staging: Free testing, testnet tokens
   - Production: Costs real PUSH tokens (50 PUSH), mainnet

2. **Channel is Immutable**:
   - Channel alias cannot be changed later
   - Set it correctly during creation
   - Use same address for both networks

3. **Private Key Security**:
   - Never share your private key
   - Use environment variables
   - Consider using a dedicated wallet for channel
   - Rotate keys if compromised

4. **Rate Limits**:
   - Staging: May have rate limits
   - Production: Higher limits available
   - Be mindful of notification frequency

5. **Multi-Chain Support**:
   - Alias enables cross-chain notifications
   - Must verify on each chain
   - Each chain requires native gas tokens

---

## Resources

- **Push Protocol Docs**: https://docs.push.org
- **Staging dApp**: https://staging.push.org
- **Production dApp**: https://app.push.org
- **Discord Support**: https://discord.gg/pushprotocol
- **Faucet**: https://faucet.push.org
- **GitHub**: https://github.com/ethereum-push-notification-service

---

## Next Steps

After channel setup:

1. ✅ Test notification delivery
2. ✅ Test chat functionality
3. ✅ Integrate with your app flows
4. ✅ Test on mobile devices
5. ✅ Plan production deployment

**Your channel is now ready to power Web3 notifications for Puddle!** 🎉
