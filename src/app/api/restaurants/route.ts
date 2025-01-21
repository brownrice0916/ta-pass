import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Prisma } from "@prisma/client";

// api/restaurants/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "");
  const skip = (page - 1) * limit;

  // 지도 영역의 경계 좌표 받기
  const neLat = parseFloat(searchParams.get("neLat") || "0");
  const neLng = parseFloat(searchParams.get("neLng") || "0");
  const swLat = parseFloat(searchParams.get("swLat") || "0");
  const swLng = parseFloat(searchParams.get("swLng") || "0");

  try {
    let restaurants: any[];
    let totalCount: number;

    if (neLat && neLng && swLat && swLng) {
      // 경계 좌표가 제공되는 경우 - 지도 영역 내 데이터 필터링
      restaurants = await prisma.$queryRaw`
        SELECT *,
          ( 6371 * acos( cos( radians(${lat}) ) * 
            cos( radians( latitude ) ) * 
            cos( radians( longitude ) - radians(${lng}) ) + 
            sin( radians(${lat}) ) * 
            sin( radians( latitude ) ) ) 
          ) AS distance
        FROM "Restaurant"
        WHERE latitude BETWEEN ${swLat} AND ${neLat}
          AND longitude BETWEEN ${swLng} AND ${neLng}
          AND ${
            query
              ? Prisma.sql`(name ILIKE ${`%${query}%`} OR category ILIKE ${`%${query}%`})`
              : Prisma.sql`1=1`
          }
        ORDER BY distance
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      totalCount = await prisma.restaurant.count({
        where: {
          latitude: { gte: swLat, lte: neLat },
          longitude: { gte: swLng, lte: neLng },
          OR: query
            ? [
                { name: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                // ... 기타 검색 조건
              ]
            : undefined,
        },
      });
    } else {
      // 경계 좌표가 제공되지 않는 경우 - 현재 위치 기준으로 데이터 불러오기
      restaurants = await prisma.$queryRaw`
        SELECT *,
          ( 6371 * acos( cos( radians(${lat}) ) * 
            cos( radians( latitude ) ) * 
            cos( radians( longitude ) - radians(${lng}) ) + 
            sin( radians(${lat}) ) * 
            sin( radians( latitude ) ) ) 
          ) AS distance
        FROM "Restaurant"
        WHERE ${
          query
            ? Prisma.sql`(name ILIKE ${`%${query}%`} OR category ILIKE ${`%${query}%`})`
            : Prisma.sql`1=1`
        }
        ORDER BY distance
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      totalCount = await prisma.restaurant.count({
        where: query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                // ... 기타 검색 조건
              ],
            }
          : undefined,
      });
    }

    return NextResponse.json({
      restaurants,
      metadata: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + restaurants.length < totalCount,
      },
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
