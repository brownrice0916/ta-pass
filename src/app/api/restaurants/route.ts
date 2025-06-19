import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";

// BigInt를 JSON으로 직렬화하기 위한 함수
function replaceBigInt(key: string, value: any) {
  return typeof value === "bigint" ? Number(value) : value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("latitude") || "0");
  const lng = parseFloat(searchParams.get("longitude") || "0");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const region = searchParams.get("region");
  const rawTags = searchParams.get("tags")?.split(",") || [];
  const tags = searchParams.get("tags")?.split(",") || [];
  const sort = searchParams.get("sort") || "distance";
  const locationMode = searchParams.get("mode") || "user";
  const rawOfferTypes = searchParams.get("specialOfferType")?.split(",") || [];
  const specialOfferType = rawOfferTypes.filter(Boolean);

  const neLat = parseFloat(searchParams.get("neLat") || "0");
  const neLng = parseFloat(searchParams.get("neLng") || "0");
  const swLat = parseFloat(searchParams.get("swLat") || "0");
  const swLng = parseFloat(searchParams.get("swLng") || "0");

  const hasValidBounds =
    neLat !== 0 && neLng !== 0 && swLat !== 0 && swLng !== 0;

  try {
    const whereCondition: Prisma.RestaurantWhereInput = {
      ...(category && category !== "전체" && category !== "all"
        ? { category }
        : {}),
      ...(subCategory && subCategory !== "전체" && subCategory !== "all"
        ? { subCategory }
        : {}),
      ...(region && region !== "전체"
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
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(locationMode === "map" && hasValidBounds
        ? {
            latitude: { gte: swLat, lte: neLat },
            longitude: { gte: swLng, lte: neLng },
          }
        : {}),
    };

    const allMatchingRestaurants = await prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        bookmarks: { select: { id: true } },
        reviews: { select: { tags: true } },
      },
    });

    const filtered = allMatchingRestaurants.filter((restaurant) => {
      const hasAllOfferTypes =
        specialOfferType.length === 0 ||
        (Array.isArray(restaurant.specialOfferType) &&
          specialOfferType.every((type) =>
            restaurant.specialOfferType.includes(type)
          ));

      const reviewTags = restaurant.reviews.flatMap((r) => r.tags);
      const hasAllTags =
        tags.length === 0 || tags.every((tag) => reviewTags.includes(tag));

      return hasAllOfferTypes && hasAllTags;
    });

    const restaurantsWithTagCounts = filtered.map((restaurant) => {
      const reviewTags = restaurant.reviews.flatMap((r) => r.tags);
      const tagCount = tags.reduce(
        (acc, tag) => acc + reviewTags.filter((t) => t === tag).length,
        0
      );
      const distance = calculateDistance(
        lat,
        lng,
        restaurant.latitude,
        restaurant.longitude
      );

      return {
        ...restaurant,
        tagCount,
        bookmarkCount: restaurant.bookmarks.length,
        reviewCount: restaurant.reviews.length,
        distance,
        tags: reviewTags,
      };
    });

    let sortedRestaurants;
    switch (sort) {
      case "rating":
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) => (b.rating || 0) - (a.rating || 0)
        );
        break;
      case "bookmark":
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) => b.bookmarkCount - a.bookmarkCount
        );
        break;
      case "review":
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) => b.reviewCount - a.reviewCount
        );
        break;
      case "latest":
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "tag_count":
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) => b.tagCount - a.tagCount || a.distance - b.distance
        );
        break;
      default:
        sortedRestaurants = restaurantsWithTagCounts.sort(
          (a, b) => a.distance - b.distance
        );
        break;
    }

    const paginatedRestaurants = sortedRestaurants.slice(skip, skip + limit);

    return new NextResponse(
      JSON.stringify(
        {
          restaurants: paginatedRestaurants,
          tagFilters: tags,
          metadata: {
            currentPage: page,
            totalPages: Math.ceil(sortedRestaurants.length / limit),
            totalCount: sortedRestaurants.length,
            hasMore: skip + limit < sortedRestaurants.length,
          },
        },
        replaceBigInt
      ),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch restaurants",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// 거리 계산 함수
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST 함수는 변경 없음
export async function POST(request: Request) {
  // 기존 코드 유지
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

    // Parse necessary fields
    let tagsArray: string[] = [];
    if (placeData.tags) {
      if (Array.isArray(placeData.tags)) {
        tagsArray = placeData.tags;
      } else if (typeof placeData.tags === "string") {
        tagsArray = placeData.tags
          .split(",")
          .map((item: string) => item.trim());
      }
    }

    let specialOfferTypeArray: string[] = [];
    if (placeData.specialOfferType) {
      if (Array.isArray(placeData.specialOfferType)) {
        specialOfferTypeArray = placeData.specialOfferType;
      } else if (typeof placeData.specialOfferType === "string") {
        specialOfferTypeArray = placeData.specialOfferType
          .split(",")
          .map((item: string) => item.trim());
      }
    }

    let languagesArray: string[] = [];
    if (placeData.languages) {
      if (Array.isArray(placeData.languages)) {
        languagesArray = placeData.languages;
      } else if (typeof placeData.languages === "string") {
        languagesArray = placeData.languages
          .split(",")
          .map((item: string) => item.trim());
      }
    }

    // 소셜 링크 처리
    let socialLinksObj: any;
    if (placeData.socialLinks) {
      try {
        if (typeof placeData.socialLinks === "string") {
          socialLinksObj = JSON.parse(placeData.socialLinks);
        } else {
          socialLinksObj = placeData.socialLinks;
        }
      } catch (e) {
        console.error("Error parsing socialLinks:", e);
        socialLinksObj = {};
      }
    } else {
      socialLinksObj = {};
    }

    // 지역 정보 추출
    const region1 = placeData.region1 || "";
    const region2 = placeData.region2 || "";
    const region3 = placeData.region3 || "";
    const region4 = placeData.region4 || "";

    // Upload images
    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        if (!(file instanceof File)) return null;

        const filename = `${Date.now()}_${file.name.replace(
          /[^a-zA-Z0-9.]/g,
          ""
        )}`;
        const blob = await put(`restaurants/${filename}`, file, {
          access: "public",
        });
        return blob.url;
      })
    ).then((urls) => urls.filter((url) => url !== null) as string[]);

    // 추가 태그 목록에 지역 정보 추가 (중복 제거)
    const combinedTags = Array.from(
      new Set([
        ...tagsArray,
        ...(region1 ? [region1] : []),
        ...(region2 ? [region2] : []),
        ...(region3 ? [region3] : []),
      ])
    );

    // 만족도, 가성비 등 기본 태그 추가
    if (placeData.satisfaction) combinedTags.push("만족도");
    if (placeData.valueForMoney) combinedTags.push("가성비");
    if (placeData.benefits) combinedTags.push("혜택만족");
    if (placeData.locationConvenience) combinedTags.push("위치편의성");
    if (placeData.productFeatures) combinedTags.push("상품특성");
    if (placeData.recommendation) combinedTags.push("추천의향");

    // Create restaurant with processed data
    const restaurant = await prisma.restaurant.create({
      data: {
        name: placeData.name,
        description: placeData.description || "",
        about: placeData.about || "",
        address: placeData.address,
        addressDetail: placeData.addressDetail || "",
        latitude: parseFloat(placeData.latitude),
        longitude: parseFloat(placeData.longitude),
        category: placeData.category,
        subCategory: placeData.subCategory || null,
        rating: placeData.rating ? parseFloat(placeData.rating) : 0,
        specialOfferText: placeData.specialOfferText || "",
        specialOfferTextDetail: placeData.specialOfferTextDetail || "",
        images: imageUrls,
        languages: languagesArray,
        socialLinks: socialLinksObj,
        region1,
        region2,
        region3,
        region4,
        specialOfferType: specialOfferTypeArray,
        tags: combinedTags,
        openingHoursText: placeData.openingHoursText || null,
      },
    });

    // BigInt 처리를 위한 커스텀 직렬화 사용
    return new NextResponse(JSON.stringify(restaurant, replaceBigInt), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json(
      {
        error: "Failed to create restaurant",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
