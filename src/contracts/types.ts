import PiggyBankABI from "./PiggyBankABI.json";
import PiggyBankFactoryABI from "./PiggyBankFactoryABI.json";

export { PiggyBankABI, PiggyBankFactoryABI };

export const PIGGY_BANK_FACTORY_ADDRESS =
  "0x7E939AC65390E7a34e8E1b34B501D2D2a7FB2825" as `0x${string}`;

export type PiggyBankContract = {
  address: `0x${string}`;
  abi: typeof PiggyBankABI;
};
