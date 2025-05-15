import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3];

  if (!id) {
    return NextResponse.json(
      { error: "Restaurant ID is required" },
      { status: 400 }
    );
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3];

  if (!id) {
    return NextResponse.json(
      { error: "Restaurant ID is required" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const placeDataStr = formData.get("data") as string;
    const imageFiles = formData.getAll("images");

    if (!placeDataStr) {
      return NextResponse.json(
        { error: "No place data provided" },
        { status: 400 }
      );
    }

    const placeData = JSON.parse(placeDataStr);

    // Process images: keep existing URLs and upload new files
    const processedImageUrls = await Promise.all(
      imageFiles.map(async (image) => {
        if (typeof image === "string") {
          return image;
        } else if (image instanceof File) {
          const filename = `${Date.now()}_${image.name.replace(
            /[^a-zA-Z0-9.]/g,
            ""
          )}`;
          const blob = await put(`restaurants/${filename}`, image, {
            access: "public",
          });
          return blob.url;
        }
        return null;
      })
    );

    // Filter out null values and convert to string array
    const imageUrls = processedImageUrls.filter(
      (url): url is string => url !== null
    );

    // Update restaurant with new data and image URLs
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: placeData.name,
        address: placeData.address,
        addressDetail: placeData.addressDetail || "",
        category: placeData.category,
        description: placeData.description,
        about: placeData.about || "",
        specialOfferType: placeData.specialOfferType || "none",
        specialOfferText: placeData.specialOfferText || "",
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        rating: placeData.rating || 0,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        languages: placeData.languages || [], // 추가
        socialLinks: placeData.socialLinks || [], // 추가
        tags: placeData.tags || [], // 추가된 부분
        region1: placeData.region1,
        region2: placeData.region2,
        region3: placeData.region3,
        region4: placeData.region4 || "",
      },
    });

    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}
