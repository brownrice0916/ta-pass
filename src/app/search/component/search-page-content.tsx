"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRestaurants } from "@/app/explore/hooks/use-restaurants";
import { RestaurantCard } from "./restaurant-card";

export default function SearchPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // useRestaurants 훅 사용
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useRestaurants(
      37.5665, // 서울 중심 좌표
      126.978,
      searchParams?.get("q") || undefined
    );

  const restaurants = data?.pages.flatMap((page) => page.restaurants) ?? [];
  const totalCount = data?.pages[0]?.metadata.totalCount ?? 0;

  // 무한 스크롤을 위한 ref 콜백
  const LoaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || isFetchingNextPage) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.trim();
      router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[393px]">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-primary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="relative flex-1">
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="name, category, tags, address"
                className="w-full pl-4 pr-10 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* 검색 결과 개수 */}
        <div className="ml-5 mt-4">
          {isLoading && restaurants.length === 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>검색 결과를 불러오는 중...</span>
            </div>
          ) : (
            <h2>
              관련 PASS 검색 결과{" "}
              <span className="text-primary font-bold">{totalCount}</span>개
            </h2>
          )}
        </div>

        {/* Search Results */}
        <div className="p-2">
          {/* 검색 결과 목록 */}
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              ref={index === restaurants.length - 1 ? LoaderRef : null}
            >
              <RestaurantCard
                restaurant={restaurant}
                onClick={() => router.push(`/explore/${restaurant.id}`)}
              />
            </div>
          ))}

          {/* 추가 로딩 상태 */}
          {isFetchingNextPage && (
            <div className="text-center py-4 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>더 많은 장소를 불러오는 중...</span>
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!isLoading && restaurants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
