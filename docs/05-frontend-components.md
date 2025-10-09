# Stage 5: Frontend Components & Pages

## Overview

This guide covers building the frontend UI components and pages for the Onchain Piggy Bank platform using Next.js 15, React 19, and Tailwind CSS.

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── piggy-bank/
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── page.tsx (landing)
├── components/
│   ├── piggy-bank/
│   │   ├── piggy-bank-card.tsx
│   │   ├── piggy-bank-create-form.tsx
│   │   ├── piggy-bank-details.tsx
│   │   ├── deposit-form.tsx
│   │   ├── withdrawal-request.tsx
│   │   ├── withdrawal-approval.tsx
│   │   ├── goal-progress.tsx
│   │   ├── transaction-history.tsx
│   │   └── partner-invite.tsx
│   └── push/
│       ├── notification-bell.tsx
│       ├── chat-window.tsx
│       └── chat-message.tsx
└── hooks/
    ├── usePiggyBank.ts
    ├── useDeposit.ts
    └── useWithdrawal.ts
```

## Step 1: Update Privy Provider

Update `src/providers/providers.tsx`:

```typescript
"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          walletChainType: "ethereum-only",
          theme: "light",
          accentColor: "#3B82F6",
        },
        defaultChain: {
          id: 11155111, // Sepolia
          name: "Sepolia",
          network: "sepolia",
          nativeCurrency: {
            name: "Sepolia ETH",
            symbol: "SEP",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL!],
            },
            public: {
              http: ["https://rpc.sepolia.org"],
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

## Step 2: Create Dashboard Page

Create `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PiggyBankCard } from '@/components/piggy-bank/piggy-bank-card';
import { NotificationBell } from '@/components/push/notification-bell';

export default function Dashboard() {
  const { user, authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [piggyBanks, setPiggyBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!authenticated || !user) return;

    const loadPiggyBanks = async () => {
      try {
        const token = await getAccessToken();
        const data = await apiClient.getPiggyBanks(token);
        setPiggyBanks(data.piggyBanks);
      } catch (error) {
        console.error('Failed to load piggy banks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPiggyBanks();
  }, [authenticated, user, getAccessToken]);

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              💰 My Piggy Banks
            </h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={() => router.push('/piggy-bank/create')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                + Create New
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {piggyBanks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐷</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Piggy Banks Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first piggy bank and start saving with a partner!
            </p>
            <button
              onClick={() => router.push('/piggy-bank/create')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Your First Piggy Bank
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {piggyBanks.map((pb) => (
              <PiggyBankCard
                key={pb.piggyBank.id}
                piggyBank={pb.piggyBank}
                membership={pb.membership}
                onClick={() => router.push(`/piggy-bank/${pb.piggyBank.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

## Step 3: Create Piggy Bank Card Component

Create `src/components/piggy-bank/piggy-bank-card.tsx`:

```typescript
'use client';

interface PiggyBankCardProps {
  piggyBank: {
    id: string;
    name: string;
    goalAmount: string;
    currentAmount: string;
    status: string;
    goalDeadline: string | null;
  };
  membership: {
    role: string;
  };
  onClick: () => void;
}

export function PiggyBankCard({ piggyBank, membership, onClick }: PiggyBankCardProps) {
  const progress = (parseFloat(piggyBank.currentAmount) / parseFloat(piggyBank.goalAmount)) * 100;
  const daysLeft = piggyBank.goalDeadline
    ? Math.ceil((new Date(piggyBank.goalDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{piggyBank.name}</h3>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {membership.role}
          </span>
        </div>
        <p className="text-sm opacity-90">
          Goal: {piggyBank.goalAmount} ETH
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-blue-600">
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current</span>
            <span className="font-semibold">{piggyBank.currentAmount} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold">
              {(parseFloat(piggyBank.goalAmount) - parseFloat(piggyBank.currentAmount)).toFixed(4)} ETH
            </span>
          </div>
          {daysLeft !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time left</span>
              <span className="font-semibold">
                {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              piggyBank.status === 'active'
                ? 'bg-green-100 text-green-800'
                : piggyBank.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {piggyBank.status}
          </span>
        </div>
      </div>
    </div>
  );
}
```

## Step 4: Create Piggy Bank Creation Form

Create `src/app/piggy-bank/create/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { PiggyBankCreateForm } from '@/components/piggy-bank/piggy-bank-create-form';

export default function CreatePiggyBank() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Piggy Bank
          </h1>
          <p className="text-gray-600 mb-8">
            Start saving towards your goal with a partner
          </p>

          <PiggyBankCreateForm />
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/piggy-bank/piggy-bank-create-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useCreatePiggyBank } from '@/hooks/usePiggyBank';
import { apiClient } from '@/lib/api-client';

export function PiggyBankCreateForm() {
  const { user, getAccessToken } = usePrivy();
  const router = useRouter();
  const { createPiggyBank, isCreating } = useCreatePiggyBank();

  const [formData, setFormData] = useState({
    name: '',
    goalAmount: '',
    partnerAddress: '',
    goalDeadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Deploy smart contract and create piggy bank
      const contractAddress = await createPiggyBank(
        formData.partnerAddress as `0x${string}`,
        formData.goalAmount,
        formData.goalDeadline ? new Date(formData.goalDeadline).getTime() / 1000 : 0
      );

      // Save to database
      const token = await getAccessToken();
      const response = await apiClient.createPiggyBank(
        {
          name: formData.name,
          goalAmount: formData.goalAmount,
          goalDeadline: formData.goalDeadline || null,
          contractAddress,
        },
        token
      );

      router.push(`/piggy-bank/${response.piggyBank.id}`);
    } catch (error) {
      console.error('Failed to create piggy bank:', error);
      alert('Failed to create piggy bank. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Piggy Bank Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Vacation Fund"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Goal Amount (ETH)
        </label>
        <input
          type="number"
          step="0.0001"
          value={formData.goalAmount}
          onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
          placeholder="e.g., 1.5"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Partner Wallet Address
        </label>
        <input
          type="text"
          value={formData.partnerAddress}
          onChange={(e) => setFormData({ ...formData, partnerAddress: e.target.value })}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Goal Deadline (Optional)
        </label>
        <input
          type="date"
          value={formData.goalDeadline}
          onChange={(e) => setFormData({ ...formData, goalDeadline: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isCreating}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isCreating ? 'Creating...' : 'Create Piggy Bank'}
      </button>
    </form>
  );
}
```

## Step 5: Create Goal Progress Component

Create `src/components/piggy-bank/goal-progress.tsx`:

```typescript
'use client';

interface GoalProgressProps {
  currentAmount: string;
  goalAmount: string;
  goalDeadline?: string | null;
}

export function GoalProgress({ currentAmount, goalAmount, goalDeadline }: GoalProgressProps) {
  const current = parseFloat(currentAmount);
  const goal = parseFloat(goalAmount);
  const progress = (current / goal) * 100;

  const daysLeft = goalDeadline
    ? Math.ceil((new Date(goalDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Savings Progress</h2>

      {/* Progress Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</span>
            <span className="text-sm text-gray-500">Complete</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current</p>
          <p className="text-xl font-bold text-blue-600">{current.toFixed(4)} ETH</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Goal</p>
          <p className="text-xl font-bold text-purple-600">{goal.toFixed(4)} ETH</p>
        </div>
      </div>

      {daysLeft !== null && (
        <div className="mt-4 text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {daysLeft > 0 ? (
              <>
                <span className="font-semibold text-gray-900">{daysLeft}</span> days remaining
              </>
            ) : (
              <span className="font-semibold text-red-600">Deadline passed</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Step 6: Create Deposit Form Component

Create `src/components/piggy-bank/deposit-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useDeposit } from '@/hooks/useDeposit';

interface DepositFormProps {
  contractAddress: `0x${string}`;
  piggyBankId: string;
  onSuccess?: () => void;
}

export function DepositForm({ contractAddress, piggyBankId, onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const { deposit, isDepositing } = useDeposit(contractAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await deposit(amount, piggyBankId);
      setAmount('');
      onSuccess?.();
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Make a Deposit</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isDepositing || !amount}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isDepositing ? 'Depositing...' : 'Deposit'}
        </button>
      </form>
    </div>
  );
}
```

## Step 7: Create Transaction History Component

Create `src/components/piggy-bank/transaction-history.tsx`:

```typescript
'use client';

import { formatDistance } from 'date-fns';

interface Transaction {
  id: string;
  amount: string;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  transactionHash: string;
  createdAt: string;
  user: {
    walletAddress: string;
  };
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>

      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {tx.type === 'deposit' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatAddress(tx.user.walletAddress)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900">{tx.amount} ETH</p>
                <p className="text-xs text-gray-500">
                  {formatDistance(new Date(tx.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Step 8: Update Landing Page

Update `src/app/page.tsx`:

```typescript
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center text-white">
        <div className="text-8xl mb-8">🐷</div>

        <h1 className="text-5xl font-bold mb-4">
          Onchain Piggy Bank
        </h1>

        <p className="text-xl mb-8 opacity-90">
          Save together, achieve together. Create shared savings goals with your partner on the blockchain.
        </p>

        <button
          onClick={login}
          className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
        >
          Get Started
        </button>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="font-bold text-xl mb-2">Secure</h3>
            <p className="opacity-90">Your funds are secured by smart contracts on Ethereum</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="font-bold text-xl mb-2">Collaborative</h3>
            <p className="opacity-90">Both partners must approve withdrawals</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-bold text-xl mb-2">Goal-Oriented</h3>
            <p className="opacity-90">Set goals and track your progress together</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Next Steps

- ✅ Frontend components created
- ✅ Dashboard and pages built
- ✅ Forms and UI components ready
- ⏭️ Next: Contract Interaction Hooks (Stage 6)
