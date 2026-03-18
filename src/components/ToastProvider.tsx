"use client";
import React, { type ReactNode } from "react";
import { Toaster } from "sonner";

type Props = {
  children: ReactNode;
};

export function ToastProvider({ children }: Props) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" richColors />
    </>
  );
}