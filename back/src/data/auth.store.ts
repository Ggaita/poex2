import { UserRole as PrismaUserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import type { AuthUser, LoginInput, LoginRole } from "../types/auth.types";

type LoginError = "invalid_credentials" | "inactive_user";
type LoginResult =
  | { user: AuthUser; error?: never }
  | { user?: never; error: LoginError };

const toApiRole = (role: PrismaUserRole): LoginRole => {
  switch (role) {
    case PrismaUserRole.admin:
      return "admin";
    case PrismaUserRole.empresa:
      return "empresa";
  }
};

export const loginWithCredentials = async (
  input: LoginInput
): Promise<LoginResult> => {
  const user = await prisma.appUser.findFirst({
    where: {
      email: {
        equals: input.email,
        mode: "insensitive"
      },
      role: input.role
    }
  });

  if (!user) {
    return { error: "invalid_credentials" };
  }

  if (!user.isActive) {
    return { error: "inactive_user" };
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    return { error: "invalid_credentials" };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: toApiRole(user.role),
      displayName: user.displayName
    }
  };
};
