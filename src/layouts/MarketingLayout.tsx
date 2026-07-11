import type { ReactNode } from "react";
import { Footer } from "../components/marketing/Footer";
import { NavBar } from "../components/marketing/NavBar";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <NavBar />
      {children}
      <Footer />
    </div>
  );
}

