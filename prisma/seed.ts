import { PrismaClient } from '@prisma/client';
import { PRODUCTS, FEATURED_DROPS } from '../src/data/products';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  console.log('Clearing existing database records...');
  try {
    await (prisma as any).orderItem?.deleteMany();
  } catch {}

  try {
    await (prisma as any).product?.deleteMany();
  } catch {}

  console.log('Creating categories in Neon Postgres...');

  const allCategories = Array.from(
    new Set([
      ...PRODUCTS.map((p) => p.category),
      ...FEATURED_DROPS.map((p) => p.category),
    ])
  );

  const categoryMap: Record<string, any> = {};

  for (const catName of allCategories) {
    const slug = slugify(catName);
    const category = await (prisma as any).category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        slug: slug,
      },
    });
    categoryMap[catName] = category;
  }

  console.log('Seeding products to Neon Postgres...');

  // Combine both catalogs with unique IDs
  const allItems = [
    ...PRODUCTS,
    ...FEATURED_DROPS.filter((drop) => !PRODUCTS.some((p) => p.id === drop.id)),
  ];

  for (const item of allItems) {
    const categoryRecord = categoryMap[item.category];

    await (prisma.product as any).upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        title: item.title,
        price: Number(item.price),
        categoryId: categoryRecord?.id,
        images: [item.image],
        description: item.description,
        stock: 50,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });