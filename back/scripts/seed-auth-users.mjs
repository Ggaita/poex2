import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
const companyEmail = process.env.SEED_EMPRESA_EMAIL ?? "empresa@poex.local";
const companyPassword = process.env.SEED_EMPRESA_PASSWORD ?? "Empresa1234!";

const seedUsers = async () => {
  const [adminHash, companyHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(companyPassword, 10)
  ]);

  await prisma.appUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: UserRole.admin,
      displayName: "Administrador POEX",
      isActive: true
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: UserRole.admin,
      displayName: "Administrador POEX",
      isActive: true
    }
  });

  await prisma.appUser.upsert({
    where: { email: companyEmail },
    update: {
      passwordHash: companyHash,
      role: UserRole.empresa,
      displayName: "Empresa Demo",
      isActive: true
    },
    create: {
      email: companyEmail,
      passwordHash: companyHash,
      role: UserRole.empresa,
      displayName: "Empresa Demo",
      isActive: true
    }
  });
};

seedUsers()
  .then(async () => {
    console.log("Usuarios de prueba actualizados:");
    console.log(`- admin: ${adminEmail} / ${adminPassword}`);
    console.log(`- empresa: ${companyEmail} / ${companyPassword}`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error al crear usuarios de prueba:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
