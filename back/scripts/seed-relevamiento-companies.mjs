import fs from "node:fs";
import { PrismaClient, ProfileEditMode } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_BASE_CSV =
  "C:\\Users\\gaita\\Downloads\\Chaco_Oferta_Exportable_NCM_validado.xlsx - Base completa.csv";

const profileFieldKeys = [
  "companyName",
  "contactName",
  "contactEmail",
  "phone",
  "taxId",
  "description",
  "sector",
  "subSector",
  "product",
  "keywords",
  "tariffPosition",
  "exportDestinations",
  "awards",
  "certifications",
  "logoUrl",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "otherLink",
  "address",
  "city",
  "googleMapsEmbed",
  "latitude",
  "longitude"
];

const visibleFields = new Set([
  "companyName",
  "contactName",
  "contactEmail",
  "phone",
  "description",
  "sector",
  "subSector",
  "product",
  "keywords",
  "tariffPosition",
  "exportDestinations",
  "certifications",
  "logoUrl",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "address",
  "city",
  "latitude",
  "longitude"
]);

const stripBom = (text) => text.replace(/^\uFEFF/, "");

const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const text = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text || text === "-" || /^n\/?a$/i.test(text)) {
    return undefined;
  }
  return text;
};

const cleanEmail = (value) => {
  const text = cleanText(value);
  return text ? text.toLowerCase() : undefined;
};

const cleanTaxId = (value) => {
  const text = cleanText(value);
  if (!text) {
    return undefined;
  }
  const digits = text.replace(/\D+/g, "");
  return digits.length > 0 ? digits : text;
};

const slugify = (value) => {
  const base = normalizeKey(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 80) || `empresa-${Date.now()}`;
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
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row);
    }
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
    if (char === "\r") {
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
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
      if (value) {
        return value;
      }
    }
  }

  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const match = entries.find(([key]) => normalizeKey(key).includes(wanted));
    if (match) {
      const value = cleanText(match[1]);
      if (value) {
        return value;
      }
    }
  }

  return undefined;
};

const looksLikeLegalEntityName = (name) => {
  const key = normalizeKey(name);
  return /\b(sa|srl|s r l|sas|s a|s a s|sai|saica|cooperativa|asociacion)\b/.test(key);
};

const legalNameScore = (name) => {
  let score = 0;
  if (looksLikeLegalEntityName(name)) {
    score += 10;
  }
  if (/\b(s\.?a\.?|s\.?r\.?l\.?|s\.?a\.?s\.?)\b/i.test(name ?? "")) {
    score += 5;
  }
  score += Math.min(String(name ?? "").length / 20, 3);
  return score;
};

const pickPreferredLegalName = (names) => {
  const unique = [];
  const seen = new Set();
  for (const name of names) {
    const cleaned = cleanText(name);
    if (!cleaned) {
      continue;
    }
    const key = normalizeKey(cleaned);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(cleaned);
  }
  if (unique.length === 0) {
    return "Empresa sin nombre";
  }
  unique.sort((a, b) => legalNameScore(b) - legalNameScore(a));
  return unique[0];
};

const mergeUniqueList = (values, separator = " | ") => {
  const parts = values
    .flatMap((value) => String(value ?? "").split(separator))
    .map((part) => part.trim())
    .filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const part of parts) {
    const key = normalizeKey(part);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(part);
  }
  return unique.length > 0 ? unique.join(separator) : undefined;
};

const extractNcmCodes = (value) => {
  const text = cleanText(value);
  if (!text) {
    return [];
  }
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
  if (!code) {
    return undefined;
  }
  const digits = code.replace(/[^\d]/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`;
  }
  if (digits.length === 4) {
    return digits;
  }
  return code;
};

const splitProductBlocks = (description) => {
  const text = cleanText(description);
  if (!text) {
    return [];
  }

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
    .split(/\n+|;+|\s+\/\s+/)
    .map((chunk) => cleanText(chunk))
    .filter(Boolean);

  if (chunks.length > 1) {
    return chunks.map((name) => ({ name, tariffHint: undefined }));
  }

  return [{ name: text, tariffHint: undefined }];
};

const pickNcmFromRow = (row, productHint) => {
  const proposed = getField(row, "NCM propuesto (validado)");
  const originalLoaded = getField(row, "NCM original (cargado)");
  const position = getField(
    row,
    "Posición(es) Arancelaria(s) NCM / Código de Servicio",
    "Posicion(es) Arancelaria(s) NCM / Codigo de Servicio"
  );
  const productDescription = getField(
    row,
    "Descripción del producto o servicio exportable",
    "Descripcion del producto o servicio exportable"
  );

  if (proposed && productHint) {
    const labeled = [
      ...proposed.matchAll(/(\d{4}(?:[.\s]?\d{2}){0,3})\s*[:\-–]\s*([^0-9]+)/g)
    ];
    if (labeled.length > 0) {
      const hint = normalizeKey(productHint);
      const match = labeled.find(
        (item) =>
          normalizeKey(item[2]).includes(hint) || hint.includes(normalizeKey(item[2]))
      );
      if (match) {
        return formatNcmDisplay(match[1]);
      }
    }
  }

  const first = (value) => {
    const codes = extractNcmCodes(value);
    return codes[0] ? formatNcmDisplay(codes[0]) : undefined;
  };

  return (
    first(proposed) ??
    first(originalLoaded) ??
    first(position) ??
    first(productDescription)
  );
};

const buildFallbackEmail = (slug, taxId) => {
  if (taxId) {
    return `import+${taxId}@poex.local`;
  }
  return `import+${slug}@poex.local`;
};

const buildCompanyFromRow = (row) => {
  const legalNameRaw = getField(row, "Razón social", "Razon social");
  const tradeName = getField(row, "Nombre comercial / Marca");
  // companyName = razón social (legal). Fantasy/trade name stays separate.
  const legalName = legalNameRaw ?? "Empresa sin nombre";
  const taxId = cleanTaxId(getField(row, "CUIT/CUIL", "CUIT", "CUIL"));

  const contactName =
    getField(row, "Nombre y apellido del responsable comercial") ??
    tradeName ??
    legalName;

  const contactEmail =
    cleanEmail(getField(row, "Email de contacto comercial")) ??
    cleanEmail(getField(row, "Email corporativo")) ??
    cleanEmail(
      getField(row, "Dirección de correo electrónico", "Direccion de correo electronico")
    );

  const phone =
    getField(row, "Whatsapp de contacto para convocatorias y acciones comerciales") ??
    getField(row, "Teléfono corporativo", "Telefono corporativo");

  const sectorRaw = getField(row, "Sector / Rubro principal") ?? "";
  const [sectorEs, sectorEn] = sectorRaw.split("/").map((part) => cleanText(part));
  const sector = sectorEs ?? (sectorRaw || undefined);
  const subSector = sectorEn;

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
  const exportDestinations =
    [exportCurrent, exportDesired ? `Interés: ${exportDesired}` : undefined]
      .filter(Boolean)
      .join(" | ") || undefined;

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
  const volume = getField(
    row,
    "Volumen exportable estimado (por año o temporada)",
    "Volumen exportable estimado (por ano o temporada)"
  );
  const volumeUnit = getField(row, "Unidad de medida del volumen exportable");
  const incoterm = getField(row, "INCOTERM y Condición de Venta", "INCOTERM y Condicion de Venta");
  const ncmNote = getField(row, "Nota de clasificación / fuente", "Nota de clasificacion / fuente");
  const ncmConfidence = getField(row, "Confianza");
  const authorization = getField(
    row,
    "Autorización expresa para publicar datos de la empresa en la web",
    "Autorizacion expresa para publicar datos de la empresa en la web"
  );

  const tradeNames = [];
  if (tradeName && normalizeKey(tradeName) !== normalizeKey(legalName)) {
    tradeNames.push(tradeName);
  }

  const descriptionParts = [];
  if (tradeNames.length > 0) {
    descriptionParts.push(`Nombre comercial / marca: ${tradeNames.join(" / ")}.`);
  }
  if (productDescription) {
    descriptionParts.push(productDescription);
  }
  if (experience) {
    descriptionParts.push(`Experiencia exportadora: ${experience}.`);
  }
  if (volume) {
    descriptionParts.push(
      `Volumen exportable estimado: ${volume}${volumeUnit ? ` ${volumeUnit}` : ""}.`
    );
  }
  if (incoterm) {
    descriptionParts.push(`INCOTERM / condición de venta: ${incoterm}.`);
  }
  if (chambers) {
    descriptionParts.push(`Cámaras/asociaciones: ${chambers}.`);
  }
  if (ncmConfidence || ncmNote) {
    descriptionParts.push(
      `Clasificación NCM: ${[ncmConfidence ? `confianza ${ncmConfidence}` : undefined, ncmNote]
        .filter(Boolean)
        .join(" — ")}.`
    );
  }

  const productBlocks = splitProductBlocks(productDescription);
  const products = (
    productBlocks.length > 0
      ? productBlocks
      : [{ name: tradeName || legalName, tariffHint: undefined }]
  ).map((block, index) => {
    const fromHint = block.tariffHint ? formatNcmDisplay(block.tariffHint) : undefined;
    const fromRow = pickNcmFromRow(row, block.name);
    const fallbackCodes = [
      ...extractNcmCodes(getField(row, "NCM propuesto (validado)")),
      ...extractNcmCodes(
        getField(
          row,
          "Posición(es) Arancelaria(s) NCM / Código de Servicio",
          "Posicion(es) Arancelaria(s) NCM / Codigo de Servicio"
        )
      )
    ].map(formatNcmDisplay);
    const tariffPosition =
      fromRow ?? fromHint ?? fallbackCodes[index] ?? fallbackCodes[0] ?? undefined;

    return {
      name: block.name.slice(0, 180),
      description: block.name,
      tariffPosition,
      isTariffPositionUnknown: !tariffPosition
    };
  });

  const productSummary = products.map((product) => product.name).join("; ");
  const firstTariff = products.find((product) => product.tariffPosition)?.tariffPosition;
  const keywords = [
    sector,
    subSector,
    ...tradeNames,
    ...products.map((product) => product.name)
  ]
    .filter(Boolean)
    .join(", ")
    .slice(0, 500);

  const fullAddress = [address, postalCode ? `CP ${postalCode}` : undefined, city, "Chaco"]
    .filter(Boolean)
    .join(", ");

  const slugBase = slugify(legalName);
  const slug = taxId ? `${slugBase}-${taxId.slice(-4)}` : slugBase;

  return {
    slug,
    companyName: legalName,
    tradeNames,
    alternateLegalNames: [],
    contactName,
    contactEmail: contactEmail ?? buildFallbackEmail(slug, taxId),
    phone,
    taxId,
    description: descriptionParts.join(" ").slice(0, 4000) || undefined,
    sector,
    subSector,
    product: productSummary.slice(0, 1000),
    keywords,
    tariffPosition: firstTariff,
    exportDestinations,
    certifications,
    logoUrl,
    website,
    facebook,
    instagram,
    linkedin,
    address: fullAddress || address,
    city,
    isPublished:
      !authorization || /si|sí|acepto|autorizo|ok|true|1/i.test(authorization),
    products,
    sourceCompanyKey: normalizeKey(legalName)
  };
};

const ensureUniqueSlug = async (baseSlug, ignoreId) => {
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.companyProfile.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!existing || existing.id === ignoreId) {
      return slug;
    }
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const findExistingProfile = async (company) => {
  if (company.taxId) {
    const byTax = await prisma.companyProfile.findFirst({
      where: { taxId: company.taxId },
      select: { id: true, slug: true, companyName: true }
    });
    if (byTax) {
      return byTax;
    }
  }

  const bySlug = await prisma.companyProfile.findUnique({
    where: { slug: company.slug },
    select: { id: true, slug: true, companyName: true }
  });
  if (bySlug) {
    return bySlug;
  }

  const byName = await prisma.companyProfile.findFirst({
    where: {
      companyName: {
        equals: company.companyName,
        mode: "insensitive"
      }
    },
    select: { id: true, slug: true, companyName: true }
  });
  return byName ?? null;
};

const upsertCompany = async (company) => {
  const existing = await findExistingProfile(company);
  const desiredSlugBase = company.taxId
    ? `${slugify(company.companyName)}-${company.taxId.slice(-4)}`
    : slugify(company.companyName);
  const slug = existing
    ? await ensureUniqueSlug(desiredSlugBase, existing.id)
    : await ensureUniqueSlug(desiredSlugBase);

  const data = {
    slug,
    companyName: company.companyName,
    contactName: company.contactName,
    contactEmail: company.contactEmail,
    phone: company.phone ?? null,
    taxId: company.taxId ?? null,
    description: company.description ?? null,
    sector: company.sector ?? null,
    subSector: company.subSector ?? null,
    product: company.product ?? null,
    keywords: company.keywords ?? null,
    tariffPosition: company.tariffPosition ?? null,
    exportDestinations: company.exportDestinations ?? null,
    certifications: company.certifications ?? null,
    logoUrl: company.logoUrl ?? null,
    website: company.website ?? null,
    facebook: company.facebook ?? null,
    instagram: company.instagram ?? null,
    linkedin: company.linkedin ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    editMode: ProfileEditMode.mixed,
    isPublished: company.isPublished !== false
  };

  const profile = existing
    ? await prisma.companyProfile.update({
        where: { id: existing.id },
        data
      })
    : await prisma.companyProfile.create({ data });

  await prisma.companyProfileVisibility.deleteMany({
    where: { profileId: profile.id }
  });
  await prisma.companyProfileVisibility.createMany({
    data: profileFieldKeys.map((fieldKey) => ({
      profileId: profile.id,
      fieldKey,
      isVisible: visibleFields.has(fieldKey),
      updatedBy: "seed-relevamiento"
    }))
  });

  await prisma.companyProduct.deleteMany({
    where: { profileId: profile.id }
  });

  if (company.products.length > 0) {
    await prisma.companyProduct.createMany({
      data: company.products.map((product) => ({
        profileId: profile.id,
        name: product.name,
        description: product.description ?? null,
        tariffPosition: product.tariffPosition ?? null,
        isTariffPositionUnknown: Boolean(product.isTariffPositionUnknown),
        isAccepted: true,
        rejectionMessage: null,
        reviewedBy: "Import base completa NCM",
        reviewedAt: new Date()
      }))
    });
  }

  return { profile, created: !existing };
};

const mergeCompanies = (base, extra) => {
  const productMap = new Map();
  for (const product of [...base.products, ...extra.products]) {
    const key = `${normalizeKey(product.name)}|${product.tariffPosition ?? ""}`;
    if (!productMap.has(key)) {
      productMap.set(key, product);
    }
  }
  const products = [...productMap.values()];

  const legalName = pickPreferredLegalName([
    base.companyName,
    extra.companyName,
    ...(base.alternateLegalNames ?? []),
    ...(extra.alternateLegalNames ?? [])
  ]);

  const alternateLegalNames = [
    ...new Set(
      [
        base.companyName,
        extra.companyName,
        ...(base.alternateLegalNames ?? []),
        ...(extra.alternateLegalNames ?? [])
      ]
        .map((name) => cleanText(name))
        .filter(Boolean)
        .filter((name) => normalizeKey(name) !== normalizeKey(legalName))
    )
  ];

  const tradeNames = [
    ...new Set(
      [...(base.tradeNames ?? []), ...(extra.tradeNames ?? [])]
        .map((name) => cleanText(name))
        .filter(Boolean)
        .filter((name) => normalizeKey(name) !== normalizeKey(legalName))
    )
  ];

  const descriptionCore = mergeUniqueList(
    [base.description, extra.description].map((text) =>
      String(text ?? "")
        .replace(/^Nombre comercial \/ marca:[^.]*\.\s*/i, "")
        .replace(/^Otras denominaciones cargadas:[^.]*\.\s*/i, "")
        .trim()
    ),
    "\n\n"
  );

  const descriptionParts = [];
  if (tradeNames.length > 0) {
    descriptionParts.push(`Nombre comercial / marca: ${tradeNames.join(" / ")}.`);
  }
  if (alternateLegalNames.length > 0) {
    descriptionParts.push(
      `Otras denominaciones cargadas: ${alternateLegalNames.join(" / ")}.`
    );
  }
  if (descriptionCore) {
    descriptionParts.push(descriptionCore);
  }

  const taxId = base.taxId || extra.taxId;

  return {
    ...base,
    companyName: legalName,
    tradeNames,
    alternateLegalNames,
    contactName: base.contactName || extra.contactName,
    contactEmail: base.contactEmail || extra.contactEmail,
    phone: base.phone || extra.phone,
    taxId,
    description: descriptionParts.join(" ").slice(0, 4000) || undefined,
    sector: base.sector || extra.sector,
    subSector: base.subSector || extra.subSector,
    product: products.map((product) => product.name).join("; ").slice(0, 1000),
    keywords: mergeUniqueList([base.keywords, extra.keywords, ...tradeNames], ", "),
    tariffPosition:
      base.tariffPosition ||
      extra.tariffPosition ||
      products.find((product) => product.tariffPosition)?.tariffPosition,
    exportDestinations: mergeUniqueList([
      base.exportDestinations,
      extra.exportDestinations
    ]),
    certifications: mergeUniqueList([base.certifications, extra.certifications]),
    logoUrl: base.logoUrl || extra.logoUrl,
    website: base.website || extra.website,
    facebook: base.facebook || extra.facebook,
    instagram: base.instagram || extra.instagram,
    linkedin: base.linkedin || extra.linkedin,
    address: base.address || extra.address,
    city: base.city || extra.city,
    isPublished: Boolean(base.isPublished || extra.isPublished),
    products,
    slug: taxId ? `${slugify(legalName)}-${taxId.slice(-4)}` : slugify(legalName)
  };
};

const run = async () => {
  const basePath = process.env.RELEVAMIENTO_CSV || DEFAULT_BASE_CSV;

  if (!fs.existsSync(basePath)) {
    throw new Error(`No se encontró la base completa CSV: ${basePath}`);
  }

  const rows = parseCsv(basePath);
  const builtCompanies = rows
    .map((row) => buildCompanyFromRow(row))
    .filter((company) => company.companyName && company.companyName !== "Empresa sin nombre");

  const companies = [];
  const indexByKey = new Map();

  for (const company of builtCompanies) {
    const mergeKey = company.taxId
      ? `tax:${company.taxId}`
      : `name:${company.sourceCompanyKey}`;
    const existingIndex = indexByKey.get(mergeKey);
    if (existingIndex === undefined) {
      indexByKey.set(mergeKey, companies.length);
      companies.push(company);
      continue;
    }

    const before = companies[existingIndex].companyName;
    companies[existingIndex] = mergeCompanies(companies[existingIndex], company);
    console.log(
      `🔗 Merge: "${before}" + "${company.companyName}" → "${companies[existingIndex].companyName}"` +
        (companies[existingIndex].tradeNames?.length
          ? ` (marca: ${companies[existingIndex].tradeNames.join(" / ")})`
          : "")
    );
  }

  console.log(`📦 Filas origen: ${builtCompanies.length}`);
  console.log(`📦 Empresas finales: ${companies.length}`);
  console.log(`📄 Fuente: ${basePath}`);

  let created = 0;
  let updated = 0;

  for (const company of companies) {
    const result = await upsertCompany(company);
    const brand =
      company.tradeNames?.length > 0 ? ` · marca: ${company.tradeNames.join(" / ")}` : "";
    if (result.created) {
      created += 1;
      console.log(
        `✅ Alta: ${result.profile.companyName} (#${result.profile.id})${brand} · ${company.products.length} producto(s)`
      );
    } else {
      updated += 1;
      console.log(
        `♻️  Update: ${result.profile.companyName} (#${result.profile.id})${brand} · ${company.products.length} producto(s)`
      );
    }
  }

  console.log(
    `\nListo. Creadas: ${created} · Actualizadas: ${updated} · Total perfiles: ${companies.length}`
  );
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error importando base completa:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
