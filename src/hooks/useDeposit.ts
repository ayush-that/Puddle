"use client";

import { usePrivy } from "@privy-io/react-auth";
import { createWalletClient, createPublicClient, http, custom } from "viem";
import { PUSH_CHAIN_TESTNET } from "@/contracts/types";
import PiggyBankABI from "@/contracts/PiggyBankABI.json";

const getPublicClient = () => {
  return createPublicClient({
    chain: PUSH_CHAIN_TESTNET,
    transport: http(process.env.NEXT_PUBLIC_PUSH_CHAIN_RPC_URL),
  });
};

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

export function useDeposit() {
  const { user } = usePrivy();

  const deposit = async (
    contractAddress: `0x${string}`,
    amount: string,
  ): Promise<string> => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    try {
      const walletClient = await getWalletClient(user);
      const publicClient = getPublicClient();

      // Simulate the deposit transaction
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PiggyBankABI,
        functionName: "deposit",
        value: BigInt(parseFloat(amount) * 1e18),
        account: user.wallet.address as `0x${string}`,
      });

      // Execute the deposit
      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return hash;
    } catch (error) {
      console.error("Deposit failed:", error);
      throw error;
    }
  };

  return {
    deposit,
  };
}
