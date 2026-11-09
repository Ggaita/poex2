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
  onNavigate?: () => void;
};

export default function Dropdown({ title, to, items, onNavigate }: DropdownProps) {
  const [open, setOpen] = useState(false);

  const closeAndNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <li
      className={`dropdown${open ? " active" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="dropdown-title-row">
        {to ? (
          <Link to={to} className="dropdown-title" onClick={closeAndNavigate}>
            {title}
          </Link>
        ) : (
          <button
            type="button"
            className="dropdown-title"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {title}
          </button>
        )}

        {/* En mobile abre/cierra el submenú (acordeón). En desktop se oculta por CSS. */}
        <button
          type="button"
          className="dropdown-caret"
          aria-expanded={open}
          aria-label={open ? `Cerrar ${title}` : `Abrir ${title}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <ul className="submenu-nav">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link to={item.to} onClick={closeAndNavigate}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
