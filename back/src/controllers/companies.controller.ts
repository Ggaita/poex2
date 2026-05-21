import type { Request, Response } from "express";
import { mockCompanies } from "../data/mockCompanies";

export const getCompanies = (req: Request, res: Response) => {
  res.json(mockCompanies);
};