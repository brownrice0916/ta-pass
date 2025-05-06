import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const restaurantId = formData.get("restaurantId") as string;
    const rating = Number(formData.get("rating"));
    const content = formData.get("content") as string;
    const tagsJson = formData.get("tags") as string;
    const tags = tagsJson ? JSON.parse(tagsJson) : [];
    const imageFiles = formData.getAll("images") as File[];

    if (!restaurantId || !rating || tags.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload each image and get URLs
    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const filename = `${Date.now()}_${file.name.replace(
          /[^a-zA-Z0-9.]/g,
          ""
        )}`;
        const blob = await put(`reviews/${filename}`, file, {
          access: "public",
        });
        return blob.url;
      })
    );

    // Create the review with image URLs and tags
    const review = await prisma.review.create({
      data: {
        restaurantId: restaurantId,
        rating,
        content,
        userId: Number(session.user.id),
        images: imageUrls, // Save array of image URLs
        tags: tags, // Save the selected tags
      },
      include: {
        user: true,
      },
    });

    // Update restaurant average rating
    const allReviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const averageRating =
        allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length;

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { rating: Number(averageRating.toFixed(1)) },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const restaurantId = url.searchParams.get("restaurantId");
    const userId = url.searchParams.get("userId");

    if (restaurantId) {
      // Get all reviews for a specific restaurant
      const reviews = await prisma.review.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(reviews, { status: 200 });
    }

    if (userId) {
      // Get reviews by a specific user (public profile)
      const reviews = await prisma.review.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
        include: {
          restaurant: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(reviews, { status: 200 });
    }

    // Get current user's reviews (requires auth)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUserId = Number(session.user.id);
    const userReviews = await prisma.review.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(userReviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE a review - only owner can delete their review
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const reviewId = url.searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // First check if the review belongs to the current user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check ownership
    if (review.userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete this review" },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate restaurant rating
    const restaurantId = review.restaurantId;
    const allReviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const averageRating =
        allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length;

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { rating: Number(averageRating.toFixed(1)) },
      });
    } else {
      // No reviews left, reset rating to 0
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { rating: 0 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
