import type { ReactNode } from "react";

/** Contexto de páginas sin sesión (login vs inscripción). */
export type PrivateGuestContext = "login" | "register" | "generic";

export type LayoutProps = {
  children: ReactNode;
};

export type PrivateLayoutProps = LayoutProps & {
  /** Solo aplica cuando no hay sesión: textos de header/footer y atajos. */
  guestContext?: PrivateGuestContext;
};

export type NavItem = {
  to: string;
  label: string;
  badgeKey?: "applications" | "specialRequests" | "investmentInquiries";
};
