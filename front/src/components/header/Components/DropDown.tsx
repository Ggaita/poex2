import { useState } from "react";
import { Link } from "react-router-dom";
type DropdownItem = {
  label: string;
  to: string;
};

type DropdownProps = {
  title: string;
  items: DropdownItem[];
};

export default function Dropdown({ title, items }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`dropdown ${open ? "active" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a className="dropdown-title">{title}</a>

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