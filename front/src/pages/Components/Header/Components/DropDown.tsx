import { useState } from "react";
import { Link } from "react-router-dom";

export default function Dropdown({ title, items }: any) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`dropdown ${open ? "active" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a className="dropdown-title">{title}</a>

      <ul className="submenu-nav">
        {items.map((item: any, i: number) => (
          <li key={i}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  );
}