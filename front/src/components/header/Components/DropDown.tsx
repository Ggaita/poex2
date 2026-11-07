import { useState } from "react";
import { Link } from "react-router-dom";

type DropdownItem = {
  label: string;
  to: string;
};

type DropdownProps = {
  title: string;
  /** Si se define, el título del menú navega a la página hub. */
  to?: string;
  items: DropdownItem[];
};

export default function Dropdown({ title, to, items }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`dropdown ${open ? "active" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {to ? (
        <Link to={to} className="dropdown-title">
          {title}
        </Link>
      ) : (
        <button type="button" className="dropdown-title" aria-expanded={open}>
          {title}
        </button>
      )}

      <ul className="submenu-nav">
        {items.map((item, i: number) => (
          <li key={i}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
