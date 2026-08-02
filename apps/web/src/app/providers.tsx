"use client";

import { ReactNode } from "react";

import { Toast } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n/client";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        <Toast.Provider placement="top" />
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
