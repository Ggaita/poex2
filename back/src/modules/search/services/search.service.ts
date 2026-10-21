import type {
  CompanyProfile as DbCompanyProfile,
  CompanyProduct as DbCompanyProduct,
  CompanyProfileVisibility as DbCompanyProfileVisibility
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type { ProfileFieldKey } from "../../profiles/types/profile.types";
import { profileFieldKeys } from "../../profiles/types/profile.types";
import type {
  SearchCompanyProductSummary,
  SearchFacets,
  SearchFieldName,
  SearchFilters,
  SearchHasPaFilter,
  SearchMode,
  SearchResponseData,
  SearchResultItem,
  SearchResultKindFilter
} from "../types/search.types";

type ProfileWithRelations = DbCompanyProfile & {
  visibilityRules: DbCompanyProfileVisibility[];
  products: DbCompanyProduct[];
};

type SearchableField = {
  field: SearchFieldName;
  value: string;
  weight: number;
};

const defaultVisibilityByField: Record<ProfileFieldKey, boolean> = {
  companyName: true,
  contactName: false,
  contactEmail: false,
  phone: false,
  taxId: false,
  description: true,
  sector: true,
  subSector: true,
  product: true,
  keywords: true,
  tariffPosition: true,
  exportDestinations: true,
  awards: false,
  certifications: false,
  logoUrl: true,
  website: true,
  facebook: false,
  instagram: false,
  linkedin: false,
  youtube: false,
  otherLink: false,
  address: false,
  city: true,
  googleMapsEmbed: true,
  latitude: true,
  longitude: true
};

const normalizeText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/** PA/NCM: solo dígitos, para matchear 0802.10.00 ≈ 08021000 ≈ 0802 */
const normalizeTariffCode = (value: string): string => {
  return value.replace(/\D+/g, "");
};

const tokenize = (value: string): string[] => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(" ").filter((token) => token.length >= 2);

  // Conservar el código arancelario compacto (solo dígitos) si la query parece una PA.
  const tariffDigits = normalizeTariffCode(value);
  if (tariffDigits.length >= 4) {
    tokens.push(tariffDigits);
  }

  return [...new Set(tokens)];
};

/** Match de token con borde de palabra (evita "deco" ⊆ "decoracion"). */
const fieldContainsToken = (normalizedField: string, token: string): boolean => {
  if (!normalizedField || !token) {
    return false;
  }

  // Códigos PA / numéricos: substring de dígitos.
  if (/^\d+$/.test(token)) {
    const fieldDigits = normalizedField.replace(/\D+/g, "");
    return fieldDigits.includes(token) || normalizedField.includes(token);
  }

  const padded = ` ${normalizedField} `;
  return padded.includes(` ${token} `);
};

const scoreTariffMatch = (query: string, tariffValue: string | undefined): number => {
  if (!tariffValue) {
    return 0;
  }

  const queryDigits = normalizeTariffCode(query);
  const fieldDigits = normalizeTariffCode(tariffValue);
  if (!queryDigits || !fieldDigits) {
    return 0;
  }

  // Match exacto o por prefijo (importador busca capítulo/partida/subpartida).
  if (fieldDigits === queryDigits || fieldDigits.startsWith(queryDigits) || queryDigits.startsWith(fieldDigits)) {
    // Más dígitos en común ⇒ más específico ⇒ más score.
    const shared = Math.min(queryDigits.length, fieldDigits.length);
    return 12 + shared * 2;
  }

  if (fieldDigits.includes(queryDigits) || queryDigits.includes(fieldDigits)) {
    return 8;
  }

  return 0;
};

const trimToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

/** Extrae "Experiencia exportadora: …" embebida en description del seed. */
const extractExportExperience = (description?: string): string | undefined => {
  if (!description) {
    return undefined;
  }
  const match = description.match(/Experiencia exportadora:\s*([^.;\n]+)/i);
  const value = match?.[1]?.trim();
  if (!value) {
    return undefined;
  }
  return value.replace(/\s+/g, " ").slice(0, 48);
};

const toKeywordList = (raw?: string): string[] => {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const isProfileFieldKey = (value: string): value is ProfileFieldKey => {
  return (profileFieldKeys as readonly string[]).includes(value);
};

const buildVisibilityMap = (
  rows: DbCompanyProfileVisibility[]
): Record<ProfileFieldKey, boolean> => {
  const map: Record<ProfileFieldKey, boolean> = { ...defaultVisibilityByField };

  rows.forEach((row) => {
    if (isProfileFieldKey(row.fieldKey)) {
      map[row.fieldKey] = row.isVisible;
    }
  });

  return map;
};

const getVisibleString = (
  profile: DbCompanyProfile,
  visibility: Record<ProfileFieldKey, boolean>,
  fieldKey: ProfileFieldKey
): string | undefined => {
  if (!visibility[fieldKey]) {
    return undefined;
  }

  const value = profile[fieldKey as keyof DbCompanyProfile];
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const scoreFields = (
  normalizedQuery: string,
  tokens: string[],
  fields: SearchableField[]
): {
  score: number;
  matchedFields: SearchFieldName[];
} => {
  let score = 0;
  const matchedFieldsSet = new Set<SearchFieldName>();

  fields.forEach((field) => {
    const normalizedFieldValue = normalizeText(field.value);
    if (!normalizedFieldValue) {
      return;
    }

    let matched = false;

    // Frase completa / query exacta en el campo (mayor peso).
    if (normalizedQuery) {
      if (/\s/.test(normalizedQuery) && normalizedFieldValue.includes(normalizedQuery)) {
        score += field.weight * 3;
        matched = true;
      } else if (fieldContainsToken(normalizedFieldValue, normalizedQuery)) {
        score += field.weight * 3;
        matched = true;
      }
    }

    tokens.forEach((token) => {
      if (fieldContainsToken(normalizedFieldValue, token)) {
        score += field.weight;
        matched = true;
      }
    });

    if (matched) {
      matchedFieldsSet.add(field.field);
    }
  });

  return {
    score,
    matchedFields: [...matchedFieldsSet]
  };
};

const PRODUCT_DIRECT_FIELDS: SearchFieldName[] = [
  "product",
  "description",
  "tariffPosition",
  "keywords"
];

const hasDirectProductMatch = (matchedFields: SearchFieldName[]): boolean => {
  return matchedFields.some((field) => PRODUCT_DIRECT_FIELDS.includes(field));
};

const normalizeFilterValue = (value?: string | null): string => {
  if (!value) {
    return "";
  }
  return normalizeText(value);
};

const itemHasPa = (item: SearchResultItem): boolean => {
  if (item.kind === "product") {
    return Boolean(trimToUndefined(item.product?.tariffPosition));
  }
  if (trimToUndefined(item.product?.tariffPosition)) {
    return true;
  }
  return item.companyProducts.some((product) => Boolean(trimToUndefined(product.tariffPosition)));
};

const buildFacetOptions = (
  rows: SearchResultItem[],
  pick: (row: SearchResultItem) => string | undefined,
  limit = 40
): SearchFacets["sectors"] => {
  // Conteo por perfil único cuando se pueda (evita 1 empresa + 3 productos = ciudad x4).
  const map = new Map<string, { label: string; profiles: Set<number>; loose: number }>();

  rows.forEach((row) => {
    const label = trimToUndefined(pick(row));
    if (!label) {
      return;
    }
    const key = normalizeFilterValue(label);
    const existing = map.get(key);
    if (existing) {
      existing.profiles.add(row.profileId);
      existing.loose += 1;
      return;
    }
    map.set(key, {
      label,
      profiles: new Set([row.profileId]),
      loose: 1
    });
  });

  return [...map.entries()]
    .map(([value, item]) => ({
      value,
      label: item.label,
      // Preferimos perfiles únicos: sincroniza mejor con "N empresas".
      count: item.profiles.size
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
    .slice(0, limit);
};

const applySearchFilters = (
  rows: SearchResultItem[],
  filters: Required<SearchFilters>,
  /** Dimensiones a ignorar al armar facetas disyuntivas (estilo Amazon). */
  ignore: Partial<Record<"kind" | "sector" | "city" | "hasPa", boolean>> = {}
): SearchResultItem[] => {
  const sectorKey = ignore.sector ? "" : normalizeFilterValue(filters.sector);
  const cityKey = ignore.city ? "" : normalizeFilterValue(filters.city);
  const kind = ignore.kind ? "all" : filters.kind;
  const hasPa = ignore.hasPa ? "all" : filters.hasPa;

  return rows.filter((row) => {
    if (kind === "company" && row.kind !== "company") {
      return false;
    }
    if (kind === "product" && row.kind !== "product") {
      return false;
    }
    if (sectorKey && normalizeFilterValue(row.sector) !== sectorKey) {
      return false;
    }
    if (cityKey && normalizeFilterValue(row.city) !== cityKey) {
      return false;
    }
    if (hasPa === "yes" && !itemHasPa(row)) {
      return false;
    }
    if (hasPa === "no" && itemHasPa(row)) {
      return false;
    }
    return true;
  });
};

const buildSearchFacets = (
  scoredResults: SearchResultItem[],
  filters: Required<SearchFilters>
): SearchFacets => {
  // Cada faceta se calcula con el resto de filtros activos, NO con el propio.
  // Así Ciudad/Sector/P.A. siguen en sincronía y se pueden cambiar sin “limpiar todo”.
  const forKinds = applySearchFilters(scoredResults, filters, { kind: true });
  const forSectors = applySearchFilters(scoredResults, filters, { sector: true });
  const forCities = applySearchFilters(scoredResults, filters, { city: true });
  const forHasPa = applySearchFilters(scoredResults, filters, { hasPa: true });

  const companyCount = forKinds.filter((row) => row.kind === "company").length;
  const productCount = forKinds.filter((row) => row.kind === "product").length;
  const withPa = forHasPa.filter((row) => itemHasPa(row)).length;
  const withoutPa = forHasPa.length - withPa;

  const ensureSelected = (
    options: SearchFacets["sectors"],
    selectedRaw: string,
    selectedLabelFallback: string
  ): SearchFacets["sectors"] => {
    const selected = normalizeFilterValue(selectedRaw);
    if (!selected) {
      return options;
    }
    if (options.some((option) => option.value === selected)) {
      return options;
    }
    return [
      { value: selected, label: selectedLabelFallback || selectedRaw, count: 0 },
      ...options
    ];
  };

  const kindsBase = [
    { value: "all" as const, label: "Todos", count: forKinds.length },
    { value: "company" as const, label: "Empresas", count: companyCount },
    { value: "product" as const, label: "Productos", count: productCount }
  ].filter((option) => option.value === "all" || option.count > 0 || filters.kind === option.value);

  const hasPaBase = [
    { value: "all" as const, label: "Todas", count: forHasPa.length },
    { value: "yes" as const, label: "Con P.A.", count: withPa },
    { value: "no" as const, label: "Sin P.A.", count: withoutPa }
  ].filter((option) => option.value === "all" || option.count > 0 || filters.hasPa === option.value);

  return {
    kinds: kindsBase,
    sectors: ensureSelected(
      buildFacetOptions(forSectors, (row) => row.sector),
      filters.sector,
      filters.sector
    ),
    cities: ensureSelected(
      buildFacetOptions(forCities, (row) => row.city),
      filters.city,
      filters.city
    ),
    hasPa: hasPaBase
  };
};

const toCompanyProductSummaries = (
  products: DbCompanyProduct[]
): SearchCompanyProductSummary[] => {
  const summaries: SearchCompanyProductSummary[] = [];

  products.forEach((product) => {
    const name = trimToUndefined(product.name);
    if (!name) {
      return;
    }

    const tariffPosition = trimToUndefined(product.tariffPosition);
    summaries.push({
      id: product.id,
      name,
      ...(tariffPosition ? { tariffPosition } : {})
    });
  });

  return summaries;
};

export const searchApprovedProfiles = async (
  query: string,
  limit = 24,
  mode: SearchMode = "all",
  filtersInput: SearchFilters = {}
): Promise<SearchResponseData> => {
  const normalizedQuery = normalizeText(query);
  const hasQuery = normalizedQuery.length > 0;
  const tokens = tokenize(query);
  const includeCompanies = mode !== "product";
  const includeProducts = mode !== "company";
  const kindFilter: SearchResultKindFilter =
    mode === "company" || mode === "product"
      ? mode
      : filtersInput.kind === "company" || filtersInput.kind === "product"
        ? filtersInput.kind
        : "all";
  const hasPaFilter: SearchHasPaFilter =
    filtersInput.hasPa === "yes" || filtersInput.hasPa === "no" ? filtersInput.hasPa : "all";
  const resolvedFilters: Required<SearchFilters> = {
    sector: trimToUndefined(filtersInput.sector) ?? "",
    city: trimToUndefined(filtersInput.city) ?? "",
    kind: kindFilter,
    hasPa: hasPaFilter
  };

  const rows: ProfileWithRelations[] = await prisma.companyProfile.findMany({
    where: { isPublished: true },
    include: {
      visibilityRules: true,
      products: {
        where: { isAccepted: true },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
      }
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  });

  const scoredResults = rows
    .reduce<SearchResultItem[]>((acc, row) => {
      const visibility = buildVisibilityMap(row.visibilityRules);
      const companyName = getVisibleString(row, visibility, "companyName");
      if (!companyName) {
        return acc;
      }

      const profileProduct = getVisibleString(row, visibility, "product");
      const keywords = toKeywordList(getVisibleString(row, visibility, "keywords"));
      const description = getVisibleString(row, visibility, "description");
      const exportExperience = extractExportExperience(description);
      const sector = getVisibleString(row, visibility, "sector");
      const city = getVisibleString(row, visibility, "city");
      const companyLogoUrl = getVisibleString(row, visibility, "logoUrl");
      const contactName = getVisibleString(row, visibility, "contactName");
      const email = getVisibleString(row, visibility, "contactEmail");
      const taxId = getVisibleString(row, visibility, "taxId");
      const profileTariffPosition = getVisibleString(row, visibility, "tariffPosition");
      // Match-only (no se exponen si la visibilidad los oculta): email/redes/marca en ficha.
      const emailForMatch =
        trimToUndefined(row.contactEmail) ?? email;
      const websiteForMatch = trimToUndefined(row.website);
      const socialForMatch = [
        trimToUndefined(row.instagram),
        trimToUndefined(row.facebook),
        trimToUndefined(row.linkedin)
      ]
        .filter(Boolean)
        .join(" ");
      const companyProducts = toCompanyProductSummaries(row.products);
      const productTariffBlob = companyProducts
        .map((item) => item.tariffPosition)
        .filter((value): value is string => Boolean(value))
        .join(" ");

      const companyFields: SearchableField[] = [
        // Nombre y marca (keywords suele incluir nombre comercial) pesan más que sector.
        { field: "companyName", value: companyName, weight: 10 },
        { field: "keywords", value: keywords.join(" "), weight: 7 },
        { field: "product", value: profileProduct ?? "", weight: 5 },
        { field: "description", value: description ?? "", weight: 3 },
        { field: "sector", value: sector ?? "", weight: 2 },
        { field: "city", value: city ?? "", weight: 2 },
        { field: "contactName", value: contactName ?? "", weight: 1 },
        // Email/redes: útiles para marcas tipo "albertina.deco" aunque no se muestren.
        { field: "email", value: emailForMatch ?? "", weight: 4 },
        { field: "keywords", value: websiteForMatch ?? "", weight: 3 },
        { field: "keywords", value: socialForMatch, weight: 3 },
        { field: "taxId", value: taxId ?? "", weight: 1 },
        // PA a nivel ficha + PA de productos: clave para búsqueda tipo importador.
        { field: "tariffPosition", value: profileTariffPosition ?? "", weight: 8 },
        { field: "tariffPosition", value: productTariffBlob, weight: 9 }
      ];

      const { score: companyScoreBase, matchedFields: companyMatchedFieldsBase } = scoreFields(
        normalizedQuery,
        tokens,
        companyFields
      );

      let companyScore = companyScoreBase;
      const companyMatchedFields = [...companyMatchedFieldsBase];

      const companyTariffBonus = Math.max(
        scoreTariffMatch(query, profileTariffPosition),
        ...companyProducts.map((item) => scoreTariffMatch(query, item.tariffPosition)),
        0
      );
      if (companyTariffBonus > 0) {
        companyScore += companyTariffBonus;
        if (!companyMatchedFields.includes("tariffPosition")) {
          companyMatchedFields.push("tariffPosition");
        }
      }

      const shouldIncludeCompanyResult =
        includeCompanies &&
        ((hasQuery && companyScore > 0) || (!hasQuery && mode === "company"));

      if (shouldIncludeCompanyResult) {
        acc.push({
          resultId: `company-${row.id}`,
          profileId: row.id,
          kind: "company",
          title: companyName,
          companyName,
          companyLogoUrl,
          summary: description ?? "Empresa exportadora registrada.",
          exportExperience,
          contactName,
          email,
          sector,
          city,
          companyProducts: companyProducts,
          keywords,
          matchedFields: hasQuery ? companyMatchedFields : [],
          matchScore: hasQuery ? companyScore : 0
        });
      }

      if (!includeProducts) {
        return acc;
      }

      row.products.forEach((product) => {
        const productName = trimToUndefined(product.name);
        if (!productName) {
          return;
        }

        const productDescription = trimToUndefined(product.description);
        const productTariffPosition = trimToUndefined(product.tariffPosition);

        // Campos "directos" del producto: sin heredar solo el nombre de la empresa.
        // Así "DECO" no multiplica 1 empresa + N productos irrelevantes.
        const productDirectFields: SearchableField[] = [
          { field: "product", value: productName, weight: 8 },
          { field: "description", value: productDescription ?? "", weight: 4 },
          { field: "tariffPosition", value: productTariffPosition ?? "", weight: 6 },
          { field: "keywords", value: keywords.join(" "), weight: 2 }
        ];

        const { score: productScoreBase, matchedFields: productMatchedFieldsBase } = scoreFields(
          normalizedQuery,
          tokens,
          productDirectFields
        );

        let productScore = productScoreBase;
        const productMatchedFields = [...productMatchedFieldsBase];
        const productTariffBonus = scoreTariffMatch(query, productTariffPosition);
        if (productTariffBonus > 0) {
          productScore += productTariffBonus;
          if (!productMatchedFields.includes("tariffPosition")) {
            productMatchedFields.push("tariffPosition");
          }
        }

        const directHit = !hasQuery || hasDirectProductMatch(productMatchedFields);
        const shouldIncludeProductResult =
          (!hasQuery && mode === "product") ||
          (hasQuery && productScore > 0 && directHit);

        if (!shouldIncludeProductResult) {
          return;
        }

        acc.push({
          resultId: `product-${product.id}`,
          profileId: row.id,
          kind: "product",
          title: productName,
          companyName,
          companyLogoUrl,
          summary:
            productDescription ??
            description ??
            "Producto exportable disponible en empresa registrada.",
          exportExperience,
          contactName,
          email,
          sector,
          city,
          product: {
            id: product.id,
            name: productName,
            description: productDescription,
            imageUrl: trimToUndefined(product.imageUrl),
            tariffPosition: productTariffPosition
          },
          companyProducts: companyProducts,
          keywords,
          matchedFields: hasQuery ? productMatchedFields : [],
          matchScore: hasQuery ? productScore : 0
        });
      });

      return acc;
    }, [])
    .sort((left, right) => {
      if (hasQuery) {
        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }
        // Empresas antes que productos a igual score (más legible para el comprador).
        if (left.kind !== right.kind) {
          return left.kind === "company" ? -1 : 1;
        }
        return left.resultId.localeCompare(right.resultId, "es");
      }

      const titleComparison = left.title.localeCompare(right.title, "es");
      if (titleComparison !== 0) {
        return titleComparison;
      }

      const companyComparison = left.companyName.localeCompare(right.companyName, "es");
      if (companyComparison !== 0) {
        return companyComparison;
      }

      return left.resultId.localeCompare(right.resultId, "es");
    });

  const filteredResults = applySearchFilters(scoredResults, resolvedFilters);
  // Facetas disyuntivas: cada eje ignora su propio filtro para no desincronizar combos.
  const facets = buildSearchFacets(scoredResults, resolvedFilters);
  const pagedResults = filteredResults.slice(0, limit);
  const totalCompanies = new Set(
    filteredResults.filter((item) => item.kind === "company").map((item) => item.profileId)
  ).size;
  const totalProducts = filteredResults.filter((item) => item.kind === "product").length;

  return {
    query,
    mode,
    total: filteredResults.length,
    totalCompanies,
    totalProducts,
    filters: resolvedFilters,
    facets,
    results: pagedResults
  };
};
