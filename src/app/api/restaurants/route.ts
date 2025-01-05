import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const radius = parseFloat(searchParams.get("radius") || "1");

  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        reviews: true, // reviews 관계 데이터 포함
        _count: {
          select: {
            reviews: true, // 리뷰 개수도 함께 가져오기
          },
        },
      },
    });

    // 리뷰 개수와 평균 평점을 계산하여 데이터 가공
    const restaurantsWithReviewInfo = restaurants.map((restaurant) => ({
      ...restaurant,
      reviewCount: restaurant._count.reviews,
      rating:
        restaurant.reviews.length > 0
          ? restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) /
          restaurant.reviews.length
          : 0,
    }));

    return NextResponse.json(restaurantsWithReviewInfo);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const placeDataStr = formData.get("data") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!placeDataStr) {
      return NextResponse.json(
        { error: "No place data provided" },
        { status: 400 }
      );
    }

    const placeData = JSON.parse(placeDataStr);

    // Upload each image and get URLs
    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const filename = `${Date.now()}_${file.name.replace(
          /[^a-zA-Z0-9.]/g,
          ""
        )}`;
        const blob = await put(`restaurants/${filename}`, file, {
          access: "public",
        });
        return blob.url;
      })
    );

    // Create restaurant with image URLs and new fields
    const restaurant = await prisma.restaurant.create({
      data: {
        name: placeData.name,
        address: placeData.address,
        category: placeData.category,
        description: placeData.description,
        about: placeData.about || "",
        specialOfferType: placeData.specialOfferType || "none",
        specialOfferText: placeData.specialOfferText || "",
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        rating: placeData.rating || 0,
        images: imageUrls,
        languages: placeData.languageOptions || [], // 추가
        socialLinks: placeData.socialLinks || [], // 추가
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
