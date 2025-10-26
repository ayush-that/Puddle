import PiggyBankABI from "./PiggyBankABI.json";
import PiggyBankFactoryABI from "./PiggyBankFactoryABI.json";

export { PiggyBankABI, PiggyBankFactoryABI };

export const PUSH_CHAIN_TESTNET = {
  id: 42101,
  name: "Push Chain Testnet",
  network: "push-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Push Token",
    symbol: "PUSH",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_PUSH_CHAIN_RPC_URL ||
          "https://evm.rpc-testnet-donut-node1.push.org/",
      ],
    },
  },
  testnet: true,
} as const;

export const PIGGY_BANK_FACTORY_ADDRESS = (process.env
  .NEXT_PUBLIC_FACTORY_ADDRESS ||
  "0x0E2514e3aaF9a60cBD82B5e1f996d339AD16ead9") as `0x${string}`;

export type PiggyBankContract = {
  address: `0x${string}`;
  abi: typeof PiggyBankABI;
};
