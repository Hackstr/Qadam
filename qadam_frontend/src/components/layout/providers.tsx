"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { useAutoAuth } from "@/hooks/use-auto-auth";
import { useState } from "react";

function AuthLayer({ children }: { children: React.ReactNode }) {
  useAutoAuth();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AuthLayer>{children}</AuthLayer>
      </WalletProvider>
    </QueryClientProvider>
  );
}
