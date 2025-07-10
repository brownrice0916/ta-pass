import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma, Restaurant } from "@prisma/client";

// GET /api/category
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const categoryKey = searchParams.get("category");
  const subCategoryKey = searchParams.get("subCategory");
  const region = searchParams.get("region");

  const neLat = parseFloat(searchParams.get("neLat") || "0");
  const neLng = parseFloat(searchParams.get("neLng") || "0");
  const swLat = parseFloat(searchParams.get("swLat") || "0");
  const swLng = parseFloat(searchParams.get("swLng") || "0");

  const sort = searchParams.get("sort") || "distance";

  console.log("Category API Parameters:", {
    categoryKey,
    subCategoryKey,
    region,
    query,
    page,
    limit,
    sort,
  });

  try {
    const whereCondition: Prisma.RestaurantWhereInput = {};

    // 카테고리 key → id 조회
    if (categoryKey && categoryKey !== "") {
      const found = await prisma.category.findUnique({
        where: { key: categoryKey },
        select: { id: true },
      });
      if (found?.id) {
        whereCondition.categoryId = found.id;
      }
    }

    // 서브카테고리 key → id 조회
    if (subCategoryKey && subCategoryKey !== "all") {
      const found = await prisma.subCategory.findUnique({
        where: { key: subCategoryKey },
        select: { id: true },
      });
      if (found?.id) {
        whereCondition.subCategoryId = found.id;
      }
    }

    // 검색어 필터
    if (query && query.trim()) {
      whereCondition.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ] as Prisma.RestaurantWhereInput[];
    }

    // 지역 필터
    if (region && region !== "지역 전체") {
      const regionCondition: Prisma.RestaurantWhereInput[] = [
        {
          region1: {
            contains: region,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          region2: {
            contains: region,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          region3: {
            contains: region,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          address: {
            contains: region,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ];

      if (whereCondition.OR) {
        const existingOR = whereCondition.OR;
        whereCondition.AND = [
          { OR: existingOR },
          { OR: regionCondition },
        ] as Prisma.RestaurantWhereInput[];
        delete whereCondition.OR;
      } else {
        whereCondition.OR = regionCondition;
      }
    }

    // 지도 범위 필터
    if (neLat && neLng && swLat && swLng) {
      whereCondition.latitude = { gte: swLat, lte: neLat };
      whereCondition.longitude = { gte: swLng, lte: neLng };
    }

    const totalCount = await prisma.restaurant.count({
      where: whereCondition,
    });

    const allRestaurants = await prisma.restaurant.findMany({
      where: whereCondition,
      select: { id: true },
    });

    const restaurantIds = allRestaurants.map((r) => r.id);

    const bookmarkCounts = await prisma.bookmark.groupBy({
      by: ["restaurantId"],
      _count: { id: true },
      where: { restaurantId: { in: restaurantIds } },
    });

    const reviewCounts = await prisma.review.groupBy({
      by: ["restaurantId"],
      _count: { id: true },
      where: { restaurantId: { in: restaurantIds } },
    });

    const bookmarkMap = new Map<string, number>();
    bookmarkCounts.forEach((bc) => {
      bookmarkMap.set(bc.restaurantId, Number(bc._count.id));
    });

    const reviewMap = new Map<string, number>();
    reviewCounts.forEach((rc) => {
      reviewMap.set(rc.restaurantId, Number(rc._count.id));
    });

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const restaurantsDetails = await prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
    });

    interface EnrichedRestaurant extends Restaurant {
      bookmarkCount: number;
      reviewCount: number;
      distance: number;
    }

    const enrichedRestaurants: EnrichedRestaurant[] = restaurantsDetails.map(
      (restaurant) => {
        const distance = calculateDistance(
          lat,
          lng,
          restaurant.latitude,
          restaurant.longitude
        );
        return {
          ...restaurant,
          bookmarkCount: bookmarkMap.get(restaurant.id) || 0,
          reviewCount: reviewMap.get(restaurant.id) || 0,
          distance,
        };
      }
    );

    let sortedRestaurants = [...enrichedRestaurants];
    switch (sort) {
      case "rating":
        sortedRestaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "bookmark":
        sortedRestaurants.sort((a, b) => b.bookmarkCount - a.bookmarkCount);
        break;
      case "review":
        sortedRestaurants.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        sortedRestaurants.sort((a, b) => a.distance - b.distance);
    }

    const paginatedResults = sortedRestaurants.slice(skip, skip + limit);

    function replaceBigInt(key: string, value: any): any {
      if (typeof value === "bigint") return Number(value);
      return value;
    }

    return new NextResponse(
      JSON.stringify(
        {
          restaurants: paginatedResults,
          metadata: {
            currentPage: page,
            totalPages: Math.ceil(Number(totalCount) / limit),
            totalCount: Number(totalCount),
            hasMore: skip + paginatedResults.length < Number(totalCount),
          },
        },
        replaceBigInt
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching category data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch category data",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
