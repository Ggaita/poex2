import type {
  CompanyProfile as DbCompanyProfile,
  CompanyProfileVisibility as DbCompanyProfileVisibility
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type { ProfileFieldKey } from "../../profiles/types/profile.types";
import { profileFieldKeys } from "../../profiles/types/profile.types";
import type {
  SearchFieldName,
  SearchResponseData,
  SearchResultItem
} from "../types/search.types";

type ProfileWithVisibility = DbCompanyProfile & {
  visibilityRules: DbCompanyProfileVisibility[];
};

type SearchableField = {
  field: SearchFieldName;
  value: string;
  weight: number;
  isProductSignal?: boolean;
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
  hasProductSignal: boolean;
} => {
  let score = 0;
  let hasProductSignal = false;
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

    if (!matched) {
      return;
    }

    matchedFieldsSet.add(field.field);
    if (field.isProductSignal) {
      hasProductSignal = true;
    }
  });

  return {
    score,
    matchedFields: [...matchedFieldsSet],
    hasProductSignal
  };
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

  const rows: ProfileWithVisibility[] = await prisma.companyProfile.findMany({
    where: { isPublished: true },
    include: { visibilityRules: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  });

  const scoredResults = rows
    .reduce<SearchResultItem[]>((acc, row) => {
      const visibility = buildVisibilityMap(row.visibilityRules);
      const companyName = getVisibleString(row, visibility, "companyName");
      if (!companyName) {
        return acc;
      }

      const product = getVisibleString(row, visibility, "product");
      const keywords = toKeywordList(getVisibleString(row, visibility, "keywords"));
      const description = getVisibleString(row, visibility, "description");
      const sector = getVisibleString(row, visibility, "sector");
      const city = getVisibleString(row, visibility, "city");
      const contactName = getVisibleString(row, visibility, "contactName");
      const email = getVisibleString(row, visibility, "contactEmail");
      const taxId = getVisibleString(row, visibility, "taxId");

      const fields: SearchableField[] = [
        { field: "companyName", value: companyName, weight: 6 },
        { field: "product", value: product ?? "", weight: 5, isProductSignal: true },
        { field: "keywords", value: keywords.join(" "), weight: 4, isProductSignal: true },
        { field: "description", value: description ?? "", weight: 3, isProductSignal: true },
        { field: "sector", value: sector ?? "", weight: 2 },
        { field: "city", value: city ?? "", weight: 2 },
        { field: "contactName", value: contactName ?? "", weight: 1 },
        { field: "email", value: email ?? "", weight: 1 },
        { field: "taxId", value: taxId ?? "", weight: 1 }
      ];

      const { score, matchedFields, hasProductSignal } = scoreFields(
        normalizedQuery,
        tokens,
        fields
      );

      const summary = description ?? "Empresa exportadora registrada.";
      const kind = hasProductSignal ? "product" : "company";
      const title = kind === "product" && product ? product : companyName;

      acc.push({
        id: row.id,
        kind,
        title,
        companyName,
        summary,
        contactName,
        email,
        sector,
        product,
        keywords,
        matchedFields,
        matchScore: score
      });

      return acc;
    }, [])
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return {
    query,
    total: scoredResults.length,
    results: scoredResults
  };
};