"use client";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommerceProviders } from "./CartProvider";
import { CartSync } from "./CartSync";
import { ToastProvider } from "./ToastProvider";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CommerceProviders>
          <CartSync />
          {children}
        </CommerceProviders>
      </ToastProvider>
    </QueryClientProvider>
  );
}
