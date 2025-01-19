import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// api/restaurants/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    // PostgreSQL의 경우 raw query를 사용한 거리 계산
    const restaurants: any[] = await prisma.$queryRaw`
      SELECT *,
        ( 6371 * acos( cos( radians(${lat}) ) * 
          cos( radians( latitude ) ) * 
          cos( radians( longitude ) - radians(${lng}) ) + 
          sin( radians(${lat}) ) * 
          sin( radians( latitude ) ) ) 
        ) AS distance
      FROM "Restaurant"
      WHERE ${query ?
        Prisma.sql`(name ILIKE ${`%${query}%`} OR category ILIKE ${`%${query}%`})`
        : Prisma.sql`1=1`}
      ORDER BY distance
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const totalCount = await prisma.restaurant.count({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          // ... 기타 검색 조건
        ]
      } : undefined,
    });

    return NextResponse.json({
      restaurants,
      metadata: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + restaurants.length < totalCount
      }
    });

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

    // 기존 placeData에서 region 정보를 직접 받도록 수정
    const { region1, region2, region3, region4 } = placeData;

    // Upload images
    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const blob = await put(`restaurants/${filename}`, file, {
          access: "public",
        });
        return blob.url;
      })
    );

    // Create restaurant with region information
    const restaurant = await prisma.restaurant.create({
      data: {
        ...placeData,
        region1,
        region2,
        region3,
        region4,
        images: imageUrls,
        languages: placeData.languages || [],
        socialLinks: placeData.socialLinks || [],
        tags: [...(placeData.tags || []), region1, region2, region3], // 지역 정보를 태그에도 추가
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