"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast/toast-context";
import { getAllowedUrlToast } from "@/components/ui/toast/url-toast-message";

export function UrlToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const allowedToast = getAllowedUrlToast(error, message);
    const key = `${pathname}:${error ?? ""}:${message ?? ""}`;

    if (!error && !message) {
      handledKey.current = null;
      return;
    }

    if (handledKey.current === key) return;
    handledKey.current = key;

    if (allowedToast?.variant === "error") {
      toast.error({
        message: allowedToast.message
      });
    } else if (allowedToast?.variant === "success") {
      toast.success({
        message: allowedToast.message
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
