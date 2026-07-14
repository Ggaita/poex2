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
  SearchFieldName,
  SearchResponseData,
  SearchResultItem
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

const tokenize = (value: string): string[] => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  return [...new Set(normalized.split(" ").filter((token) => token.length >= 2))];
};

const trimToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
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

    if (normalizedFieldValue.includes(normalizedQuery)) {
      score += field.weight * 3;
      matched = true;
    }

    tokens.forEach((token) => {
      if (normalizedFieldValue.includes(token)) {
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
  limit = 24
): Promise<SearchResponseData> => {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery) {
    return {
      query,
      total: 0,
      results: []
    };
  }

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
      const sector = getVisibleString(row, visibility, "sector");
      const city = getVisibleString(row, visibility, "city");
      const contactName = getVisibleString(row, visibility, "contactName");
      const email = getVisibleString(row, visibility, "contactEmail");
      const taxId = getVisibleString(row, visibility, "taxId");
      const companyProducts = toCompanyProductSummaries(row.products);

      const companyFields: SearchableField[] = [
        { field: "companyName", value: companyName, weight: 7 },
        { field: "product", value: profileProduct ?? "", weight: 5 },
        { field: "keywords", value: keywords.join(" "), weight: 4 },
        { field: "description", value: description ?? "", weight: 3 },
        { field: "sector", value: sector ?? "", weight: 2 },
        { field: "city", value: city ?? "", weight: 2 },
        { field: "contactName", value: contactName ?? "", weight: 1 },
        { field: "email", value: email ?? "", weight: 1 },
        { field: "taxId", value: taxId ?? "", weight: 1 }
      ];

      const { score: companyScore, matchedFields: companyMatchedFields } = scoreFields(
        normalizedQuery,
        tokens,
        companyFields
      );

      if (companyScore > 0) {
        acc.push({
          resultId: `company-${row.id}`,
          profileId: row.id,
          kind: "company",
          title: companyName,
          companyName,
          summary: description ?? "Empresa exportadora registrada.",
          contactName,
          email,
          sector,
          city,
          companyProducts: companyProducts.slice(0, 8),
          keywords,
          matchedFields: companyMatchedFields,
          matchScore: companyScore
        });
      }

      row.products.forEach((product) => {
        const productName = trimToUndefined(product.name);
        if (!productName) {
          return;
        }

        const productDescription = trimToUndefined(product.description);
        const productTariffPosition = trimToUndefined(product.tariffPosition);
        const productFields: SearchableField[] = [
          { field: "product", value: productName, weight: 8 },
          { field: "description", value: productDescription ?? "", weight: 4 },
          { field: "tariffPosition", value: productTariffPosition ?? "", weight: 5 },
          { field: "companyName", value: companyName, weight: 3 },
          { field: "keywords", value: keywords.join(" "), weight: 2 },
          { field: "sector", value: sector ?? "", weight: 1 },
          { field: "city", value: city ?? "", weight: 1 }
        ];

        const { score: productScore, matchedFields: productMatchedFields } = scoreFields(
          normalizedQuery,
          tokens,
          productFields
        );

        if (productScore <= 0) {
          return;
        }

        acc.push({
          resultId: `product-${product.id}`,
          profileId: row.id,
          kind: "product",
          title: productName,
          companyName,
          summary:
            productDescription ??
            description ??
            "Producto exportable disponible en empresa registrada.",
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
          companyProducts: companyProducts.slice(0, 8),
          keywords,
          matchedFields: productMatchedFields,
          matchScore: productScore
        });
      });

      return acc;
    }, [])
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return left.resultId.localeCompare(right.resultId, "es");
    })
    .slice(0, limit);

  return {
    query,
    total: scoredResults.length,
    results: scoredResults
  };
};