
// components/SearchPage.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Restaurant } from "@prisma/client";

export default function SearchPage() {
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState("");
    const [metaData, setMetaData] = useState<any>({});

    const observerRef = useRef<IntersectionObserver>(null);
    const lastRestaurantRef = useRef<HTMLDivElement | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                console.log('Loading more...', page + 1); // 디버깅용
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.1 });

        if (node) {
            observerRef.current.observe(node);
        }
    }, [isLoading, hasMore, page]);


    const fetchRestaurants = async (pageNumber: number = 1) => {
        try {
            setIsLoading(true);
            const query = searchParams?.get("q") || "";
            const response = await fetch(`/api/restaurants?q=${encodeURIComponent(query)}&page=${pageNumber}&limit=10`);
            if (!response.ok) throw new Error('Failed to fetch restaurants');
            const data = await response.json();

            setTotalCount(data.metadata.totalCount);
            setHasMore(data.metadata.hasMore);

            if (pageNumber === 1) {
                setRestaurants(data.restaurants);
            } else {
                // 중복 제거 로직 추가
                setRestaurants(prev => {
                    const newRestaurants = data.restaurants;
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNewRestaurants = newRestaurants.filter(
                        (restaurant: Restaurant) => !existingIds.has(restaurant.id)
                    );
                    return [...prev, ...uniqueNewRestaurants];
                });
            }
        } catch (err) {
            setError('Failed to load restaurants');
        } finally {
            setIsLoading(false);
        }
    };

    // Intersection Observer 설정
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !isLoading) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        const currentElement = lastRestaurantRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [hasMore, isLoading]);

    // 페이지 변경 시 데이터 로드
    useEffect(() => {
        if (mounted && page > 1) {
            fetchRestaurants(page);
        }
    }, [page]);

    useEffect(() => {
        if (mounted) {
            setPage(1);
            fetchRestaurants(1);
        }
    }, [searchParams, mounted]);

    useEffect(() => {
        setMounted(true);
    }, []);



    // Handle initial mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // 검색 로직 개선
    // useEffect(() => {
    //     if (mounted && restaurants.length > 0) {
    //         const query = searchParams?.get("q") || "";
    //         setSearchQuery(query);

    //         if (!query) {
    //            // setFilteredResults(restaurants);
    //             return;
    //         }

    //         const filtered = restaurants.filter(restaurant => {
    //             const searchFields = [
    //                 restaurant.name,
    //                 restaurant.category,
    //                 restaurant.address,
    //                 restaurant.addressDetail,
    //                 restaurant.region1,
    //                 restaurant.region2,
    //                 restaurant.region3,
    //                 restaurant.region4,
    //             ].map(field => field?.toLowerCase() || "");

    //             // 태그 검색을 위한 배열 준비
    //             const tags = Array.isArray(restaurant.tags)
    //                 ? restaurant.tags.map((tag: string) => tag.toLowerCase())
    //                 : [];

    //             // 검색어를 소문자로 변환
    //             const lowercaseQuery = query.toLowerCase();

    //             // 각 필드에 대해 검색
    //             return searchFields.some(field => field.includes(lowercaseQuery)) ||
    //                 tags.some(tag => tag.includes(lowercaseQuery));
    //         });

    //         setFilteredResults(filtered);
    //     }
    // }, [searchParams, restaurants, mounted]);

    // 검색 제출 핸들러 수정
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const normalizedQuery = searchQuery.trim();
            router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
        }
    };

    const handleBack = () => {
        if (mounted) {
            router.back();
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-[393px] p-4">
                    <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded-lg mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-200 h-48 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-[393px]">
                {/* Header */}
                <div className="sticky top-0 bg-background z-10 p-4 border-b">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="text-primary"
                        >
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
                <div className="ml-5"><h2>관련 PASS 검색 결과 <span className="text-primary font-bold">{totalCount}</span>개</h2></div>
                {/* Search Results */}
                <div className="p-2">
                    {restaurants.length > 0 && (
                        <div className="space-y-4">
                            {restaurants.map((restaurant, index) => {
                                if (restaurants.length === index + 1) {
                                    return (
                                        <div
                                            key={`restaurant-${restaurant.id}-${index}`}
                                            ref={index === restaurants.length - 1 ? lastElementRef : null}
                                            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                                            className="bg-white rounded-lg shadow-sm p-4"
                                        >
                                            {restaurant.images.length > 0 && (
                                                <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
                                                    <Image
                                                        src={restaurant.images[0]}
                                                        alt={restaurant.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <h3 className="font-medium">{restaurant.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {restaurant.description}
                                            </p>
                                            {restaurant.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {restaurant.tags.map((tag: string, tagIndex: number) => (
                                                        <span
                                                            key={`${restaurant.id}-tag-${tagIndex}`}  // 고유한 key 생성
                                                            className="text-xs bg-muted px-2 py-1 rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                {restaurant.region2} {restaurant.region3}
                                                {restaurant.region4 && ` • ${restaurant.region4}`}
                                            </p>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                ★ {restaurant.rating?.toFixed(1)} ({restaurant.reviewCount} reviews)
                                            </div>
                                            {restaurant.specialOfferType &&
                                                restaurant.specialOfferType !== "none" && (
                                                    <div className="mb-2 mt-2">
                                                        <span
                                                            className={`inline-block px-2 py-1 rounded-full text-xs text-white ${restaurant.specialOfferType === "gift"
                                                                ? "bg-pink-500"
                                                                : "bg-orange-500"
                                                                }`}
                                                        >
                                                            {restaurant.specialOfferType === "gift"
                                                                ? "Welcome Gift"
                                                                : "Discount"}
                                                        </span>
                                                        <span className="text-sm ml-2 text-gray-600">
                                                            {restaurant.specialOfferText}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>)
                                } else {
                                    return (
                                        <div
                                            key={restaurant.id}
                                            className="bg-white rounded-lg shadow-sm p-4"
                                            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                                        >
                                            {restaurant.images.length > 0 && (
                                                <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
                                                    <Image
                                                        src={restaurant.images[0]}
                                                        alt={restaurant.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <h3 className="font-medium">{restaurant.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {restaurant.description}
                                            </p>
                                            {restaurant.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                                                {restaurant.tags.map((tag: string, index: number) => (
                                                    <span
                                                        key={index}
                                                        className="text-xs bg-muted px-2 py-1 rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>}
                                            <p className="text-sm text-muted-foreground">
                                                {restaurant.region2} {restaurant.region3}
                                                {restaurant.region4 && ` • ${restaurant.region4}`}
                                            </p>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                ★ {restaurant.rating?.toFixed(1)} ({restaurant.reviewCount} reviews)
                                            </div>
                                            {restaurant.specialOfferType &&
                                                restaurant.specialOfferType !== "none" && (
                                                    <div className="mb-2 mt-2">
                                                        <span
                                                            className={`inline-block px-2 py-1 rounded-full text-xs text-white ${restaurant.specialOfferType === "gift"
                                                                ? "bg-pink-500"
                                                                : "bg-orange-500"
                                                                }`}
                                                        >
                                                            {restaurant.specialOfferType === "gift"
                                                                ? "Welcome Gift"
                                                                : "Discount"}
                                                        </span>
                                                        <span className="text-sm ml-2 text-gray-600">
                                                            {restaurant.specialOfferText}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    )
                                }
                            }
                            )}
                        </div>
                    )}
                    {isLoading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        </div>
                    )}

                    {!hasMore && !isLoading && restaurants.length > 0 && (
                        <div className="text-center py-4 text-gray-500">
                            모든 검색 결과를 불러왔습니다
                        </div>
                    )}

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