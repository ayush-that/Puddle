"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
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
            solana: {
              createOnLogin: "users-without-wallets",
            },
          },
          appearance: {
            walletChainType: "ethereum-and-solana",
            theme: "light",
            accentColor: "#0052FF",
          },
          externalWallets: {
            solana: { connectors: toSolanaWalletConnectors() },
          },
          loginMethods: ["email", "wallet", "google", "twitter"],
        }}
      >
        {children}
      </PrivyProvider>
    </ThemeProvider>
  );
}
