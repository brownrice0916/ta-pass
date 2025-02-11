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

    const formData = await request.formData(); // Correctly parse FormData
    const restaurantId = formData.get("restaurantId") as string;
    const rating = Number(formData.get("rating"));
    const content = formData.get("content") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!restaurantId || !rating || !content) {
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
    console.log("blob");

    // Create the review with image URLs
    const review = await prisma.review.create({
      data: {
        restaurantId: restaurantId,
        rating,
        content,
        userId: Number(session.user.id),
        images: imageUrls, // Save array of image URLs
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = Number(session.user.id); // Convert userId to a number

    const reviews = await prisma.review.findMany({
      where: {
        userId: userId, // Filter by userId
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        restaurant: true, // Include restaurant info
        user: true, // Include user info
      },
    });

    // If no reviews are found, return an empty array instead of an error
    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
