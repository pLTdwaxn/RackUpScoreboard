"use client";

import { ReactNode } from "react";

import { Toast } from "@heroui/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toast.Provider placement="top" />
      {children}
    </ThemeProvider>
  );
}
