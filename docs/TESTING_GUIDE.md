# Testing Guide - Onchain Piggy Bank Platform

## Overview

This guide provides comprehensive testing procedures for all components of the Onchain Piggy Bank Platform before production deployment.

## Prerequisites

- Two wallet addresses for testing (partner wallets)
- Push Chain testnet tokens (PUSH)
- Access to Push Protocol staging channel
- Real mobile devices (iPhone and Android recommended)
- PostgreSQL database running

## Part 1: Smart Contract Testing

### Run Contract Tests

```bash
cd contracts
forge test -vvv
```

### Expected Results

All tests should pass:

- ✅ Deployment configuration
- ✅ Deposit from partners only
- ✅ Multiple deposits tracking
- ✅ Goal progress calculation
- ✅ Withdrawal request creation
- ✅ Multi-sig approval process
- ✅ Auto-execution after both approvals
- ✅ Withdrawal cancellation
- ✅ Unauthorized access prevention

### Test Specific Withdrawal Flow

```bash
forge test --match-test test_WithdrawalApprovalAndExecution -vvv
```

**Verify**:

- Partner 1 deposits funds
- Partner 1 requests withdrawal
- Partner 1 auto-approved
- Partner 2 approves
- Funds transferred automatically
- Balance updated correctly

### Gas Usage Report

```bash
forge test --gas-report
```

Review gas costs for all operations.

---

## Part 2: API Endpoint Testing

### Setup Test Environment

1. Start development server:

```bash
bun dev
```

2. Get authentication token:
   - Open http://localhost:3000
   - Login with test wallet
   - Open browser DevTools → Application → Local Storage
   - Copy `privy:token` value

### Test Script

Create `test-api.sh`:

```bash
#!/bin/bash

# Configuration
TOKEN="YOUR_PRIVY_JWT_TOKEN_HERE"
BASE_URL="http://localhost:3000/api"

echo "🧪 Testing API Endpoints"
echo "========================="

# Test 1: Get/Create User
echo -e "\n1️⃣ Testing GET /api/auth/user"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/auth/user" | jq '.'

# Test 2: Create Piggy Bank
echo -e "\n2️⃣ Testing POST /api/piggy-banks"
PIGGY_BANK=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Savings",
    "goalAmount": "1.0",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "goalDeadline": "2025-12-31T23:59:59Z"
  }' \
  "$BASE_URL/piggy-banks")
echo "$PIGGY_BANK" | jq '.'

PIGGY_BANK_ID=$(echo "$PIGGY_BANK" | jq -r '.piggyBank.id')

# Test 3: Get All Piggy Banks
echo -e "\n3️⃣ Testing GET /api/piggy-banks"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/piggy-banks" | jq '.'

# Test 4: Get Specific Piggy Bank
echo -e "\n4️⃣ Testing GET /api/piggy-banks/$PIGGY_BANK_ID"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/piggy-banks/$PIGGY_BANK_ID" | jq '.'

# Test 5: Invite Partner
echo -e "\n5️⃣ Testing POST /api/piggy-banks/$PIGGY_BANK_ID/invite"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerAddress": "0x9876543210987654321098765432109876543210"
  }' \
  "$BASE_URL/piggy-banks/$PIGGY_BANK_ID/invite" | jq '.'

# Test 6: Record Deposit
echo -e "\n6️⃣ Testing POST /api/deposits/record"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "amount": "0.5",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }' \
  "$BASE_URL/deposits/record" | jq '.'

# Test 7: Request Withdrawal
echo -e "\n7️⃣ Testing POST /api/withdrawals/request"
WITHDRAWAL=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"piggyBankId\": \"$PIGGY_BANK_ID\",
    \"amount\": \"0.2\"
  }" \
  "$BASE_URL/withdrawals/request")
echo "$WITHDRAWAL" | jq '.'

# Test 8: Subscribe to Push Notifications
echo -e "\n8️⃣ Testing POST /api/notifications/subscribe"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }' \
  "$BASE_URL/notifications/subscribe" | jq '.'

echo -e "\n✅ API Testing Complete!"
```

### Run Tests

```bash
chmod +x test-api.sh
./test-api.sh
```

### Expected Results

All endpoints should return successful responses:

- ✅ User created/retrieved
- ✅ Piggy bank created
- ✅ Piggy banks listed
- ✅ Specific piggy bank retrieved
- ✅ Partner invited
- ✅ Deposit recorded
- ✅ Withdrawal requested
- ✅ Push notification subscription

---

## Part 3: Frontend User Flow Testing

### Test Scenario 1: Create Piggy Bank

**Steps**:

1. Open http://localhost:3000
2. Click "Login" and connect Wallet A
3. Click "Create New Piggy Bank"
4. Fill form:
   - Name: "Vacation Fund"
   - Goal: "2.0 PUSH"
   - Partner Address: [Wallet B address]
   - Deadline: [Future date]
5. Click "Create"
6. Confirm transaction in wallet

**Expected Results**:

- ✅ Smart contract deployed
- ✅ Transaction confirmed
- ✅ Redirected to piggy bank page
- ✅ Database record created
- ✅ Partner B receives invitation notification
- ✅ Both partners show as members

### Test Scenario 2: Deposit Flow

**Steps**:

1. Login with Wallet A
2. Open "Vacation Fund" piggy bank
3. Go to "Deposit" tab
4. Enter amount: "0.5 PUSH"
5. Click "Deposit"
6. Confirm transaction

**Expected Results**:

- ✅ Transaction confirmed
- ✅ Balance updates to 0.5 PUSH
- ✅ Progress bar shows 25%
- ✅ Transaction appears in history
- ✅ Partner B receives deposit notification

### Test Scenario 3: Withdrawal Flow (CRITICAL)

**Steps**:

1. Login with Wallet A (initiator)
2. Open piggy bank
3. Go to "Withdraw" tab
4. Enter amount: "0.2 PUSH"
5. Click "Request Withdrawal"
6. Wait for confirmation
7. **Switch to Wallet B**
8. Login with Wallet B
9. Open same piggy bank
10. See "Withdrawal Approval" card
11. Click "Approve" button
12. Confirm transaction in wallet
13. Wait for execution

**Expected Results**:

- ✅ Withdrawal request created (Wallet A)
- ✅ Partner B receives notification
- ✅ Approval card shows pending status
- ✅ Wallet B can see approval request
- ✅ After approval, smart contract auto-executes
- ✅ Funds transferred to Wallet A
- ✅ Balance reduced by 0.2 PUSH
- ✅ UI shows "Executed" status
- ✅ Database updated (executed = true)
- ✅ Wallet A receives execution notification
- ✅ Transaction appears in history

### Test Scenario 4: Chat Functionality

**Steps**:

1. Login with Wallet A
2. Open piggy bank
3. Scroll to chat section
4. Type message: "Hey, let's start saving!"
5. Click send
6. **Switch to Wallet B**
7. Login with Wallet B
8. Open same piggy bank
9. See message from A
10. Reply: "Sounds great!"
11. **Back to Wallet A**
12. Wait 5 seconds (auto-refresh)
13. See reply from B

**Expected Results**:

- ✅ Messages sent successfully
- ✅ Messages appear for both partners
- ✅ Messages auto-refresh every 5 seconds
- ✅ Sender/recipient clearly identified
- ✅ Timestamps displayed correctly

### Test Scenario 5: Notifications

**Steps**:

1. Login with Wallet B
2. Check notification bell icon
3. Should have badge with count
4. Click bell icon
5. See all notifications
6. Click a notification
7. Navigate to relevant page

**Expected Results**:

- ✅ Bell shows unread count
- ✅ Dropdown displays notifications
- ✅ Notifications show correct content
- ✅ Timestamps are accurate
- ✅ Clicking navigates to correct page
- ✅ Notifications auto-refresh every 30 seconds

---

## Part 4: Mobile Device Testing

### Test Devices

**Minimum**:

- iPhone SE (320px width - smallest)
- iPhone 14 Pro Max (428px width - largest)
- Android device (any modern phone)

**How to Test**:

1. Deploy to Vercel preview
2. Open URL on mobile devices
3. Test all user flows

### Mobile Checklist

#### Layout & Responsiveness

- [ ] No horizontal scrolling
- [ ] All content fits viewport width
- [ ] Proper padding and margins
- [ ] Safe area insets work (notched devices)
- [ ] Header sticky at top
- [ ] Navigation accessible

#### Touch Interactions

- [ ] All buttons ≥ 44x44px
- [ ] Touch targets don't overlap
- [ ] Buttons have active states
- [ ] Swipe gestures work
- [ ] Long press handled correctly

#### Forms & Input

- [ ] Input fields ≥ 48px height
- [ ] Keyboard shows correct type (numeric for amounts)
- [ ] Input doesn't get hidden by keyboard
- [ ] Form validation works
- [ ] Auto-focus on first input
- [ ] No iOS zoom on input focus (16px font minimum)

#### Components

- [ ] NotificationBell dropdown fits screen
- [ ] ChatWindow scrolls properly
- [ ] Progress bars render correctly
- [ ] Toast notifications visible
- [ ] Modals/cards fit screen
- [ ] Transaction history readable

#### Performance

- [ ] Pages load < 2 seconds
- [ ] Smooth 60fps scrolling
- [ ] No layout shift on load
- [ ] Images load quickly
- [ ] Wallet connection fast

---

## Part 5: Error Scenario Testing

### Test Error Handling

#### Insufficient Balance

**Steps**: Try to deposit more than wallet balance
**Expected**: Error message "Insufficient balance in wallet"

#### Withdrawal Exceeds Balance

**Steps**: Try to withdraw more than piggy bank has
**Expected**: Error message "Withdrawal amount exceeds balance"

#### Invalid Partner Address

**Steps**: Enter invalid address when creating piggy bank
**Expected**: Error message "Invalid Ethereum address"

#### Network Disconnection

**Steps**: Disconnect internet, try to load page
**Expected**: Error message "Unable to connect. Check your internet."

#### Transaction Rejection

**Steps**: Reject transaction in wallet
**Expected**: Error message "Transaction rejected by user"

#### Expired Session

**Steps**: Wait for token expiration, make API call
**Expected**: Redirect to login page

#### Smart Contract Revert

**Steps**: Call contract function with invalid parameters
**Expected**: User-friendly error message (not raw revert)

### Error Handling Checklist

- [ ] All errors show user-friendly messages
- [ ] No app crashes or white screens
- [ ] Console shows detailed errors (for debugging)
- [ ] User can recover from errors
- [ ] Loading states reset after errors
- [ ] Toast notifications show errors

---

## Part 6: Performance Testing

### Metrics to Check

Use Lighthouse (Chrome DevTools):

```bash
# Mobile performance
npm run build
npm start
# Open Chrome DevTools → Lighthouse → Mobile → Analyze
```

### Target Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1
- **Speed Index**: < 3s
- **Total Blocking Time**: < 200ms

### Bundle Size

```bash
bun run build
# Check output for bundle sizes
```

**Targets**:

- Main bundle: < 200KB gzipped
- Page bundles: < 100KB gzipped each

---

## Part 7: Security Testing

### Security Checklist

- [ ] Private keys never in client code
- [ ] All API routes require authentication
- [ ] JWT tokens verified properly
- [ ] Database queries use parameterized statements
- [ ] No SQL injection vulnerabilities
- [ ] XSS prevention in place
- [ ] CORS configured correctly
- [ ] Rate limiting considered
- [ ] Input validation on all forms
- [ ] Smart contracts follow best practices
- [ ] No reentrancy vulnerabilities
- [ ] Events emitted for all state changes

### Manual Security Tests

1. **Unauthorized API Access**:

   ```bash
   curl http://localhost:3000/api/piggy-banks
   # Should return 401 Unauthorized
   ```

2. **Invalid Token**:

   ```bash
   curl -H "Authorization: Bearer invalid" http://localhost:3000/api/auth/user
   # Should return 401 Unauthorized
   ```

3. **SQL Injection Attempt**:
   - Try entering `' OR '1'='1` in form fields
   - Should be sanitized, not execute

4. **XSS Attempt**:
   - Try entering `<script>alert('xss')</script>` in name field
   - Should be escaped, not executed

---

## Part 8: Integration Testing

### End-to-End Flow

**Complete User Journey**:

1. ✅ User A creates account
2. ✅ User A deploys piggy bank
3. ✅ User A invites User B
4. ✅ User B receives notification
5. ✅ User B joins piggy bank
6. ✅ User A deposits 0.5 PUSH
7. ✅ User B receives deposit notification
8. ✅ User B sends chat message
9. ✅ User A sees chat message
10. ✅ User A deposits 0.3 PUSH (80% goal)
11. ✅ Both receive milestone notification
12. ✅ User B requests withdrawal of 0.2 PUSH
13. ✅ User A receives withdrawal request
14. ✅ User A approves withdrawal
15. ✅ Withdrawal auto-executes
16. ✅ User B receives funds
17. ✅ Both see updated balance

**Duration**: ~15 minutes
**Required**: Two real wallets, actual transactions

---

## Success Criteria

### All Tests Must Pass

- ✅ 100% smart contract tests pass
- ✅ All 8+ API endpoints work
- ✅ 5 user flow scenarios complete
- ✅ Mobile responsive on 3+ devices
- ✅ All error scenarios handled
- ✅ Performance metrics met
- ✅ Security checklist complete
- ✅ End-to-end flow successful

### Zero Critical Issues

- No console errors in production
- No wallet connection failures
- No transaction failures (except user rejection)
- No data loss
- No security vulnerabilities

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Fix all critical bugs
3. ✅ Re-test affected areas
4. ✅ Prepare production deployment
5. ✅ Set up monitoring and alerts
6. ✅ Create user documentation
7. ✅ Deploy to production

---

## Troubleshooting

### Common Issues

**Issue**: Smart contract tests fail
**Solution**: Run `forge clean && forge build` and try again

**Issue**: API returns 401 Unauthorized
**Solution**: Check if Privy token is valid and not expired

**Issue**: Notifications not received
**Solution**: Verify Push Protocol channel setup and env vars

**Issue**: Mobile layout broken
**Solution**: Check Tailwind responsive classes, test on real device

**Issue**: Wallet connection fails
**Solution**: Check Privy configuration, ensure correct network

---

## Contact

For issues or questions during testing:

- Check documentation in `/docs` folder
- Review error logs in browser console
- Check API logs in terminal
- Test on different devices/networks
