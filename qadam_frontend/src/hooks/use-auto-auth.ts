"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { getNonce, verifySignature } from "@/lib/api";

/**
 * Auto-authenticate via SIWS (Sign In With Solana) when wallet connects.
 * Stores JWT in localStorage for API calls.
 *
 * IMPORTANT: Only triggers sign message ONCE per wallet connection.
 * If token exists in localStorage for this wallet — skips entirely.
 */
export function useAutoAuth() {
  const { connected, publicKey, signMessage } = useWallet();
  const { setAuth, clearAuth } = useAuthStore();
  const authInProgress = useRef(false);
  const wasEverConnected = useRef(false);

  useEffect(() => {
    // Track if wallet was ever connected in this session
    if (connected) wasEverConnected.current = true;

    // Not connected
    if (!connected || !publicKey) {
      // Only clear token on EXPLICIT disconnect (not page load)
      // On page load: connected starts false → then becomes true
      // We don't want to wipe token during that transition
      if (wasEverConnected.current) {
        clearAuth();
        wasEverConnected.current = false;
      }
      authInProgress.current = false;
      return;
    }

    const walletKey = publicKey.toBase58();

    // Check if we already have a valid token for THIS wallet
    const savedToken = localStorage.getItem("qadam_token");
    const savedWallet = localStorage.getItem("qadam_wallet");

    if (savedToken && savedWallet === walletKey) {
      // Token exists for this wallet — just ensure zustand is hydrated
      setAuth(savedToken, savedWallet);
      return;
    }

    // Prevent duplicate auth attempts
    if (authInProgress.current) return;
    if (!signMessage) return;

    authInProgress.current = true;

    (async () => {
      try {
        const { message } = await getNonce();
        const messageBytes = new TextEncoder().encode(message);
        const signature = await signMessage(messageBytes);

        const { default: bs58 } = await import("bs58");
        const { token: jwt, wallet: walletAddr } = await verifySignature(
          walletKey,
          bs58.encode(signature),
          message
        );

        setAuth(jwt, walletAddr);
      } catch (err: any) {
        if (err?.message?.includes("rejected") || err?.name === "WalletSignMessageError") {
          // User rejected — don't retry
          return;
        }
        console.error("Auth failed:", err);
      } finally {
        authInProgress.current = false;
      }
    })();
  }, [connected, publicKey?.toBase58()]); // Only re-run when connection or wallet changes
}
