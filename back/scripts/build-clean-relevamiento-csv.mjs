import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, "..", "data", "base-completa.csv");
const outputPath = path.join(__dirname, "..", "data", "poex-empresas.csv");

const stripBom = (text) => text.replace(/^\uFEFF/, "");
const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text || text === "-" || /^n\/?a$/i.test(text)) return "";
  return text;
};

const cleanTaxId = (value) => {
  const text = cleanText(value);
  if (!text) return "";
  const digits = text.replace(/\D+/g, "");
  return digits || text;
};

const cleanEmail = (value) => {
  const text = cleanText(value);
  return text ? text.toLowerCase() : "";
};

const parseCsv = (filePath) => {
  const raw = stripBom(fs.readFileSync(filePath, "utf8"));
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
    row = [];
  };

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushField();
      continue;
    }
    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
};

const getField = (record, ...candidates) => {
  const entries = Object.entries(record);
  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const match = entries.find(([key]) => normalizeKey(key) === wanted);
    if (match) {
      const value = cleanText(match[1]);
      if (value) return value;
    }
  }
  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const match = entries.find(([key]) => normalizeKey(key).includes(wanted));
    if (match) {
      const value = cleanText(match[1]);
      if (value) return value;
    }
  }
  return "";
};

const extractNcmCodes = (value) => {
  const text = cleanText(value);
  if (!text) return [];
  const matches = text.match(/\b\d{4}(?:[.\s]?\d{2}){0,3}(?:[A-Za-z0-9]+)?\b/g) ?? [];
  return [
    ...new Set(
      matches
        .map((code) => code.replace(/\s+/g, "").toUpperCase())
        .filter((code) => /\d/.test(code))
    )
  ];
};

const formatNcmDisplay = (code) => {
  if (!code) return "";
  const digits = code.replace(/[^\d]/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  }
  if (digits.length === 6) return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`;
  if (digits.length === 4) return digits;
  return code;
};

const splitProductBlocks = (description) => {
  const text = cleanText(description);
  if (!text) return [];

  const labeled = [
    ...text.matchAll(
      /(\d{4}(?:[.\s]?\d{2}){0,3})\s*[:\-–]\s*([^0-9]+?)(?=(?:\d{4}(?:[.\s]?\d{2}){0,3}\s*[:\-–])|$)/g
    )
  ];
  if (labeled.length > 0) {
    return labeled
      .map((match) => ({
        tariffHint: match[1].replace(/\s+/g, ""),
        name: cleanText(match[2])
      }))
      .filter((item) => item.name);
  }

  const chunks = text
    .split(/\n+|;+|\s+\/\s+|\s+\|\s+/)
    .map((chunk) => cleanText(chunk))
    .filter(Boolean);

  if (chunks.length > 1) {
    return chunks.map((name) => ({ name, tariffHint: undefined }));
  }

  return [{ name: text, tariffHint: undefined }];
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const rows = parseCsv(inputPath);
const byTax = new Map();

for (const row of rows) {
  const legalName = getField(row, "Razón social", "Razon social") || "Empresa sin nombre";
  const tradeName = getField(row, "Nombre comercial / Marca");
  const taxId = cleanTaxId(getField(row, "CUIT/CUIL", "CUIT", "CUIL"));
  const groupKey = taxId || `name:${normalizeKey(legalName)}`;

  const contactName =
    getField(row, "Nombre y apellido del responsable comercial") || tradeName || legalName;
  const contactEmail =
    cleanEmail(getField(row, "Email de contacto comercial")) ||
    cleanEmail(getField(row, "Email corporativo")) ||
    cleanEmail(getField(row, "Dirección de correo electrónico", "Direccion de correo electronico"));
  const phone =
    getField(row, "Whatsapp de contacto para convocatorias y acciones comerciales") ||
    getField(row, "Teléfono corporativo", "Telefono corporativo");

  const sectorRaw = getField(row, "Sector / Rubro principal");
  const [sectorEs, sectorEn] = sectorRaw.split("/").map((part) => cleanText(part));
  const sector = sectorEs || sectorRaw;
  const subSector = sectorEn || "";

  const productDescription = getField(
    row,
    "Descripción del producto o servicio exportable",
    "Descripcion del producto o servicio exportable"
  );
  const exportCurrent = getField(
    row,
    "Mercados de destino a los que exportás (países)",
    "Mercados de destino a los que exportas (paises)"
  );
  const exportDesired = getField(
    row,
    "Mercados de destino desearías exportar (países)",
    "Mercados de destino desearías exportar (paises)"
  );
  const certifications = getField(row, "Certificaciones");
  const website = getField(row, "Sitio web");
  const facebook = getField(row, "Facebook");
  const instagram = getField(row, "Instagram");
  const linkedin = getField(row, "LinkedIn", "Linkedin");
  const logoUrl = getField(row, "Logo de la empresa (pegar link)");
  const address = getField(row, "Domicilio");
  const city = getField(row, "Localidad");
  const postalCode = getField(row, "Código Postal", "Codigo Postal");
  const experience = getField(row, "Experiencia exportadora");
  const chambers = getField(
    row,
    "Cámaras o asociaciones a las que pertenece",
    "Camaras o asociaciones a las que pertenece"
  );
  const authorization = getField(
    row,
    "Autorización expresa para publicar datos de la empresa en la web",
    "Autorizacion expresa para publicar datos de la empresa en la web"
  );

  const proposed = getField(row, "NCM propuesto (validado)");
  const originalLoaded = getField(row, "NCM original (cargado)");
  const position = getField(
    row,
    "Posición(es) Arancelaria(s) NCM / Código de Servicio",
    "Posicion(es) Arancelaria(s) NCM / Codigo de Servicio"
  );

  const ncmPool = [
    ...extractNcmCodes(proposed),
    ...extractNcmCodes(originalLoaded),
    ...extractNcmCodes(position),
    ...extractNcmCodes(productDescription)
  ].map(formatNcmDisplay);

  const productBlocks = splitProductBlocks(productDescription);
  const products = (productBlocks.length > 0 ? productBlocks : []).map((block, index) => {
    let tariff = block.tariffHint ? formatNcmDisplay(block.tariffHint) : "";
    if (!tariff && proposed) {
      const labeled = [...proposed.matchAll(/(\d{4}(?:[.\s]?\d{2}){0,3})\s*[:\-–]\s*([^0-9]+)/g)];
      if (labeled.length > 0) {
        const hint = normalizeKey(block.name);
        const match = labeled.find(
          (item) =>
            normalizeKey(item[2]).includes(hint) || hint.includes(normalizeKey(item[2]))
        );
        if (match) tariff = formatNcmDisplay(match[1]);
      }
    }
    if (!tariff) tariff = ncmPool[index] || ncmPool[0] || "";
    return {
      name: block.name.slice(0, 180),
      description: block.name,
      tariff_position: tariff
    };
  });

  // Descripción institucional limpia (NO mezcla producto/NCM/INCOTERM)
  const descriptionParts = [];
  if (tradeName && normalizeKey(tradeName) !== normalizeKey(legalName)) {
    descriptionParts.push(`Marca comercial: ${tradeName}.`);
  }
  if (experience) descriptionParts.push(`Experiencia exportadora: ${experience}.`);
  if (chambers) descriptionParts.push(`Cámaras/asociaciones: ${chambers}.`);
  if (sector) descriptionParts.push(`Rubro: ${sector}${subSector ? ` / ${subSector}` : ""}.`);
  const description = descriptionParts.join("\n");

  const exportDestinations = [exportCurrent, exportDesired ? `Interés: ${exportDesired}` : ""]
    .filter(Boolean)
    .join(" | ");

  const isPublished =
    !authorization || /si|sí|acepto|autorizo|ok|true|1/i.test(authorization) ? "true" : "false";

  const fullAddress = [address, postalCode ? `CP ${postalCode}` : "", city, "Chaco"]
    .filter(Boolean)
    .join(", ");

  if (!byTax.has(groupKey)) {
    byTax.set(groupKey, {
      company_name: legalName,
      trade_name: tradeName,
      tax_id: taxId,
      contact_name: contactName,
      contact_email: contactEmail,
      phone,
      description,
      sector,
      sub_sector: subSector,
      city,
      address: fullAddress || address,
      website,
      facebook,
      instagram,
      linkedin,
      logo_url: logoUrl,
      export_destinations: exportDestinations,
      certifications,
      is_published: isPublished,
      products: []
    });
  }

  const company = byTax.get(groupKey);
  // Prefer longer/cleaner institutional description
  if ((description || "").length > (company.description || "").length) {
    company.description = description;
  }
  if (!company.trade_name && tradeName) company.trade_name = tradeName;
  if (!company.contact_email && contactEmail) company.contact_email = contactEmail;
  if (!company.phone && phone) company.phone = phone;
  if (!company.website && website) company.website = website;
  if (!company.logo_url && logoUrl) company.logo_url = logoUrl;
  if (!company.certifications && certifications) company.certifications = certifications;
  if (!company.export_destinations && exportDestinations) {
    company.export_destinations = exportDestinations;
  }

  for (const product of products) {
    const key = `${normalizeKey(product.name)}|${product.tariff_position}`;
    if (!company.products.some((p) => `${normalizeKey(p.name)}|${p.tariff_position}` === key)) {
      company.products.push(product);
    }
  }

  // If still no products, keep one generic from description text
  if (company.products.length === 0 && productDescription) {
    company.products.push({
      name: productDescription.slice(0, 180),
      description: productDescription,
      tariff_position: ncmPool[0] || ""
    });
  }
}

const companies = [...byTax.values()].sort((a, b) =>
  a.company_name.localeCompare(b.company_name, "es")
);

// Output: one row per product (normalized). Company fields repeated.
// Easy to edit in Excel and clear for seed.
const headers = [
  "company_name",
  "trade_name",
  "tax_id",
  "contact_name",
  "contact_email",
  "phone",
  "description",
  "sector",
  "sub_sector",
  "city",
  "address",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "logo_url",
  "export_destinations",
  "certifications",
  "is_published",
  "product_name",
  "product_description",
  "tariff_position"
];

const outRows = [headers.join(",")];
for (const company of companies) {
  const productList =
    company.products.length > 0
      ? company.products
      : [{ name: "", description: "", tariff_position: "" }];
  for (const product of productList) {
    outRows.push(
      [
        company.company_name,
        company.trade_name,
        company.tax_id,
        company.contact_name,
        company.contact_email,
        company.phone,
        company.description,
        company.sector,
        company.sub_sector,
        company.city,
        company.address,
        company.website,
        company.facebook,
        company.instagram,
        company.linkedin,
        company.logo_url,
        company.export_destinations,
        company.certifications,
        company.is_published,
        product.name,
        product.description,
        product.tariff_position
      ]
        .map(csvEscape)
        .join(",")
    );
  }
}

fs.writeFileSync(outputPath, outRows.join("\n") + "\n", "utf8");
console.log(
  JSON.stringify(
    {
      input: inputPath,
      output: outputPath,
      companies: companies.length,
      productRows: outRows.length - 1
    },
    null,
    2
  )
);
