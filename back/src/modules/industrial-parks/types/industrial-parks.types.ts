export type IndustrialParkView = {
  id: number;
  slug: string;
  name: string;
  administration?: string;
  progressStatus: string;
  locality: string;
  department?: string;
  yearCreated?: number;
  surfaceHa?: number;
  measuredPlots?: number;
  settledCompanies?: string;
  infrastructure?: string;
  renpiStatus?: string;
  observations?: string;
  sortOrder: number;
};
