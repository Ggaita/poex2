import type { Request, Response } from "express";
import { listCompanies } from "../services/companies.service";
export const getCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await listCompanies();
    res.json(rows);
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener las empresas publicadas"
    });
  }
};
