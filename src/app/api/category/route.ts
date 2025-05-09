import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// GET /api/category
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 기본 필터링 매개변수
  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // 카테고리 필터링 매개변수
  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const region = searchParams.get("region");

  // 지도 경계값 (사용하는 경우)
  const neLat = parseFloat(searchParams.get("neLat") || "0");
  const neLng = parseFloat(searchParams.get("neLng") || "0");
  const swLat = parseFloat(searchParams.get("swLat") || "0");
  const swLng = parseFloat(searchParams.get("swLng") || "0");

  console.log("Category API Parameters:", {
    category,
    subCategory,
    region,
    query,
    page,
    limit,
  });

  try {
    // SQL 필터 구성
    const subCategoryFilter =
      subCategory && subCategory !== "all"
        ? Prisma.sql`AND "subCategory" = ${subCategory}`
        : Prisma.sql``;

    const categoryFilter =
      category && category !== ""
        ? Prisma.sql`AND "category" = ${category}`
        : Prisma.sql``;

    const queryFilter =
      query && query.trim()
        ? Prisma.sql`AND (name ILIKE ${`%${query}%`} OR "subCategory" ILIKE ${`%${query}%`})`
        : Prisma.sql``;

    // 지역 필터: region1, region2, region3 또는 주소에 지역명 포함
    const regionFilter =
      region && region !== "지역 전체"
        ? Prisma.sql`AND (
            region1 ILIKE ${`%${region}%`} OR 
            region2 ILIKE ${`%${region}%`} OR 
            region3 ILIKE ${`%${region}%`} OR
            address ILIKE ${`%${region}%`}
          )`
        : Prisma.sql``;

    let restaurants: any[];
    let totalCount;

    if (neLat && neLng && swLat && swLng) {
      // 지도 경계 내의 장소 검색 (경계값이 제공된 경우)
      restaurants = await prisma.$queryRaw`
        SELECT *,
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )) AS distance
        FROM "Restaurant"
        WHERE latitude BETWEEN ${swLat} AND ${neLat}
          AND longitude BETWEEN ${swLng} AND ${neLng}
          ${categoryFilter}
          ${subCategoryFilter}
          ${queryFilter}
          ${regionFilter}
        ORDER BY distance
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      totalCount = await prisma.restaurant.count({
        where: {
          latitude: { gte: swLat, lte: neLat },
          longitude: { gte: swLng, lte: neLng },
          ...(category ? { category } : {}),
          ...(subCategory && subCategory !== "all" ? { subCategory } : {}),
          ...(region && region !== "지역 전체"
            ? {
                OR: [
                  { region1: { contains: region, mode: "insensitive" } },
                  { region2: { contains: region, mode: "insensitive" } },
                  { region3: { contains: region, mode: "insensitive" } },
                  { address: { contains: region, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { subCategory: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });
    } else {
      // 일반 검색 (경계값 없는 경우)
      restaurants = await prisma.$queryRaw`
        SELECT *,
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )) AS distance
        FROM "Restaurant"
        WHERE 1=1
          ${categoryFilter}
          ${subCategoryFilter}
          ${queryFilter}
          ${regionFilter}
        ORDER BY distance
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      totalCount = await prisma.restaurant.count({
        where: {
          ...(category ? { category } : {}),
          ...(subCategory && subCategory !== "all" ? { subCategory } : {}),
          ...(region && region !== "지역 전체"
            ? {
                OR: [
                  { region1: { contains: region, mode: "insensitive" } },
                  { region2: { contains: region, mode: "insensitive" } },
                  { region3: { contains: region, mode: "insensitive" } },
                  { address: { contains: region, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { subCategory: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });
    }

    // 각 식당에 대한 리뷰 수 가져오기
    const restaurantIds = restaurants.map((restaurant) => restaurant.id);
    const reviewCounts = await prisma.review.groupBy({
      by: ["restaurantId"],
      _count: { id: true },
      where: { restaurantId: { in: restaurantIds } },
    });

    // 최종 결과에 리뷰 수 포함
    restaurants = restaurants.map((restaurant) => {
      const reviewCount = reviewCounts.find(
        (count) => count.restaurantId === restaurant.id
      );
      return { ...restaurant, reviewCount: reviewCount?._count?.id || 0 };
    });

    // 응답 반환
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
    console.error("Error fetching category data:", error);
    return NextResponse.json(
      { error: "Failed to fetch category data" },
      { status: 500 }
    );
  }
}
