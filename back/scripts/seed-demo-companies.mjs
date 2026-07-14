import { PrismaClient, ProfileEditMode } from "@prisma/client";

const prisma = new PrismaClient();

const profileFieldKeys = [
  "companyName",
  "contactName",
  "contactEmail",
  "phone",
  "taxId",
  "description",
  "sector",
  "subSector",
  "product",
  "keywords",
  "tariffPosition",
  "exportDestinations",
  "awards",
  "certifications",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "otherLink",
  "address",
  "city",
  "googleMapsEmbed",
  "latitude",
  "longitude"
];

const visibleFields = new Set([
  "companyName",
  "contactName",
  "contactEmail",
  "phone",
  "description",
  "sector",
  "subSector",
  "product",
  "keywords",
  "tariffPosition",
  "exportDestinations",
  "website",
  "address",
  "city",
  "googleMapsEmbed",
  "latitude",
  "longitude"
]);

const demoCompanies = [
  {
    slug: "algodon-chaqueno-exporta",
    companyName: "Algodón Chaqueño Exporta SA",
    contactName: "María Benítez",
    contactEmail: "ventas@algodonchaqueno.com.ar",
    phone: "+54 362 470-1200",
    taxId: "30-71500111-7",
    description:
      "Empresa chaqueña dedicada a la industrialización de algodón y derivados para mercados regionales.",
    sector: "Textil",
    subSector: "Algodón e hilandería",
    keywords: "algodón, hilado, fibra, exportación, chaco",
    exportDestinations: "Brasil, Chile, Perú",
    website: "https://www.algodonchaqueno.com.ar",
    address: "Ruta Nacional 16 km 167, Presidencia Roque Sáenz Peña",
    city: "Presidencia Roque Sáenz Peña",
    latitude: -26.8124,
    longitude: -60.4481,
    products: [
      {
        name: "Hilado de algodón peinado",
        description:
          "Hilado para tejido plano y de punto con alto estándar de resistencia.",
        tariffPosition: "5205.12"
      },
      {
        name: "Fibra de algodón cardada",
        description: "Fibra lista para procesos de hilandería y mezclas textiles.",
        tariffPosition: "5203.00"
      },
      {
        name: "Aceite crudo de semilla de algodón",
        description: "Subproducto industrial para refinación alimentaria e insumos.",
        tariffPosition: "1512.21"
      }
    ]
  },
  {
    slug: "mieles-del-impenetrable",
    companyName: "Mieles del Impenetrable SRL",
    contactName: "Carlos Leiva",
    contactEmail: "comercial@mielesimpenetrable.com.ar",
    phone: "+54 362 476-3300",
    taxId: "30-71500222-5",
    description:
      "Productora apícola del norte chaqueño con foco en miel orgánica y derivados de la colmena.",
    sector: "Alimentos",
    subSector: "Apícola",
    keywords: "miel, apicultura, orgánico, cera, propóleo",
    exportDestinations: "España, Alemania, Emiratos Árabes Unidos",
    website: "https://www.mielesimpenetrable.com.ar",
    address: "Avenida Güemes 450, Juan José Castelli",
    city: "Juan José Castelli",
    latitude: -25.9471,
    longitude: -60.6192,
    products: [
      {
        name: "Miel multifloral orgánica a granel",
        description: "Miel natural de monte chaqueño con certificación orgánica.",
        tariffPosition: "0409.00"
      },
      {
        name: "Cera virgen de abeja",
        description: "Cera purificada para uso cosmético e industrial.",
        tariffPosition: "1521.90"
      },
      {
        name: "Extracto de propóleo",
        description: "Extracto concentrado de propóleo en base hidroalcohólica.",
        tariffPosition: "1302.19"
      }
    ]
  },
  {
    slug: "quebracho-forestal-chaquena",
    companyName: "Quebracho Forestal Chaqueña SA",
    contactName: "Luciano Ferreyra",
    contactEmail: "exportaciones@quebrachochaco.com.ar",
    phone: "+54 362 478-8844",
    taxId: "30-71500333-3",
    description:
      "Industria forestal orientada a productos de quebracho para curtiembres y energía renovable.",
    sector: "Forestal",
    subSector: "Derivados de quebracho",
    keywords: "quebracho, tanino, carbón vegetal, forestal",
    exportDestinations: "Italia, India, Uruguay",
    website: "https://www.quebrachochaco.com.ar",
    address: "Parque Industrial Barranqueras, Chaco",
    city: "Barranqueras",
    latitude: -27.4846,
    longitude: -58.939,
    products: [
      {
        name: "Extracto tánico de quebracho",
        description:
          "Extracto vegetal rico en taninos para curtido de cueros y procesos industriales.",
        tariffPosition: "3201.90"
      },
      {
        name: "Carbón vegetal premium",
        description: "Carbón de alta densidad para uso gastronómico e industrial.",
        tariffPosition: "4402.90"
      },
      {
        name: "Postes de quebracho tratado",
        description: "Postes para uso rural e infraestructura con tratamiento de larga vida útil.",
        tariffPosition: "4406.10"
      }
    ]
  }
];

const seedCompany = async (company) => {
  const productNames = company.products.map((product) => product.name).join(", ");
  const firstTariffPosition = company.products[0]?.tariffPosition ?? null;

  const profile = await prisma.companyProfile.upsert({
    where: { slug: company.slug },
    update: {
      companyName: company.companyName,
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      phone: company.phone,
      taxId: company.taxId,
      description: company.description,
      sector: company.sector,
      subSector: company.subSector,
      product: productNames,
      keywords: company.keywords,
      tariffPosition: firstTariffPosition,
      exportDestinations: company.exportDestinations,
      website: company.website,
      address: company.address,
      city: company.city,
      latitude: company.latitude,
      longitude: company.longitude,
      editMode: ProfileEditMode.mixed,
      isPublished: true
    },
    create: {
      slug: company.slug,
      companyName: company.companyName,
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      phone: company.phone,
      taxId: company.taxId,
      description: company.description,
      sector: company.sector,
      subSector: company.subSector,
      product: productNames,
      keywords: company.keywords,
      tariffPosition: firstTariffPosition,
      exportDestinations: company.exportDestinations,
      website: company.website,
      address: company.address,
      city: company.city,
      latitude: company.latitude,
      longitude: company.longitude,
      editMode: ProfileEditMode.mixed,
      isPublished: true
    }
  });

  await prisma.companyProfileVisibility.deleteMany({
    where: { profileId: profile.id }
  });
  await prisma.companyProfileVisibility.createMany({
    data: profileFieldKeys.map((fieldKey) => ({
      profileId: profile.id,
      fieldKey,
      isVisible: visibleFields.has(fieldKey)
    }))
  });

  await prisma.companyProduct.deleteMany({
    where: { profileId: profile.id }
  });
  await prisma.companyProduct.createMany({
    data: company.products.map((product) => ({
      profileId: profile.id,
      name: product.name,
      description: product.description,
      tariffPosition: product.tariffPosition,
      isTariffPositionUnknown: false,
      isAccepted: true,
      rejectionMessage: null,
      reviewedBy: "Seeder demo",
      reviewedAt: new Date()
    }))
  });

  return profile;
};

const run = async () => {
  for (const company of demoCompanies) {
    const profile = await seedCompany(company);
    console.log(`✅ Perfil demo actualizado: ${profile.companyName} (#${profile.id})`);
  }
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error al ejecutar seed demo:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
