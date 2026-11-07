import { Link } from "react-router-dom";
import type { ButtonProps } from "./button.types";
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  type = "button",
  disabled = false,
  className = "",
  onClick
}: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", className]
    .filter(Boolean)
    .join(" ");

  if (to && !disabled) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
