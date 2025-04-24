import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract the `id` from the URL

  if (!id) {
    return NextResponse.json(
      { error: "Restaurant ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch all reviews for the given restaurant
    const reviews = await prisma.review.findMany({
      where: {
        restaurantId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Calculate the average rating if reviews exist
    if (reviews.length > 0) {
      const averageRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;

      // Update the restaurant's rating in the database
      await prisma.restaurant.update({
        where: {
          id: id,
        },
        data: {
          rating: averageRating,
        },
      });
    } else {
      // If there are no reviews, set the restaurant rating to 0
      await prisma.restaurant.update({
        where: {
          id: id,
        },
        data: {
          rating: 0,
        },
      });
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews or updating rating:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
