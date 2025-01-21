import { Restaurant } from "@prisma/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const ITEMS_PER_PAGE = 10;

interface PageMetadata {
  hasMore: boolean;
  totalCount: number;
}

interface RestaurantPage {
  restaurants: Restaurant[];
  metadata: PageMetadata;
}
// hooks/useRestaurants.ts 수정
export function useRestaurants(
  latitude: number,
  longitude: number,
  searchQuery?: string // 검색어 파라미터 추가
) {
  const fetchRestaurants = useCallback(
    async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: "1",
        page: pageParam.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      // 검색어가 있는 경우에만 추가
      if (searchQuery) {
        searchParams.append("q", searchQuery);
      }

      const response = await fetch(
        `/api/restaurants?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      return response.json() as Promise<RestaurantPage>;
    },
    [latitude, longitude, searchQuery]
  );

  return useInfiniteQuery({
    queryKey: ["restaurants", latitude, longitude, searchQuery] as const,
    queryFn: fetchRestaurants,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.metadata.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });
}
