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

export function useWithdrawal() {
  const { user } = usePrivy();

  const approveWithdrawal = async (contractAddress: `0x${string}`) => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    const walletClient = await getWalletClient(user);
    const publicClient = getPublicClient();

    try {
      // 1. Simulate the contract call
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PiggyBankABI,
        functionName: "approveWithdrawal",
        account: walletClient.account,
      });

      // 2. Execute the approval
      const hash = await walletClient.writeContract(request);

      // 3. Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // 4. Return transaction hash
      return hash;
    } catch (error) {
      console.error("Withdrawal approval failed:", error);
      throw error;
    }
  };

  const cancelWithdrawal = async (contractAddress: `0x${string}`) => {
    if (!user?.wallet?.address) {
      throw new Error("No wallet connected");
    }

    const walletClient = await getWalletClient(user);
    const publicClient = getPublicClient();

    try {
      // 1. Simulate the contract call
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: PiggyBankABI,
        functionName: "cancelWithdrawal",
        account: walletClient.account,
      });

      // 2. Execute the cancellation
      const hash = await walletClient.writeContract(request);

      // 3. Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // 4. Return transaction hash
      return hash;
    } catch (error) {
      console.error("Withdrawal cancellation failed:", error);
      throw error;
    }
  };

  const getPendingWithdrawal = async (contractAddress: `0x${string}`) => {
    const publicClient = getPublicClient();

    try {
      const withdrawal = await publicClient.readContract({
        address: contractAddress,
        abi: PiggyBankABI,
        functionName: "getPendingWithdrawal",
      });

      return withdrawal;
    } catch (error) {
      console.error("Failed to get pending withdrawal:", error);
      return null;
    }
  };

  return {
    approveWithdrawal,
    cancelWithdrawal,
    getPendingWithdrawal,
  };
}
