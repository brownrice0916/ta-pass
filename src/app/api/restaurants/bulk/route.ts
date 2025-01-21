import { prisma } from "@/lib/prisma";
import { Restaurant } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const dataStr = formData.get("data") as string;
    const restaurants = JSON.parse(dataStr);

    // 배치 크기 설정
    const batchSize = 10;
    const results = [];

    // 배치 단위로 처리
    for (let i = 0; i < restaurants.length; i += batchSize) {
      const batch = restaurants.slice(i, i + batchSize);

      // 트랜잭션으로 배치 처리
      const batchResults = await prisma.$transaction(
        batch.map((restaurant: Restaurant) => {
          return prisma.restaurant.create({
            data: {
              ...restaurant,
              socialLinks: restaurant.socialLinks || [],
            },
          });
        })
      );

      results.push(...batchResults);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
    });
  } catch (error) {
    console.error("Error in bulk import:", (error as Error).message || error);
    return NextResponse.json(
      { error: "Failed to import restaurants" },
      { status: 500 }
    );
  }
}
