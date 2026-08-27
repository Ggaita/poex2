import { Link } from "react-router-dom";
import type { ButtonProps } from "./button.types";
import "./Button.css";

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