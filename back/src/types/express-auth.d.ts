import type { AuthTokenPayload } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

export {};
