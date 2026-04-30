"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AskAiTrigger, AskAiPanel } from "./ask-ai-panel";

export function GlobalAiChat() {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);

  // Only show for connected wallets
  if (!connected) return null;

  return (
    <>
      {!open && <AskAiTrigger onClick={() => setOpen(true)} />}
      <AskAiPanel
        campaignId=""
        campaignTitle="Qadam AI Assistant"
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
