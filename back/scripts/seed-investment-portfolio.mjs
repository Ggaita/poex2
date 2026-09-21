import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  InvestmentOpportunityStatus,
  InvestmentOpportunityType,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveDataFile = (fileName) => {
  const candidates = [
    path.join(__dirname, "..", "data", fileName),
    path.join(process.cwd(), "data", fileName),
    path.join(process.cwd(), "back", "data", fileName),
    `/app/data/${fileName}`,
    `/app/back/data/${fileName}`
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return path.resolve(candidate);
  }
  return null;
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#063565"/><stop offset="100%" stop-color="#5059bc"/>
      </linearGradient></defs>
      <rect width="800" height="500" fill="url(#g)"/>
      <text x="50%" y="50%" fill="#ffffff" font-family="Arial,sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">Oportunidad de inversión</text>
    </svg>`
  );

const mapOpportunityType = (excelType = "") => {
  const t = excelType.toLowerCase();
  if (t.includes("sectorial")) return InvestmentOpportunityType.proyectos_productivos;
  if (t.includes("parque")) return InvestmentOpportunityType.parques_industriales;
  if (t.includes("logíst") || t.includes("logistic")) return InvestmentOpportunityType.inversiones;
  if (t.includes("activo") || t.includes("inmueble")) return InvestmentOpportunityType.inversiones;
  return InvestmentOpportunityType.inversiones;
};

const mapOpportunityStatus = (maturity = "") => {
  const m = maturity.toLowerCase();
  if (m.includes("paraliz") || m.includes("frenad") || m.includes("cerrad")) {
    return InvestmentOpportunityStatus.licitacion_cerrada;
  }
  if (m.includes("ejecución") || m.includes("ejecucion") || m.includes("gestión") || m.includes("gestion") || m.includes("construida") || m.includes("uso")) {
    return InvestmentOpportunityStatus.licitacion_vigente;
  }
  return InvestmentOpportunityStatus.proxima_licitacion;
};

const buildFullDescription = (item) => {
  const parts = [item.description || item.title];
  if (item.excelType) parts.push(`Tipo de oportunidad: ${item.excelType}.`);
  if (item.nature) parts.push(`Naturaleza: ${item.nature}.`);
  if (item.maturity) parts.push(`Nivel de madurez: ${item.maturity}.`);
  if (item.activation) parts.push(`Mecanismo de activación: ${item.activation}.`);
  if (item.source) parts.push(`Fuente: ${item.source}.`);
  if (item.observations) parts.push(`Observaciones: ${item.observations}.`);
  if (item.externalId) parts.push(`ID cartera: ${item.externalId}.`);
  return parts.join("\n\n");
};

const seedOpportunities = async () => {
  const file = resolveDataFile("investment-opportunities-seed.json");
  if (!file) {
    throw new Error("No se encontró data/investment-opportunities-seed.json");
  }
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  let upserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const slug = String(item.slug || `oportunidad-${index + 1}`).slice(0, 80);
    const shortDescription = String(item.description || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);

    await prisma.investmentOpportunity.upsert({
      where: { slug },
      update: {
        title: item.title,
        shortDescription: shortDescription || null,
        fullDescription: buildFullDescription(item),
        sector: item.sector || "General",
        locality: item.locality || "Chaco",
        type: mapOpportunityType(item.excelType || ""),
        status: mapOpportunityStatus(item.maturity || ""),
        estimatedInvestment: item.nature ? `Naturaleza: ${item.nature}` : null,
        mainImageUrl: PLACEHOLDER_IMAGE,
        isFeatured: index < 6,
        isPublished: true,
        sortOrder: index + 1
      },
      create: {
        slug,
        title: item.title,
        shortDescription: shortDescription || null,
        fullDescription: buildFullDescription(item),
        sector: item.sector || "General",
        locality: item.locality || "Chaco",
        type: mapOpportunityType(item.excelType || ""),
        status: mapOpportunityStatus(item.maturity || ""),
        estimatedInvestment: item.nature ? `Naturaleza: ${item.nature}` : null,
        mainImageUrl: PLACEHOLDER_IMAGE,
        isFeatured: index < 6,
        isPublished: true,
        sortOrder: index + 1
      }
    });
    upserted += 1;
  }

  return { file, upserted };
};

const toIntOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toFloatOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const seedParks = async () => {
  const file = resolveDataFile("industrial-parks-seed.json");
  if (!file) {
    throw new Error("No se encontró data/industrial-parks-seed.json");
  }
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  let upserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const slug = String(item.slug || `parque-${index + 1}`).slice(0, 80);

    await prisma.industrialPark.upsert({
      where: { slug },
      update: {
        name: item.name,
        administration: item.administration || null,
        progressStatus: item.progressStatus || "Sin dato",
        locality: item.locality || "Chaco",
        department: item.department || null,
        yearCreated: toIntOrNull(item.yearCreated),
        surfaceHa: toFloatOrNull(item.surfaceHa),
        measuredPlots: toIntOrNull(item.measuredPlots),
        settledCompanies: item.settledCompanies || null,
        infrastructure: item.infrastructure || null,
        renpiStatus: item.renpiStatus || null,
        observations: item.observations || null,
        sortOrder: toIntOrNull(item.number) ?? index + 1,
        isPublished: true
      },
      create: {
        slug,
        name: item.name,
        administration: item.administration || null,
        progressStatus: item.progressStatus || "Sin dato",
        locality: item.locality || "Chaco",
        department: item.department || null,
        yearCreated: toIntOrNull(item.yearCreated),
        surfaceHa: toFloatOrNull(item.surfaceHa),
        measuredPlots: toIntOrNull(item.measuredPlots),
        settledCompanies: item.settledCompanies || null,
        infrastructure: item.infrastructure || null,
        renpiStatus: item.renpiStatus || null,
        observations: item.observations || null,
        sortOrder: toIntOrNull(item.number) ?? index + 1,
        isPublished: true
      }
    });
    upserted += 1;
  }

  return { file, upserted };
};

const run = async () => {
  const opportunities = await seedOpportunities();
  const parks = await seedParks();
  console.log("OK seed cartera inversiones + parques");
  console.log(
    JSON.stringify(
      {
        opportunitiesFile: opportunities.file,
        opportunitiesUpserted: opportunities.upserted,
        parksFile: parks.file,
        parksUpserted: parks.upserted
      },
      null,
      2
    )
  );
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error seed portfolio:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
