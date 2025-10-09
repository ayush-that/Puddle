# Stage 6: Contract Interaction Hooks

## Overview

This guide covers creating React hooks for interacting with the PiggyBank smart contracts using viem and Privy embedded wallets.

## Prerequisites

- Privy wallet integration
- Smart contracts deployed
- viem installed (`viem` is already in package.json)

## Step 1: Create Contract Configuration

Create `src/contracts/config.ts`:

```typescript
import { PiggyBankABI, PiggyBankFactoryABI } from "./types";

export const SEPOLIA_CHAIN_ID = 11155111;

export const PIGGY_BANK_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

export const contracts = {
  factory: {
    address: PIGGY_BANK_FACTORY_ADDRESS,
    abi: PiggyBankFactoryABI,
  },
  piggyBank: {
    abi: PiggyBankABI,
  },
} as const;

export const sepoliaChain = {
  id: SEPOLIA_CHAIN_ID,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Sepolia ETH",
    symbol: "SEP",
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL!] },
    public: { http: ["https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
};
```

## Step 2: Create Base Contract Hook

Create `src/hooks/useContract.ts`:

```typescript
import { usePrivy } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  PublicClient,
  createPublicClient,
  http,
} from "viem";
import { sepolia } from "viem/chains";

export function useContract() {
  const { user } = usePrivy();

  const getWalletClient = async () => {
    if (!user?.wallet) {
      throw new Error("No wallet connected");
    }

    const provider = await user.wallet.getEthersProvider();
    const signer = provider.getSigner();

    const walletClient = createWalletClient({
      account: user.wallet.address as `0x${string}`,
      chain: sepolia,
      transport: custom({
        async request({ method, params }) {
          return await signer.provider.send(method, params || []);
        },
      }),
    });

    return walletClient;
  };

  const getPublicClient = (): PublicClient => {
    return createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
    });
  };

  return {
    getWalletClient,
    getPublicClient,
    address: user?.wallet?.address as `0x${string}` | undefined,
  };
}
```

## Step 3: Create PiggyBank Factory Hook

Create `src/hooks/usePiggyBankFactory.ts`:

```typescript
import { useState } from "react";
import { useContract } from "./useContract";
import { contracts } from "@/contracts/config";
import { parseEther } from "viem";

export function usePiggyBankFactory() {
  const { getWalletClient, getPublicClient } = useContract();
  const [isCreating, setIsCreating] = useState(false);

  const createPiggyBank = async (
    partner1: `0x${string}`,
    partner2: `0x${string}`,
    goalAmount: string,
    goalDeadline: number,
  ): Promise<`0x${string}`> => {
    setIsCreating(true);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      // Call factory contract to create piggy bank
      const { request } = await publicClient.simulateContract({
        address: contracts.factory.address,
        abi: contracts.factory.abi,
        functionName: "createPiggyBank",
        args: [
          partner1,
          partner2,
          parseEther(goalAmount),
          BigInt(goalDeadline),
        ],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Get the created piggy bank address from logs
      const log = receipt.logs[0];
      const piggyBankAddress =
        `0x${log.topics[1]?.slice(-40)}` as `0x${string}`;

      return piggyBankAddress;
    } catch (error) {
      console.error("Failed to create piggy bank:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const getUserPiggyBanks = async (
    userAddress: `0x${string}`,
  ): Promise<`0x${string}`[]> => {
    const publicClient = getPublicClient();

    const piggyBanks = await publicClient.readContract({
      address: contracts.factory.address,
      abi: contracts.factory.abi,
      functionName: "getUserPiggyBanks",
      args: [userAddress],
    });

    return piggyBanks as `0x${string}`[];
  };

  return {
    createPiggyBank,
    getUserPiggyBanks,
    isCreating,
  };
}
```

## Step 4: Create PiggyBank Hook

Create `src/hooks/usePiggyBank.ts`:

```typescript
import { useState, useEffect } from "react";
import { useContract } from "./useContract";
import { contracts } from "@/contracts/config";

export function usePiggyBank(contractAddress: `0x${string}`) {
  const { getPublicClient, address } = useContract();
  const [piggyBankData, setPiggyBankData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractAddress) return;

    const fetchPiggyBankData = async () => {
      const publicClient = getPublicClient();

      try {
        const [
          partner1,
          partner2,
          goalAmount,
          balance,
          contribution,
          goalProgress,
          isGoalReached,
        ] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "partner1",
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "partner2",
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "goalAmount",
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "getBalance",
          }),
          address
            ? publicClient.readContract({
                address: contractAddress,
                abi: contracts.piggyBank.abi,
                functionName: "getContribution",
                args: [address],
              })
            : Promise.resolve(0n),
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "getGoalProgress",
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: contracts.piggyBank.abi,
            functionName: "isGoalReached",
          }),
        ]);

        setPiggyBankData({
          partner1,
          partner2,
          goalAmount,
          balance,
          contribution,
          goalProgress,
          isGoalReached,
        });
      } catch (error) {
        console.error("Failed to fetch piggy bank data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPiggyBankData();

    // Poll every 10 seconds for updates
    const interval = setInterval(fetchPiggyBankData, 10000);
    return () => clearInterval(interval);
  }, [contractAddress, address]);

  return {
    piggyBankData,
    loading,
  };
}

export function useCreatePiggyBank() {
  const { getWalletClient, address } = useContract();
  const [isCreating, setIsCreating] = useState(false);

  const createPiggyBank = async (
    partnerAddress: `0x${string}`,
    goalAmount: string,
    goalDeadline: number,
  ): Promise<`0x${string}`> => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    setIsCreating(true);

    try {
      const walletClient = await getWalletClient();
      const publicClient = walletClient.transport;

      const { request } = await publicClient.simulateContract({
        address: contracts.factory.address,
        abi: contracts.factory.abi,
        functionName: "createPiggyBank",
        args: [
          address,
          partnerAddress,
          parseEther(goalAmount),
          BigInt(goalDeadline),
        ],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Extract piggy bank address from event logs
      const log = receipt.logs.find(
        (log) => log.topics[0] === "0x...", // PiggyBankCreated event signature
      );

      const piggyBankAddress =
        `0x${log?.topics[1]?.slice(-40)}` as `0x${string}`;

      return piggyBankAddress;
    } catch (error) {
      console.error("Failed to create piggy bank:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createPiggyBank,
    isCreating,
  };
}
```

## Step 5: Create Deposit Hook

Create `src/hooks/useDeposit.ts`:

```typescript
import { useState } from "react";
import { useContract } from "./useContract";
import { usePrivy } from "@privy-io/react-auth";
import { contracts } from "@/contracts/config";
import { parseEther, formatEther } from "viem";
import { apiClient } from "@/lib/api-client";

export function useDeposit(contractAddress: `0x${string}`) {
  const { getWalletClient, getPublicClient, address } = useContract();
  const { getAccessToken } = usePrivy();
  const [isDepositing, setIsDepositing] = useState(false);

  const deposit = async (amount: string, piggyBankId: string) => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    setIsDepositing(true);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      // Call deposit function
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contracts.piggyBank.abi,
        functionName: "deposit",
        value: parseEther(amount),
        account: address,
      });

      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Record in database
      const token = await getAccessToken();
      await apiClient.recordDeposit(
        {
          contractAddress,
          amount,
          transactionHash: receipt.transactionHash,
        },
        token,
      );

      return receipt;
    } catch (error) {
      console.error("Deposit failed:", error);
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    deposit,
    isDepositing,
  };
}
```

## Step 6: Create Withdrawal Hook

Create `src/hooks/useWithdrawal.ts`:

```typescript
import { useState } from "react";
import { useContract } from "./useContract";
import { usePrivy } from "@privy-io/react-auth";
import { contracts } from "@/contracts/config";
import { parseEther } from "viem";
import { apiClient } from "@/lib/api-client";

export function useWithdrawal(contractAddress: `0x${string}`) {
  const { getWalletClient, getPublicClient, address } = useContract();
  const { getAccessToken } = usePrivy();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const requestWithdrawal = async (amount: string, piggyBankId: string) => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    setIsRequesting(true);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      // Call requestWithdrawal function
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contracts.piggyBank.abi,
        functionName: "requestWithdrawal",
        args: [parseEther(amount)],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Record in database
      const token = await getAccessToken();
      await apiClient.requestWithdrawal(
        {
          piggyBankId,
          amount,
        },
        token,
      );

      return receipt;
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    setIsApproving(true);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      // Call approveWithdrawal function
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contracts.piggyBank.abi,
        functionName: "approveWithdrawal",
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Update database
      const token = await getAccessToken();
      await apiClient.approveWithdrawal(withdrawalId, token);

      return receipt;
    } catch (error) {
      console.error("Withdrawal approval failed:", error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  const cancelWithdrawal = async () => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contracts.piggyBank.abi,
        functionName: "cancelWithdrawal",
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return receipt;
    } catch (error) {
      console.error("Withdrawal cancellation failed:", error);
      throw error;
    }
  };

  return {
    requestWithdrawal,
    approveWithdrawal,
    cancelWithdrawal,
    isRequesting,
    isApproving,
  };
}
```

## Step 7: Create Event Listener Hook

Create `src/hooks/useContractEvents.ts`:

```typescript
import { useEffect, useState } from "react";
import { useContract } from "./useContract";
import { contracts } from "@/contracts/config";

export function useContractEvents(contractAddress: `0x${string}`) {
  const { getPublicClient } = useContract();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!contractAddress) return;

    const publicClient = getPublicClient();

    // Listen for Deposit events
    const unwatchDeposit = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contracts.piggyBank.abi,
      eventName: "Deposit",
      onLogs: (logs) => {
        setEvents((prev) => [
          ...prev,
          ...logs.map((log) => ({ type: "Deposit", ...log })),
        ]);
      },
    });

    // Listen for WithdrawalRequested events
    const unwatchWithdrawalRequested = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contracts.piggyBank.abi,
      eventName: "WithdrawalRequested",
      onLogs: (logs) => {
        setEvents((prev) => [
          ...prev,
          ...logs.map((log) => ({ type: "WithdrawalRequested", ...log })),
        ]);
      },
    });

    // Listen for GoalReached events
    const unwatchGoalReached = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contracts.piggyBank.abi,
      eventName: "GoalReached",
      onLogs: (logs) => {
        setEvents((prev) => [
          ...prev,
          ...logs.map((log) => ({ type: "GoalReached", ...log })),
        ]);
      },
    });

    return () => {
      unwatchDeposit();
      unwatchWithdrawalRequested();
      unwatchGoalReached();
    };
  }, [contractAddress]);

  return { events };
}
```

## Step 8: Create Transaction Status Hook

Create `src/hooks/useTransactionStatus.ts`:

```typescript
import { useState, useEffect } from "react";
import { useContract } from "./useContract";

export function useTransactionStatus(hash?: `0x${string}`) {
  const { getPublicClient } = useContract();
  const [status, setStatus] = useState<"pending" | "success" | "error" | null>(
    null,
  );
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    if (!hash) return;

    const checkStatus = async () => {
      const publicClient = getPublicClient();

      try {
        setStatus("pending");
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash,
        });

        setReceipt(txReceipt);
        setStatus(txReceipt.status === "success" ? "success" : "error");
      } catch (error) {
        console.error("Transaction failed:", error);
        setStatus("error");
      }
    };

    checkStatus();
  }, [hash]);

  return {
    status,
    receipt,
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
  };
}
```

## Step 9: Create Utility Helpers

Create `src/lib/contract-utils.ts`:

```typescript
import { formatEther, parseEther } from "viem";

export function formatETH(value: bigint): string {
  return formatEther(value);
}

export function parseETH(value: string): bigint {
  return parseEther(value);
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getExplorerUrl(
  hash: string,
  type: "tx" | "address" = "tx",
): string {
  const baseUrl = "https://sepolia.etherscan.io";
  return type === "tx" ? `${baseUrl}/tx/${hash}` : `${baseUrl}/address/${hash}`;
}
```

## Usage Example

```typescript
'use client';

import { usePiggyBank } from '@/hooks/usePiggyBank';
import { useDeposit } from '@/hooks/useDeposit';

export function PiggyBankPage({ contractAddress }: { contractAddress: `0x${string}` }) {
  const { piggyBankData, loading } = usePiggyBank(contractAddress);
  const { deposit, isDepositing } = useDeposit(contractAddress);

  const handleDeposit = async () => {
    await deposit('0.1', 'piggy-bank-id');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Balance: {formatEther(piggyBankData.balance)} ETH</p>
      <p>Goal: {formatEther(piggyBankData.goalAmount)} ETH</p>
      <button onClick={handleDeposit} disabled={isDepositing}>
        {isDepositing ? 'Depositing...' : 'Deposit 0.1 ETH'}
      </button>
    </div>
  );
}
```

## Error Handling Best Practices

1. **Always wrap contract calls in try-catch**
2. **Provide user-friendly error messages**
3. **Handle insufficient funds gracefully**
4. **Show transaction status to users**
5. **Allow users to retry failed transactions**

## Next Steps

- ✅ Contract interaction hooks created
- ✅ Deposit and withdrawal logic implemented
- ✅ Event listeners set up
- ⏭️ Next: Testing & Deployment (Stage 7)
