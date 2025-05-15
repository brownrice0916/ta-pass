import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma, Restaurant } from "@prisma/client";

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

  const sort = searchParams.get("sort") || "distance"; // 기본값은 거리순

  console.log("Category API Parameters:", {
    category,
    subCategory,
    region,
    query,
    page,
    limit,
    sort,
  });

  try {
    // 1. 기본 where 조건 구성
    const whereCondition: Prisma.RestaurantWhereInput = {};

    // 2. 카테고리 필터
    if (category && category !== "") {
      whereCondition.category = category;
    }

    // 3. 서브카테고리 필터
    if (subCategory && subCategory !== "all") {
      whereCondition.subCategory = subCategory;
    }

    // 4. 검색어 필터
    if (query && query.trim()) {
      whereCondition.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { subCategory: { contains: query, mode: "insensitive" } },
      ] as Prisma.RestaurantWhereInput[];
    }

    // 5. 지역 필터
    if (region && region !== "지역 전체") {
      // 타입 명시
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

      // OR 조건이 이미 있는 경우 처리
      if (whereCondition.OR) {
        // 기존 OR 조건을 저장
        const existingOR = whereCondition.OR;
        // AND 조건으로 변환 (하나는 기존 OR, 하나는 지역 OR)
        whereCondition.AND = [
          { OR: existingOR },
          { OR: regionCondition },
        ] as Prisma.RestaurantWhereInput[];
        // 원래 OR 삭제
        delete whereCondition.OR;
      } else {
        whereCondition.OR = regionCondition;
      }
    }

    // 6. 지도 경계 필터
    if (neLat && neLng && swLat && swLng) {
      whereCondition.latitude = { gte: swLat, lte: neLat };
      whereCondition.longitude = { gte: swLng, lte: neLng };
    }

    // 총 개수 계산
    const totalCount = await prisma.restaurant.count({
      where: whereCondition,
    });

    // 일단 필요한 모든 레스토랑 ID를 먼저 가져오기
    const allRestaurants = await prisma.restaurant.findMany({
      where: whereCondition,
      select: { id: true },
    });

    const restaurantIds = allRestaurants.map((r) => r.id);

    // 북마크 및 리뷰 수 가져오기
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

    // 데이터 매핑
    const bookmarkMap = new Map<string, number>();
    bookmarkCounts.forEach((bc) => {
      bookmarkMap.set(bc.restaurantId, Number(bc._count.id));
    });

    const reviewMap = new Map<string, number>();
    reviewCounts.forEach((rc) => {
      reviewMap.set(rc.restaurantId, Number(rc._count.id));
    });

    // 거리 계산 함수
    function calculateDistance(
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number {
      const R = 6371; // 지구 반경 (km)
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
    }

    // 모든 레스토랑 상세 정보 가져오기
    const restaurantsDetails = await prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
    });

    // 확장된 레스토랑 인터페이스 정의
    interface EnrichedRestaurant extends Restaurant {
      bookmarkCount: number;
      reviewCount: number;
      distance: number;
    }

    // 모든 레스토랑에 북마크/리뷰 수 및 거리 추가
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

    // 전체 데이터 정렬
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
      default: // distance
        sortedRestaurants.sort((a, b) => a.distance - b.distance);
    }

    // 페이지네이션 적용
    const paginatedResults = sortedRestaurants.slice(skip, skip + limit);

    // JSON 직렬화 전에 모든 BigInt 값을 Number로 변환하는 함수
    function replaceBigInt(key: string, value: any): any {
      if (typeof value === "bigint") {
        return Number(value);
      }
      return value;
    }

    // BigInt를 Number로 변환하여 JSON 직렬화
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
    // 타입 지정
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
