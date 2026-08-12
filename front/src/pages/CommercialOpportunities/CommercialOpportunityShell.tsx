import type { ReactNode } from "react";
import MainLayout from "../../layouts/MainLayouts";
import "./CommercialOpportunityPage.css";

type CommercialOpportunityShellProps = {
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export default function CommercialOpportunityShell({
  title,
  subtitle,
  wide = false,
  children
}: CommercialOpportunityShellProps) {
  return (
    <MainLayout>
      <section className="commercial-page">
        <div className={`commercial-shell${wide ? " commercial-shell-wide" : ""}`}>
          <header className="commercial-header">
            <p>Oportunidades comerciales</p>
            <h1>{title}</h1>
            {subtitle ? <small>{subtitle}</small> : null}
          </header>
          {children}
        </div>
      </section>
    </MainLayout>
  );
}
