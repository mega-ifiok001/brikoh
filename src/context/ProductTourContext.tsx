import { createContext, useContext, useState, type ReactNode } from "react";

export type ProductTourMode = "closed" | "prompt" | "tour";

const ProductTourContext = createContext<{
  mode: ProductTourMode;
  setMode: (mode: ProductTourMode) => void;
  target: string | null;
  setTarget: (target: string | null) => void;
} | null>(null);

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProductTourMode>("closed");
  const [target, setTarget] = useState<string | null>(null);
  return <ProductTourContext.Provider value={{ mode, setMode, target, setTarget }}>{children}</ProductTourContext.Provider>;
}

export function useProductTour() {
  const context = useContext(ProductTourContext);
  if (!context) throw new Error("useProductTour must be used inside <ProductTourProvider>");
  return context;
}
