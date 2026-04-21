import { create } from "zustand";

interface AccountSetupStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAccountSetupStore = create<AccountSetupStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
