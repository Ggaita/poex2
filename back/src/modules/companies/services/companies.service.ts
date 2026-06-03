import { listPublicProfiles } from "../../profiles/services/profiles.service";

export const listCompanies = async () => {
  return listPublicProfiles();
};
