import { PrismaClient, Role, GarmentStatus, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const mockGarments = [
  {
    titulo: 'Chaqueta Levi\'s 501 Vintage',
    descripcion: 'Chaqueta de jean clásica Levi\'s en excelente estado. Talla M, color azul índigo.',
    marca: "Levi's",
    talla: 'M',
    categoria: 'Chaquetas',
    estilo: 'Casual',
    precio: 250,
    imagenes: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    ],
  },
  {
    titulo: 'Vestido Floral Zara',
    descripcion: 'Vestido midi floral de Zara, temporada primavera. Usado 2 veces, como nuevo.',
    marca: 'Zara',
    talla: 'S',
    categoria: 'Vestidos',
    estilo: 'Casual',
    precio: 120,
    imagenes: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    ],
  },
  {
    titulo: 'Zapatillas Nike Air Max 90',
    descripcion: 'Nike Air Max 90 en colorway blanco/negro. Talla 42. Muy buen estado.',
    marca: 'Nike',
    talla: '42',
    categoria: 'Calzado',
    estilo: 'Deportivo',
    precio: 380,
    imagenes: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    ],
  },
  {
    titulo: 'Blazer H&M Negro',
    descripcion: 'Blazer formal negro de H&M. Perfecto para el trabajo. Talla L.',
    marca: 'H&M',
    talla: 'L',
    categoria: 'Blazers',
    estilo: 'Formal',
    precio: 180,
    imagenes: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4b3571?w=400',
    ],
  },
  {
    titulo: 'Sweater Oversized Vintage',
    descripcion: 'Sweater oversized de lana vintage años 90. Color burgundy, talla única.',
    marca: 'Sin marca',
    talla: 'Única',
    categoria: 'Sweaters',
    estilo: 'Vintage',
    precio: 95,
    imagenes: [
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400',
    ],
  },
  {
    titulo: 'Jean Skinny Pull&Bear',
    descripcion: 'Jean skinny azul oscuro Pull&Bear. Talla 28. Poco uso.',
    marca: 'Pull&Bear',
    talla: '28',
    categoria: 'Pantalones',
    estilo: 'Casual',
    precio: 85,
    imagenes: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    ],
  },
  {
    titulo: 'Camisa Hawaiana Resortera',
    descripcion: 'Camisa hawaiana vintage 100% algodón. Colores vibrantes, talla M.',
    marca: 'Vintage',
    talla: 'M',
    categoria: 'Camisas',
    estilo: 'Retro',
    precio: 75,
    imagenes: [
      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400',
    ],
  },
  {
    titulo: 'Bolso Coach Signature',
    descripcion: 'Bolso Coach estampado signature marrón/beige. Auténtico, con certificado.',
    marca: 'Coach',
    talla: 'Única',
    categoria: 'Accesorios',
    estilo: 'Clásico',
    precio: 650,
    imagenes: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Crear usuario vendedor demo
  const seller = await prisma.user.upsert({
    where: { walletAddress: '0xdemo0000000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0xdemo0000000000000000000000000000000000001',
      nombre: 'ReWear Demo',
      email: 'demo@rewear.com',
      ubicacion: 'Bolivia',
      rol: Role.SELLER,
    },
  });

  for (const garment of mockGarments) {
    const created = await prisma.garment.create({
      data: {
        ...garment,
        sellerId: seller.id,
        estado: GarmentStatus.VERIFIED,
        verificationStatus: VerificationStatus.APPROVED,
      },
    });

    await prisma.verification.create({
      data: {
        garmentId: created.id,
        aiScore: Math.random() * 20 + 80,
        authenticityPct: Math.random() * 10 + 88,
        wearLevel: ['Excelente', 'Muy bueno', 'Bueno'][Math.floor(Math.random() * 3)],
        dictamen: 'Prenda verificada. Autenticidad confirmada por IA.',
      },
    });
  }

  console.log(`Seed completado: ${mockGarments.length} prendas creadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
