import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";

/**
 * Solo crea/actualiza el usuario administrador.
 * Los usuarios empresa se generan en seed:relevamiento a partir del CSV.
 */
const seedUsers = async () => {
  const adminHash = await bcrypt.hash(adminPassword, 10);

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

  // Limpia la cuenta demo empresa@poex.local si todavía existe.
  const demoEmpresa = await prisma.appUser.findFirst({
    where: {
      email: { equals: "empresa@poex.local", mode: "insensitive" },
      role: UserRole.empresa
    },
    select: { id: true }
  });

  if (demoEmpresa) {
    await prisma.companyProfile.updateMany({
      where: { ownerUserId: demoEmpresa.id },
      data: { ownerUserId: null }
    });
    await prisma.appUser.delete({ where: { id: demoEmpresa.id } });
    console.log("Eliminada cuenta demo empresa@poex.local");
  }
};

seedUsers()
  .then(async () => {
    console.log("Usuario admin actualizado:");
    console.log(`- admin: ${adminEmail} / ${adminPassword}`);
    console.log("Usuarios empresa: npm run seed:relevamiento (emails del CSV + clave auto)");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error al crear usuario admin:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
