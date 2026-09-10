const fs = require("fs");
const path = require("path");
const root = String.raw`D:\2.PROGRAMACIÓN\5. FIERROTECH\1. WEB\1. POEX\poex2\front\src`;

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".css")) acc.push(p);
  }
  return acc;
}

const meta = {
  "styles/tokens.css": {
    title: "tokens.css — variables de marca y UI",
    map: [
      "Paleta de marca (--brand-*)",
      "Tipografías",
      "Neutros (fondos, bordes, textos)",
      "Semánticos (primary, success, danger, info)",
      "Layout helpers (radius, shadow, container)",
      "Compatibilidad con variables viejas"
    ],
    note: "Cambios globales de color/tipografía: empezar acá. Evitar hex sueltos en páginas."
  },
  "styles/base.css": {
    title: "base.css — reset y estilos globales del documento",
    map: ["Reset básico", "Tipografía body/headings", "Links", "Watermark global del sitio", "Utilidades globales"],
    note: "Afecta a todo el portal. Cuidado al tocar body::before (marca de agua)."
  },
  "index.css": {
    title: "index.css — entry CSS de Vite",
    map: ["Imports de tokens/base u hojas raíz"],
    note: "Archivo de entrada; casi no debe tener reglas visuales."
  },
  "App.css": {
    title: "App.css — estilos del shell de la app React",
    map: ["Contenedor App", "Utilidades residuales"],
    note: "Preferir CSS por página/módulo; esto es legacy o shell mínimo."
  },
  "layouts/MainLayout.css": {
    title: "MainLayout.css — layout público (header + main + footer)",
    map: ["Cascarón layout", "Main content"],
    note: "Envuelve páginas públicas."
  },
  "layouts/PrivateLayout.css": {
    title: "PrivateLayout.css — layout admin/empresa (nav privada)",
    map: ["Header privado", "Nav + badges", "Main content", "Footer privado", "Responsive"],
    note: "Usado por paneles admin y empresa."
  },
  "components/header/Header.css": {
    title: "Header.css — navbar pública",
    map: ["Barra superior", "Logo/brand", "Menú desktop", "Menú mobile", "Responsive"],
    note: "Navegación del sitio público."
  },
  "components/footer/Footer.css": {
    title: "Footer.css — pie de página público",
    map: ["Contenedor footer", "Columnas/links", "Responsive"],
    note: "Pie del sitio público."
  },
  "components/ui/button/Button.css": {
    title: "Button.css — botón UI reutilizable",
    map: ["Base", "Variantes", "Estados hover/disabled"],
    note: "Componente compartido de botón."
  },
  "pages/admin/Dashboard/AdminDashboardPage.css": {
    title: "AdminDashboardPage.css — panel inicio admin",
    map: ["Página/shell", "Header", "Grilla de módulos/cards", "Links CTA", "Responsive"],
    note: "Tarjetas de acceso a módulos admin."
  },
  "pages/admin/Applications/AdminApplicationsPage.css": {
    title: "AdminApplicationsPage.css — solicitudes de registro",
    map: ["Página/shell", "Filtros/header", "Lista/tabla", "Acciones aprobar/rechazar", "Estados", "Responsive"],
    note: "Gestión de applications pendientes."
  },
  "pages/admin/Profiles/AdminProfilesPage.css": {
    title: "AdminProfilesPage.css — perfiles de empresas (admin)",
    map: ["Página/shell", "Listado/filtros", "Formulario de ficha", "Visibilidad por campo", "Productos", "Uploads/imágenes", "Responsive"],
    note: "CSS grande: editar por secciones de formulario y listado."
  },
  "pages/admin/Communications/AdminCommunicationsPage.css": {
    title: "AdminCommunicationsPage.css — comunicaciones/plantillas",
    map: ["Página/shell", "Editor de plantillas", "Segmentación", "Preview", "Responsive"],
    note: "Mails y notificaciones internas."
  },
  "pages/admin/SpecialRequests/AdminSpecialRequestsPage.css": {
    title: "AdminSpecialRequestsPage.css — pedidos especiales / info requests",
    map: ["Página/shell", "Listado", "Detalle/estado", "Acciones", "Responsive"],
    note: "Solicitudes públicas de info/productos."
  },
  "pages/admin/InvestmentOpportunities/AdminInvestmentOpportunitiesPage.css": {
    title: "AdminInvestmentOpportunitiesPage.css — CRUD oportunidades (admin)",
    map: ["Página/shell", "Listado", "Formulario", "Consultas/inquiries", "Responsive"],
    note: "Admin del micrositio de inversión."
  },
  "pages/admin/Analytics/AdminAnalyticsPage.css": {
    title: "AdminAnalyticsPage.css — dashboard analítica",
    map: ["Página/shell", "Header + export CSV", "Chips meses", "KPIs", "Barras diarias", "Rankings", "Mensajes", "Responsive"],
    note: "Dashboard admin de visitas y export CSV."
  },
  "pages/auth/Login/LoginPage.css": {
    title: "LoginPage.css — inicio de sesión",
    map: ["Página/shell", "Card de login", "Formulario", "Feedback", "Responsive"],
    note: "Login admin/empresa."
  },
  "pages/auth/Register/RegisterPage.css": {
    title: "RegisterPage.css — solicitud de registro empresa",
    map: ["Página/shell", "Card/formulario", "Campos", "Feedback", "Responsive"],
    note: "Alta pública de solicitud de empresa."
  },
  "pages/company/Panel/CompanyPanelPage.css": {
    title: "CompanyPanelPage.css — panel privado empresa",
    map: ["Página/shell", "Resumen cuenta", "Edición de ficha", "Productos", "Estados", "Responsive"],
    note: "Área autenticada role=empresa."
  },
  "pages/public/Search/SearchPage.css": {
    title: "SearchPage.css — resultados búsqueda (empresas/productos)",
    map: ["Shell", "Header/buscador", "Filtros", "Feedback", "Grilla", "Tarjeta compartida", "Badges P.A.", "Responsive"],
    note: "Tarjetas empresa/producto: .search-result-card"
  },
  "pages/public/CompanyPublic/CompanyPublicPage.css": {
    title: "CompanyPublicPage.css — ficha pública empresa",
    map: ["Shell", "Feedback", "Tarjeta ficha", "Mapa", "P.A./multilinea", "Responsive"],
    note: "Ruta /empresas/:id"
  },
  "pages/public/Home/HomePage.css": {
    title: "HomePage.css — inicio / hero",
    map: ["Cascarón", "Hero fondo", "Buscador oscuro", "Responsive"],
    note: "Overrides de .search-* para hero."
  },
  "pages/public/Help/HelpPage.css": {
    title: "HelpPage.css — guía / ayuda",
    map: ["Shell", "TOC", "Secciones guía", "FAQ", "Placeholders imagen", "CTA", "Responsive"],
    note: "Ruta /ayuda"
  },
  "pages/public/Institutional/InstitutionalPage.css": {
    title: "InstitutionalPage.css — páginas institucionales",
    map: ["Shell", "Hero/header", "Contenido", "Cards/bloques", "Responsive"],
    note: "Quiénes somos, objetivos, organismos, contacto institucional."
  },
  "pages/public/IndustrialPark/IndustrialParkPage.css": {
    title: "IndustrialParkPage.css — parque industrial",
    map: ["Shell", "Hero", "Contenido/bloques", "Responsive"],
    note: "Ruta /parque-industrial"
  },
  "pages/public/Sectors/SectorPage.css": {
    title: "SectorPage.css — páginas de sectores productivos",
    map: ["Shell", "Header", "Contenido", "Responsive"],
    note: "Agro, industria, creativas, tech."
  },
  "pages/public/TradeServices/TradeServicePage.css": {
    title: "TradeServicePage.css — servicios de comercio exterior",
    map: ["Shell", "Header", "Contenido", "Responsive"],
    note: "Asistencia, certificaciones, normativas, logística, capacitación."
  },
  "pages/public/CommercialOpportunities/CommercialOpportunityPage.css": {
    title: "CommercialOpportunityPage.css — catálogo / formularios comerciales",
    map: ["Shell", "Header", "Contenido", "Responsive"],
    note: "Páginas cortas de oportunidades comerciales genéricas."
  },
  "pages/public/CommercialOpportunities/InvestmentOpportunitiesPage.css": {
    title: "InvestmentOpportunitiesPage.css — micrositio oportunidades de inversión (público)",
    map: ["Listado", "Cards de oportunidad", "Detalle", "Formulario consulta", "Responsive"],
    note: "Listado + detalle público de inversión."
  },
  "shared/components/ImageField/ImageField.css": {
    title: "ImageField.css — input/preview de imagen",
    map: ["Campo", "Preview", "Acciones"],
    note: "Usado en admin/empresa para logos e imágenes."
  },
  "shared/components/InfoRequestForm/InfoRequestForm.css": {
    title: "InfoRequestForm.css — solicitar información a admin",
    map: ["Card", "Form grid", "Feedback", "Compact mode"],
    note: "En búsqueda y ficha empresa."
  },
  "shared/components/SpecialRequestForm/SpecialRequestForm.css": {
    title: "SpecialRequestForm.css — pedido especial sin resultados",
    map: ["Card", "Form", "Feedback"],
    note: "Cuando la búsqueda no encuentra matches."
  },
  "shared/components/OsmLocationPicker/OsmLocationPicker.css": {
    title: "OsmLocationPicker.css — mapa Leaflet/OSM",
    map: ["Contenedor mapa", "Altura mínima"],
    note: "Picker y vista de coordenadas."
  }
};

function rel(p) {
  return path.relative(root, p).split(path.sep).join("/");
}

function stripLeadingDoc(css) {
  let s = css.replace(/^\uFEFF/, "");
  while (true) {
    const m = s.match(/^\s*\/\*[\s\S]*?\*\/\s*/);
    if (!m) break;
    const block = m[0];
    if (
      block.includes("====") ||
      block.includes("MAPA") ||
      block.includes("tokens.css") ||
      block.includes("HomePage") ||
      block.includes("—") ||
      block.length < 1200
    ) {
      s = s.slice(m[0].length);
      continue;
    }
    break;
  }
  return s.trimStart();
}

function stripLeadingSectionDividers(css) {
  // If body still starts with our previous full section maps, keep rules only after first real selector-ish content
  return css;
}

function buildHeader(relPath, info) {
  const title = (info && info.title) || path.basename(relPath) + " — estilos del módulo";
  const map = (info && info.map) || ["Revisar selectores del archivo"];
  const lines = [
    "/*",
    " * =============================================================================",
    " * " + title,
    " * Ruta: " + relPath,
    " * Tokens: styles/tokens.css",
    " * =============================================================================",
    " *",
    " * MAPA RÁPIDO PARA EDITAR A OJO",
    " * -----------------------------"
  ];
  map.forEach((item, idx) => {
    const text = /^\d+\./.test(item) ? item : idx + 1 + ". " + item;
    lines.push(" * " + text);
  });
  if (info && info.note) {
    lines.push(" *");
    lines.push(" * NOTA: " + info.note);
  }
  lines.push(" *");
  lines.push(" * Convención: preferir var(--...) de tokens.css; no hardcodear marca.");
  lines.push(" */");
  lines.push("");
  return lines.join("\n");
}

function annotateBody(css) {
  // Keep existing internal ==== section structure.
  if ((css.match(/={12,}/g) || []).length >= 3) return css;

  // Insert section comments before major first-class blocks by scanning lines.
  const lines = css.split(/\r?\n/);
  const out = [];
  let lastBucket = "";
  let mediaAnnotated = false;

  const bucketOf = (name) => {
    if (name.includes("header")) return "Header";
    if (name.includes("footer")) return "Footer";
    if (name.includes("nav")) return "Navegación";
    if (name.includes("hero")) return "Hero";
    if (name.includes("filter") || name.includes("search-box") || name.includes("search-form") || name.includes("search-input")) return "Buscador / filtros";
    if (name.includes("card") || name.includes("module")) return "Tarjetas / cards";
    if (name.includes("grid") || name.includes("list") || name.includes("table") || name.includes("rank")) return "Listados / grillas";
    if (name.includes("form") || name.includes("field") || name.includes("input") || name.includes("select") || name.includes("textarea")) return "Formularios";
    if (name.includes("btn") || name.includes("button") || name.includes("action") || name.includes("cta") || name.includes("link")) return "Acciones / botones";
    if (name.includes("alert") || name.includes("feedback") || name.includes("error") || name.includes("empty") || name.includes("success")) return "Feedback / mensajes";
    if (name.includes("badge") || name.includes("chip") || name.includes("tag") || name.includes("pa-")) return "Chips / badges";
    if (name.includes("map") || name.includes("leaflet") || name.includes("osm")) return "Mapa";
    if (name.includes("product")) return "Productos";
    if (name.includes("kpi") || name.includes("chart") || name.includes("bar")) return "KPIs / gráficos";
    if (name.includes("export")) return "Exportación";
    if (name.includes("shell") || name.includes("page") || name.endsWith("-page")) return "Página / shell";
    if (name.includes("modal")) return "Modal";
    return "";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith("@media")) {
      if (!mediaAnnotated) {
        out.push("");
        out.push("/* --- Responsive --- */");
        mediaAnnotated = true;
      }
      out.push(line);
      continue;
    }

    const m = t.match(/^\.([a-zA-Z0-9_-]+)/);
    if (m && t.includes("{")) {
      const bucket = bucketOf(m[1]);
      if (bucket && bucket !== lastBucket) {
        out.push("");
        out.push("/* --- " + bucket + " --- */");
        lastBucket = bucket;
      }
    }
    out.push(line);
  }

  // collapse multiple blank lines
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();
}

const files = walk(root);
let changed = 0;
const report = [];

for (const file of files) {
  const r = rel(file);
  const raw = fs.readFileSync(file, "utf8");
  const info = meta[r];
  let body = stripLeadingDoc(raw);
  body = stripLeadingSectionDividers(body);

  // If body already has detailed section maps (from prior manual work), keep body as-is
  // but still ensure single top header.
  const keepDetailed =
    body.includes("MAPA RÁPIDO PARA EDITAR A OJO") ||
    (body.match(/={12,}/g) || []).length >= 4;

  if (!keepDetailed) {
    body = annotateBody(body);
  }

  const header = buildHeader(r, info);
  const next = header + body.trimStart() + "\n";
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    report.push(r + (keepDetailed ? " (header+kept sections)" : " (header+annotated)"));
  }
}

console.log("CHANGED=" + changed);
console.log(report.join("\n"));
