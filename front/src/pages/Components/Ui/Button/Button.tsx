import { Link } from "react-router-dom";
import "./Button.css";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  to?: string;        // si es Link
  onClick?: () => void;
};

export default function Button({ children, variant = "primary", to, onClick }: ButtonProps) {
  const className = `btn btn-${variant}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}