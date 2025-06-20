import React, { type ReactNode } from "react";

// ...lógica del provider si existe...

type Props = {
  children: ReactNode;
};

export function ToastProvider({ children }: Props) {
  return <>{children}</>;
}