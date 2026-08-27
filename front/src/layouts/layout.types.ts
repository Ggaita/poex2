import type { ReactNode } from "react";

export type LayoutProps = {
  children: ReactNode;
};

export type NavItem = {
  to: string;
  label: string;
  badgeKey?: "applications" | "specialRequests";
};
