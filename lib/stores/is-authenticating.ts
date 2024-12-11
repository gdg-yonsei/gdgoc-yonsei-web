import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface IsAuthenticatingState {
  isAuthenticating: boolean;
}

interface IsAuthenticatingAction {
  setIsAuthenticating: (value: boolean) => void;
  toggleIsAuthenticating: () => void;
}

export const useIsAuthenticating = create(
  devtools<IsAuthenticatingState & IsAuthenticatingAction>((set) => ({
    isAuthenticating: false,
    setIsAuthenticating: (value: boolean) =>
      set(() => ({ isAuthenticating: value })),
    toggleIsAuthenticating: () =>
      set((state) => ({ isAuthenticating: !state.isAuthenticating })),
  })),
);
