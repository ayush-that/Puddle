"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "./theme-provider";

// Suppress the Privy key prop warning in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes('Each child in a list should have a unique "key" prop')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Define Push Chain Testnet configuration
const pushChainTestnet = {
  id: 42101,
  name: "Push Chain Testnet",
  network: "push-testnet",
  nativeCurrency: {
    name: "Push Token",
    symbol: "PUSH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_PUSH_CHAIN_RPC_URL ||
          "https://evm.rpc-testnet-donut-node1.push.org/",
      ],
    },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          appearance: {
            walletChainType: "ethereum-only",
            theme: "light",
            accentColor: "#0052FF",
          },
          defaultChain: pushChainTestnet,
          supportedChains: [pushChainTestnet],
          loginMethods: ["email", "wallet", "google", "twitter"],
        }}
      >
        {children}
      </PrivyProvider>
    </ThemeProvider>
  );
}
