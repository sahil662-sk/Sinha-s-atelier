import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const email = searchParams.get('email');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (!prisma?.review) {
      return NextResponse.json({ reviews: [], isVerifiedBuyer: false });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    let isVerifiedBuyer = false;
    let userExistingReview = null;

    if (email && prisma?.order) {
      const cleanEmail = email.trim().toLowerCase();

      const userExists = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (userExists) {
        // Strict check: Status MUST be DELIVERED
        const deliveredOrder = await prisma.order.findFirst({
          where: {
            email: cleanEmail,
            status: 'DELIVERED',
            items: {
              some: { productId },
            },
          },
        });

        if (deliveredOrder) {
          isVerifiedBuyer = true;
          userExistingReview = reviews.find(
            (r: any) => r.customerEmail.trim().toLowerCase() === cleanEmail
          );
        }
      }
    }

    const formattedReviews = reviews.map((r: any) => ({
      id: r.id,
      author: r.customerName,
      email: r.customerEmail,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      isVerifiedBuyer,
      userExistingReview: userExistingReview
        ? {
            id: userExistingReview.id,
            rating: userExistingReview.rating,
            comment: userExistingReview.comment,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, rating, comment, email, customerName, reviewId } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanComment = (comment || '').trim();
    const numRating = Number(rating) || 5;

    if (!productId || !cleanEmail || !cleanComment) {
      return NextResponse.json({ error: 'Product, email, and appraisal feedback required' }, { status: 400 });
    }

    if (!prisma?.review) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Only registered clients can leave appraisals' }, { status: 403 });
    }

    // Strict status verification
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        email: cleanEmail,
        status: 'DELIVERED',
        items: {
          some: { productId },
        },
      },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: 'Appraisals are restricted to collectors whose piece has been successfully DELIVERED.' },
        { status: 403 }
      );
    }

    const existingReview = reviewId
      ? await prisma.review.findUnique({ where: { id: reviewId } })
      : await prisma.review.findFirst({
          where: { productId, customerEmail: cleanEmail },
        });

    let savedReview;

    if (existingReview) {
      savedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numRating,
          comment: cleanComment,
          customerName: customerName || user.name || cleanEmail.split('@')[0].toUpperCase(),
        },
      });
    } else {
      savedReview = await prisma.review.create({
        data: {
          productId,
          rating: numRating,
          comment: cleanComment,
          customerName: customerName || user.name || cleanEmail.split('@')[0].toUpperCase(),
          customerEmail: cleanEmail,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isEdit: !!existingReview,
      review: {
        id: savedReview.id,
        author: savedReview.customerName,
        email: savedReview.customerEmail,
        rating: savedReview.rating,
        comment: savedReview.comment,
        createdAt: savedReview.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}