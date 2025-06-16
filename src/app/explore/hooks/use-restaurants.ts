import { Restaurant } from "@prisma/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const ITEMS_PER_PAGE = 10;

interface PageMetadata {
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface RestaurantPage {
  restaurants: Restaurant[];
  metadata: PageMetadata;
}

// hooks/useRestaurants.ts
export function useRestaurants(
  latitude: number,
  longitude: number,
  searchQuery?: string,
  sortOption: string = "distance",
  locationMode: string = "user",
  mainCategory?: string,
  subCategory?: string,
  region?: string,
  tags?: string[],
  mapBounds?: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  },
  specialOfferTypes: string[] = [] // ✅ 추가!
) {
  const fetchRestaurants = useCallback(
    async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        page: pageParam.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort: sortOption,
        mode: locationMode,
      });

      // 검색어 추가
      if (searchQuery) {
        searchParams.append("q", searchQuery);
      }

      // 카테고리 추가
      if (mainCategory && mainCategory !== "전체" && mainCategory !== "all") {
        searchParams.append("category", mainCategory);
      }

      // 서브카테고리 추가
      if (subCategory && subCategory !== "전체" && subCategory !== "all") {
        searchParams.append("subCategory", subCategory);
      }

      // 지역 추가
      if (region && region !== "지역 전체" && region !== "전체") {
        searchParams.append("region", region);
      }

      if (specialOfferTypes && specialOfferTypes.length > 0) {
        searchParams.append("specialOfferType", specialOfferTypes.join(","));
      }
      // 태그 필터 추가
      if (tags && tags.length > 0) {
        searchParams.append("tags", tags.join(","));
      }

      // 지도 경계 파라미터 추가 (locationMode가 map일 때만)
      if (locationMode === "map" && mapBounds) {
        searchParams.append("neLat", mapBounds.neLat.toString());
        searchParams.append("neLng", mapBounds.neLng.toString());
        searchParams.append("swLat", mapBounds.swLat.toString());
        searchParams.append("swLng", mapBounds.swLng.toString());
      }

      // 디버깅용 로그
      console.log(
        `Fetching restaurants with params: ${searchParams.toString()}`
      );

      try {
        const response = await fetch(
          `/api/restaurants?${searchParams.toString()}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(
            `Failed to fetch restaurants: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();
        console.log("API response:", data);
        return data as RestaurantPage;
      } catch (error) {
        console.error("Error in fetch:", error);
        throw error;
      }
    },
    [
      latitude,
      longitude,
      searchQuery,
      sortOption,
      locationMode,
      mainCategory,
      subCategory,
      region,
      tags,
      mapBounds,
      specialOfferTypes,
    ]
  );

  return useInfiniteQuery({
    queryKey: [
      "restaurants",
      latitude,
      longitude,
      searchQuery,
      sortOption,
      locationMode,
      mainCategory,
      subCategory,
      region,
      tags,
      mapBounds ? JSON.stringify(mapBounds) : null,
      specialOfferTypes, // ✅ 여기에 추가
    ] as const,
    queryFn: fetchRestaurants,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.metadata.hasMore ? lastPage.metadata.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
}
