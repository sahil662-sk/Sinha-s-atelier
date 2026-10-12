import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function GET(request: Request) {
  try {
    if (!prisma?.product) {
      return NextResponse.json({ success: true, products: [], categories: [] });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const where: any = {};

    // 1. Category Filter
    if (category && category.toLowerCase() !== 'all') {
      where.category = {
        slug: category.toLowerCase(),
      };
    }

    // 2. Search Query Filter
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // 3. Featured Filter
    if (featured === 'true') {
      where.featured = true;
    }

    // Query 1: Fetch Products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Query 2: Fetch Categories safely (Sequential to avoid Neon connection lock)
    let categories: any[] = [];
    if (prisma?.category) {
      try {
        categories = await prisma.category.findMany({
          orderBy: {
            name: 'asc',
          },
        });
      } catch (catErr) {
        console.warn('Category fetch fallback triggered:', catErr);
      }
    }

    // Format products for storefront
    const formatted = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: Number(p.price),
      stock: Number(p.stock ?? 0),
      image: p.image || (p.images && p.images[0]) || '',
      images: p.images || [],
      featured: p.featured,
      category: p.category?.name || 'Atelier Masterpiece',
      categorySlug: p.category?.slug || '',
    }));

    return NextResponse.json(
      { success: true, products: formatted, categories },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('Error fetching catalog products:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}