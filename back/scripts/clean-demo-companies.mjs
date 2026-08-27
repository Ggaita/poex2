/**
 * Limpieza de empresas demo (o de todos los perfiles).
 *
 * Uso:
 *   node scripts/clean-demo-companies.mjs
 *   node scripts/clean-demo-companies.mjs all-profiles
 *
 * npm:
 *   npm run clean:demo-companies
 *   npm run clean:all-profiles
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_SLUGS = [
  "algodon-chaqueno-exporta",
  "mieles-del-impenetrable",
  "quebracho-forestal-chaquena",
  "quebracho-forestal-chaquena-sa"
];

const DEMO_NAME_FRAGMENTS = [
  "Algodón Chaqueño Exporta",
  "Algodon Chaqueno Exporta",
  "Mieles del Impenetrable",
  "Quebracho Forestal Chaqueña",
  "Quebracho Forestal Chaquena"
];

const mode = (process.argv[2] || "demos").toLowerCase();

const run = async () => {
  if (mode === "all-profiles") {
    const products = await prisma.companyProduct.deleteMany({});
    const visibility = await prisma.companyProfileVisibility.deleteMany({});
    const audits = await prisma.companyProfileAuditLog.deleteMany({});

    await prisma.specialRequest.updateMany({
      data: { profileId: null },
      where: { profileId: { not: null } }
    });
    await prisma.emailOutbox.updateMany({
      data: { recipientProfileId: null },
      where: { recipientProfileId: { not: null } }
    });

    const profiles = await prisma.companyProfile.deleteMany({});

    console.log("OK: BD limpia de perfiles de empresa.");
    console.log(
      JSON.stringify(
        {
          profilesDeleted: profiles.count,
          productsDeleted: products.count,
          visibilityDeleted: visibility.count,
          auditsDeleted: audits.count
        },
        null,
        2
      )
    );
    console.log("Siguiente paso tipico: npm run seed:relevamiento");
    return;
  }

  const demos = await prisma.companyProfile.findMany({
    where: {
      OR: [
        { slug: { in: DEMO_SLUGS } },
        ...DEMO_NAME_FRAGMENTS.map((name) => ({
          companyName: { contains: name, mode: "insensitive" }
        }))
      ]
    },
    select: {
      id: true,
      slug: true,
      companyName: true,
      _count: { select: { products: true } }
    }
  });

  if (demos.length === 0) {
    console.log("No habia empresas demo para borrar.");
    return;
  }

  console.log("Se van a borrar:");
  for (const row of demos) {
    console.log(
      ` - #${row.id} ${row.companyName} (${row.slug}) · ${row._count.products} productos`
    );
  }

  const ids = demos.map((row) => row.id);

  await prisma.specialRequest.updateMany({
    where: { profileId: { in: ids } },
    data: { profileId: null }
  });
  await prisma.emailOutbox.updateMany({
    where: { recipientProfileId: { in: ids } },
    data: { recipientProfileId: null }
  });

  // products / visibility / audit suelen ir en cascade al borrar el perfil
  const deleted = await prisma.companyProfile.deleteMany({
    where: { id: { in: ids } }
  });

  console.log(`OK: demos eliminadas: ${deleted.count}`);
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error limpiando demos:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
