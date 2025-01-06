
// components/SearchPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Restaurant } from "@prisma/client";

export default function SearchPage() {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();

    // Fetch restaurants data
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await fetch('/api/restaurants');
                if (!response.ok) throw new Error('Failed to fetch restaurants');
                const data = await response.json();
                setRestaurants(data);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to load restaurants');
                setIsLoading(false);
            }
        };

        if (mounted) {
            fetchRestaurants();
        }
    }, [mounted]);

    // Handle initial mount
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && restaurants.length > 0) {
            const query = searchParams?.get("q")?.toLowerCase() || "";
            setSearchQuery(query);

            const filtered = query
                ? restaurants.filter(restaurant =>
                    restaurant.name.toLowerCase().includes(query) ||
                    restaurant.tags.some((tag: string) => tag.toLowerCase().includes(query)) ||
                    restaurant.address.toLowerCase().includes(query) ||
                    restaurant.addressDetail?.toLowerCase().includes(query) ||
                    restaurant.category.toLowerCase().includes(query) ||
                    restaurant.region1?.toLowerCase().includes(query) ||   // region1 추가
                    restaurant.region2?.toLowerCase().includes(query) ||   // region2 추가
                    restaurant.region3?.toLowerCase().includes(query) ||   // region3 추가
                    restaurant.region4?.toLowerCase().includes(query)      // region4 추가
                )
                : restaurants;

            setFilteredResults(filtered);
        }
    }, [searchParams, restaurants, mounted]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && mounted) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
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
                <div className="ml-5"><h2>관련 PASS 검색 결과 <span className="text-primary font-bold">{filteredResults.length}</span>개</h2></div>
                {/* Search Results */}
                <div className="p-2">
                    {isLoading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-200 h-48 rounded-lg" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">
                            {error}
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No restaurants found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredResults.map((restaurant) => (
                                <div
                                    key={restaurant.id}
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}