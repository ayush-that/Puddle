"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { createWalletClient, createPublicClient, http, custom } from "viem";
import { PUSH_CHAIN_TESTNET } from "@/contracts/types";

// Mock contract ABI - replace with actual ABI
const PIGGY_BANK_ABI = [
  {
    inputs: [
      { internalType: "address", name: "partner1", type: "address" },
      { internalType: "address", name: "partner2", type: "address" },
      { internalType: "uint256", name: "goalAmount", type: "uint256" },
      { internalType: "uint256", name: "goalDeadline", type: "uint256" },
    ],
    name: "createPiggyBank",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "requestWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "approveWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGoalProgress",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Shared functions for wallet and public clients
const getWalletClient = async (user: any) => {
  if (!user?.wallet) {
    throw new Error("No wallet connected");
  }

  const provider = await user.wallet.getEthereumProvider();

  return createWalletClient({
    account: user.wallet.address as `0x${string}`,
    chain: PUSH_CHAIN_TESTNET,
    transport: custom(provider),
  });
};

const getPublicClient = () => {
  return createPublicClient({
    chain: PUSH_CHAIN_TESTNET,
    transport: http(
      process.env.NEXT_PUBLIC_PUSH_CHAIN_RPC_URL ||
        "https://evm.rpc-testnet-donut-node1.push.org/",
    ),
  });
};

export function usePiggyBank(contractAddress?: `0x${string}`) {
  const { user } = usePrivy();
  const [piggyBankData, setPiggyBankData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractAddress) return;

    const fetchPiggyBankData = async () => {
      const publicClient = getPublicClient();

      try {
        const [balance, goalProgress] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: PIGGY_BANK_ABI,
            functionName: "getBalance",
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: PIGGY_BANK_ABI,
            functionName: "getGoalProgress",
          }),
        ]);

        setPiggyBankData({
          balance,
          goalProgress,
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
  }, [contractAddress]);

  return {
    piggyBankData,
    loading,
    getWalletClient: () => getWalletClient(user),
    getPublicClient,
  };
}

export function useCreatePiggyBank() {
  const { user } = usePrivy();
  const [isCreating, setIsCreating] = useState(false);

  const createPiggyBank = async (
    partnerAddress: `0x${string}`,
    goalAmount: string,
    goalDeadline: number,
  ): Promise<`0x${string}`> => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    setIsCreating(true);

    try {
      const walletClient = await getWalletClient(user);
      const publicClient = getPublicClient();

      // Use the deployed factory address
      const factoryAddress = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
        "0x0E2514e3aaF9a60cBD82B5e1f996d339AD16ead9") as `0x${string}`;

      const { request } = await publicClient.simulateContract({
        address: factoryAddress,
        abi: PIGGY_BANK_ABI,
        functionName: "createPiggyBank",
        args: [
          user.wallet.address as `0x${string}`,
          partnerAddress,
          BigInt(parseFloat(goalAmount) * 1e18),
          BigInt(goalDeadline),
        ],
        account: user.wallet.address as `0x${string}`,
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

export function useDeposit(contractAddress: `0x${string}`) {
  const { user } = usePrivy();
  const [isDepositing, setIsDepositing] = useState(false);

  const deposit = async (amount: string, piggyBankId: string) => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    setIsDepositing(true);

    try {
      const walletClient = await getWalletClient(user);
      const publicClient = getPublicClient();

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PIGGY_BANK_ABI,
        functionName: "deposit",
        value: BigInt(parseFloat(amount) * 1e18),
        account: user.wallet.address as `0x${string}`,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

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

export function useWithdrawal(contractAddress: `0x${string}`) {
  const { user } = usePrivy();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const requestWithdrawal = async (amount: string, piggyBankId: string) => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    setIsRequesting(true);

    try {
      const walletClient = await getWalletClient(user);
      const publicClient = getPublicClient();

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PIGGY_BANK_ABI,
        functionName: "requestWithdrawal",
        args: [BigInt(parseFloat(amount) * 1e18)],
        account: user.wallet.address as `0x${string}`,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return receipt;
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    setIsApproving(true);

    try {
      const walletClient = await getWalletClient(user);
      const publicClient = getPublicClient();

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PIGGY_BANK_ABI,
        functionName: "approveWithdrawal",
        account: user.wallet.address as `0x${string}`,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return receipt;
    } catch (error) {
      console.error("Withdrawal approval failed:", error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  return {
    requestWithdrawal,
    approveWithdrawal,
    isRequesting,
    isApproving,
  };
}
