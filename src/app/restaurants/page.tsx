"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Marker, MarkerClusterer } from "@react-google-maps/api";
import { useRouter, useSearchParams } from "next/navigation";
import type { Review } from "@prisma/client";
import { Input } from "@/components/ui/input";
import ExcelImport from "./components/excel-import";
import { useRestaurants } from "./hooks/use-restaurants";
import { RestaurantCard } from "../search/component/restaurant-card";
import { MapPin, Search, Sliders } from "lucide-react";
import GoogleMapsProvider from "../google-maps-provider";
import RestaurantMap from "./components/restaurant-map";

const CATEGORIES = [
  { id: "all", label: "All", value: "all" },
  {
    id: "fashion",
    label: "Fashion",
    value: "fashion",
    types: ["clothing_store", "shopping_mall"],
  },
  {
    id: "beauty",
    label: "Beauty",
    value: "beauty",
    types: ["beauty_salon", "hair_care"],
  },
  {
    id: "luxury",
    label: "Luxury",
    value: "luxury",
    types: ["jewelry_store", "shopping_mall"],
  },
  {
    id: "activities",
    label: "Activities",
    value: "activities",
    types: ["gym", "park", "amusement_park"],
  },
  {
    id: "culture",
    label: "Culture",
    value: "culture",
    types: ["museum", "art_gallery", "movie_theater"],
  },
  { id: "food", label: "Food", value: "Food", types: ["restaurant", "cafe"] },
];

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  about?: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string | null;
  rating: number | null;
  images: string[];
  distance?: number;
  specialOfferType: string[];
  specialOfferText?: string;
  isOpen?: boolean;
  reviewCount?: number;
  district?: string;
  reviews?: Review[];
  region1: string | null;
  region2: string | null;
  region3: string | null;
  region4: string | null;
  tags: string[];
  addressDetail: string | null;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function RestaurantsPage() {
  // Get search params from URL
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialLocation = searchParams.get("location") || "전체";

  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState(initialCategory);
  const [tempLocation, setTempLocation] = useState(initialLocation);

  const router = useRouter();

  // Update state when URL parameters change
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const location = searchParams.get("location") || "전체";

    setSearchQuery(query);
    setSelectedCategory(category);
    setSelectedLocation(location);
    setTempCategory(category);
    setTempLocation(location);

    // Forcibly trigger filtering when URL parameters change
    if (
      category !== selectedCategory ||
      location !== selectedLocation ||
      query !== searchQuery
    ) {
      console.log("Updating filters from URL params:", {
        category,
        location,
        query,
      });
    }
  }, [searchParams]);

  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useRestaurants(center.lat, center.lng, searchQuery);

  const listRestaurants = useMemo(() => {
    return listData?.pages.flatMap((page) => page.restaurants) ?? [];
  }, [listData]);

  const [mapRestaurants, setMapRestaurants] = useState<Restaurant[]>([]);

  const fetchRestaurantsInBounds = async (bounds: google.maps.LatLngBounds) => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const response = await fetch(
      `/api/restaurants?neLat=${ne.lat()}&neLng=${ne.lng()}&swLat=${sw.lat()}&swLng=${sw.lng()}`
    );
    const data = await response.json();
    setMapRestaurants(data.restaurants);
  };

  const filteredRestaurants = useMemo(() => {
    console.log("Filtering with:", {
      selectedCategory,
      selectedLocation,
      searchQuery,
    });

    return listRestaurants.filter((restaurant: Restaurant) => {
      // 카테고리 매칭
      const matchesCategory =
        selectedCategory === "all" ||
        restaurant.category?.toLowerCase() === selectedCategory.toLowerCase();

      // 지역 매칭
      const matchesLocation =
        selectedLocation === "전체" ||
        restaurant.region1?.includes(selectedLocation) ||
        restaurant.region2?.includes(selectedLocation) ||
        restaurant.address?.includes(selectedLocation);

      // 검색어 매칭
      const matchesSearch =
        searchQuery === "" ||
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.addressDetail
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        restaurant.category
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        restaurant.region1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.region2?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.region3?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.region4?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [listRestaurants, selectedCategory, selectedLocation, searchQuery]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCenter(location);
          setUserLocation(location);
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }, []);

  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    setSelectedMarker(restaurant);
  }, []);

  const handleUserLocationClick = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const mapRef = useRef<google.maps.Map | null>(null);

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  }, [userLocation]);

  // Update URL when filters change
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedLocation !== "전체") params.set("location", selectedLocation);

    router.push(`/restaurants?${params.toString()}`);
  }, [searchQuery, selectedCategory, selectedLocation, router]);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlWithFilters();
  };

  // Apply filters
  const applyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedLocation(tempLocation);
    setIsFilterModalOpen(false);

    // Update URL with new filters
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (tempCategory !== "all") params.set("category", tempCategory);
    if (tempLocation !== "전체") params.set("location", tempLocation);

    router.push(`/restaurants?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLocation("전체");
    setTempCategory("all");
    setTempLocation("전체");

    // Clear URL params
    router.push("/restaurants");
  };

  const LoaderRef = ({ onIntersect }: { onIntersect: () => void }) => {
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const currentRef = loaderRef.current;
      if (!currentRef) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onIntersect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(currentRef);

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      };
    }, [onIntersect]);

    return <div ref={loaderRef} className="h-10" />;
  };

  const useOnClickOutside = (
    ref: React.RefObject<HTMLElement>,
    handler: (event: MouseEvent | TouchEvent) => void
  ) => {
    useEffect(() => {
      const listener = (event: MouseEvent | TouchEvent) => {
        if (!ref.current || ref.current.contains(event?.target as Node)) {
          return;
        }
        handler(event);
      };

      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    }, [ref, handler]);
  };

  const dropdownRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(dropdownRef, () => {
    setIsFilterModalOpen(false);
  });

  const LOCATIONS = [
    { id: "전체", label: "전체" },
    { id: "홍대", label: "홍대" },
    { id: "명동", label: "명동" },
    { id: "인사동", label: "인사동" },
    { id: "강남", label: "강남" },
    { id: "이태원", label: "이태원" },
    { id: "한남", label: "한남" },
    { id: "합정", label: "합정" },
    { id: "성수", label: "성수" },
    { id: "여의도", label: "여의도" },
  ];

  return (
    <div className="container mx-auto py-2 pb-16">
      <div className="flex justify-end mb-6">
        <ExcelImport />
      </div>

      <div className="mb-4 relative ">
        <div className="absolute top-1 left-1 right-1 space-y-4 z-20">
          <div className="rounded-lg p-1">
            <div className="p-2">
              <div className="relative z-100" ref={dropdownRef}>
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색어를 입력해 주세요."
                    className="w-full pl-4 pr-10 py-2 border rounded-full shadow-md focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>

                {/* 필터 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setTempCategory(selectedCategory);
                    setTempLocation(selectedLocation);
                    setIsFilterModalOpen(true);
                  }}
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  필터
                </Button>

                {/* 필터 모달 */}
                {isFilterModalOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-50"
                  >
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">지역</h3>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((location) => (
                          <button
                            key={location.id}
                            onClick={() => setTempLocation(location.id)}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              tempLocation === location.id
                                ? "bg-primary text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {location.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">카테고리</h3>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setTempCategory(category.value)}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              tempCategory === category.value
                                ? "bg-primary text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 확인 버튼 */}
                    <Button className="mt-4" onClick={applyFilters}>
                      확인
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <GoogleMapsProvider>
          <RestaurantMap
            mapRef={mapRef}
            center={center}
            userLocation={userLocation}
            mapRestaurants={mapRestaurants}
            selectedMarker={selectedMarker}
            onMarkerClick={handleMarkerClick}
            onUserLocationClick={handleUserLocationClick}
            onBoundsChanged={fetchRestaurantsInBounds}
            setSelectedMarker={setSelectedMarker}
            mode="list"
          />
        </GoogleMapsProvider>
        <Button
          onClick={handleCenterOnUser}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 bg-white shadow-lg hover:bg-gray-100 z-10"
        >
          <MapPin className="h-5 w-5 text-primary" />
        </Button>
      </div>

      <div>
        {isLoading && !isFetchingNextPage && (
          <div className="container mx-auto py-2 pb-16">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>장소를 불러오는 중...</span>
              </div>
            </div>
          </div>
        )}
        {!isLoading && filteredRestaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium text-gray-900">
                검색 결과가 없습니다
              </p>
              <p className="text-sm text-gray-500">
                다른 키워드나 필터로 다시 시도해보세요
              </p>
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            </div>
          </div>
        )}

        {filteredRestaurants.map((restaurant) => (
          <RestaurantCard
            key={`restaurant-${restaurant.id}`}
            restaurant={restaurant}
            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
            imageLoading={imageLoading}
            onImageLoad={() => setImageLoading(false)}
            onImageError={() => setImageLoading(false)}
          />
        ))}

        {/* 무한 스크롤 트리거 */}
        {hasNextPage && !isFetchingNextPage && (
          <LoaderRef onIntersect={() => fetchNextPage()} />
        )}
      </div>
    </div>
  );
}
