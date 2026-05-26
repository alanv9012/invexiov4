"use client";

import { useCallback, useState } from "react";
import { CommandPalette } from "@/components/productivity/command-palette";
import { useKeyboardShortcut } from "@/lib/ui/use-keyboard-shortcut";

export function ProductivityShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const openPalette = useCallback((query = "") => {
    setPaletteQuery(query);
    setPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    setPaletteQuery("");
  }, []);

  useKeyboardShortcut(
    "k",
    () => {
      setPaletteOpen((isOpen) => {
        if (isOpen) {
          setPaletteQuery("");
          return false;
        }
        setPaletteQuery("");
        return true;
      });
    },
    { metaOrCtrl: true, allowInInput: false }
  );
  useKeyboardShortcut("p", () => openPalette(), { metaOrCtrl: true, shift: true, allowInInput: false });

  return (
    <CommandPalette open={paletteOpen} onClose={closePalette} initialQuery={paletteQuery} />
  );
}
