import type { ReactNode } from "react";
import MainLayout from "../../layouts/MainLayouts";
import "./SectorPage.css";

type SectorShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function SectorShell({
  title,
  subtitle,
  children
}: SectorShellProps) {
  return (
    <MainLayout>
      <section className="sector-page">
        <div className="sector-shell">
          <header className="sector-header">
            <p>Sectores económicos</p>
            <h1>{title}</h1>
            {subtitle ? <small>{subtitle}</small> : null}
          </header>
          {children}
        </div>
      </section>
    </MainLayout>
  );
}
