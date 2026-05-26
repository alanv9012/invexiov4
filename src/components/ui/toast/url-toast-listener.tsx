"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast/toast-context";

function decodeMessage(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function UrlToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const key = `${pathname}:${error ?? ""}:${message ?? ""}`;

    if (!error && !message) {
      handledKey.current = null;
      return;
    }

    if (handledKey.current === key) return;
    handledKey.current = key;

    if (error) {
      toast.error({
        message: decodeMessage(error) ?? "Something went wrong. Please try again."
      });
    } else if (message) {
      toast.success({
        message: decodeMessage(message) ?? "Completed successfully."
      });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("error");
    nextParams.delete("message");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}
