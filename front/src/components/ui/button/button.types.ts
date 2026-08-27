import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  to?: string;
  onClick?: () => void;
};
