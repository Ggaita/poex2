import Header from "../pages/Components/Header/Header";
import Footer from "../pages/Components/Footer/Footer";

import "./MainLayout.css";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div className="layout">

      <Header />

      <main className="main-content">
        {children}
      </main>

      <Footer />

    </div>
  );
}