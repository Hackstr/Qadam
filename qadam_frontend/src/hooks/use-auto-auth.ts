"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { getNonce, verifySignature } from "@/lib/api";
import { toast } from "sonner";

/**
 * Auto-authenticate via SIWS (Sign In With Solana) when wallet connects.
 * Stores JWT in localStorage for API calls.
 */
export function useAutoAuth() {
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const { token, wallet, setAuth, clearAuth } = useAuthStore();
  const authAttempted = useRef(false);

  useEffect(() => {
    // Wallet disconnected → clear auth
    if (!connected) {
      if (token) clearAuth();
      authAttempted.current = false;
      return;
    }

    // Already authenticated with this wallet
    if (token && wallet === publicKey?.toBase58()) return;

    // Already attempted this session
    if (authAttempted.current) return;

    // No signMessage support (some wallets)
    if (!signMessage || !publicKey) return;

    authAttempted.current = true;

    (async () => {
      try {
        // 1. Get nonce from backend
        const { message } = await getNonce();

        // 2. Sign message with wallet
        const messageBytes = new TextEncoder().encode(message);
        const signature = await signMessage(messageBytes);

        // 3. Verify with backend → get JWT (signature must be base58)
        const { default: bs58 } = await import("bs58");
        const { token: jwt, wallet: walletAddr } = await verifySignature(
          publicKey.toBase58(),
          bs58.encode(signature),
          message
        );

        setAuth(jwt, walletAddr);
      } catch (err: any) {
        // User rejected signature — not an error
        if (err?.message?.includes("rejected") || err?.name === "WalletSignMessageError") {
          return;
        }
        console.error("Auth failed:", err);
      }
    })();
  }, [connected, publicKey, signMessage, token, wallet, setAuth, clearAuth]);
}
