"use client";

import { useEffect } from "react";

type KeyboardShortcutOptions = {
  enabled?: boolean;
  allowInInput?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions & { metaOrCtrl?: boolean; shift?: boolean } = {}
) {
  const { enabled = true, allowInInput = false, metaOrCtrl = false, shift = false } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) return;
      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey && metaOrCtrl) return;
      if (!allowInInput && isEditableTarget(event.target)) return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowInInput, enabled, handler, key, metaOrCtrl, shift]);
}

export function formatShortcut(keys: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent ?? navigator.platform);

  const parts = keys.toLowerCase().split("+").filter(Boolean);

  return parts
    .map((part) => {
      if (part === "mod") return isMac ? "⌘" : "Ctrl";
      if (part === "shift") return "⇧";
      if (part === "alt") return isMac ? "⌥" : "Alt";
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join(isMac ? "" : "+");
}
