"use client";

import { Suspense, type ReactNode } from "react";
import { ToastProvider, ToastViewport, UrlToastListener } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
      <Suspense fallback={null}>
        <UrlToastListener />
      </Suspense>
    </ToastProvider>
  );
}
