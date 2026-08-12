import type { ReactNode } from "react";
import MainLayout from "../../layouts/MainLayouts";
import "./InstitutionalPage.css";

type InstitutionalShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export default function InstitutionalShell({
  eyebrow = "Institucional",
  title,
  subtitle,
  wide = false,
  children
}: InstitutionalShellProps) {
  return (
    <MainLayout>
      <section className="institutional-page">
        <div className={`institutional-shell${wide ? " institutional-shell-wide" : ""}`}>
          <header className="institutional-header">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            {subtitle ? <small>{subtitle}</small> : null}
          </header>
          {children}
        </div>
      </section>
    </MainLayout>
  );
}
