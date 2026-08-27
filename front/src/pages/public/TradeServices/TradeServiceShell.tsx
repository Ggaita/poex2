import type { ReactNode } from "react";
import MainLayout from "../../../layouts/MainLayouts";
import "./TradeServicePage.css";

type TradeServiceShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function TradeServiceShell({
  title,
  subtitle,
  children
}: TradeServiceShellProps) {
  return (
    <MainLayout>
      <section className="trade-service-page">
        <div className="trade-service-shell">
          <header className="trade-service-header">
            <p>Servicios de comercio exterior</p>
            <h1>{title}</h1>
            {subtitle ? <small>{subtitle}</small> : null}
          </header>
          {children}
        </div>
      </section>
    </MainLayout>
  );
}
