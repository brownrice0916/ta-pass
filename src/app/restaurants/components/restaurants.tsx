"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Marker, MarkerClusterer } from "@react-google-maps/api";
import { useRouter, useSearchParams } from "next/navigation";
import type { Review } from "@prisma/client";
import { Input } from "@/components/ui/input";

import { MapPin, Search, Sliders, X, ChevronDown } from "lucide-react";

import { ClientOnly } from "@/components/client-only";
import { useRestaurants } from "../hooks/use-restaurants";
import ExcelImport from "./excel-import";
import GoogleMapsProvider from "@/app/google-maps-provider";
import RestaurantMap from "./restaurant-map";
import { RestaurantCard } from "@/app/search/component/restaurant-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { regions, subCategoryMap } from "@/types/category";
// 정렬 옵션
const SORT_OPTIONS = [
  { id: "distance", label: "거리순" },
  { id: "rating", label: "별점순" },
  { id: "bookmark", label: "북마크순" },
  { id: "latest", label: "최신등록순" },
];

// 카테고리 목록
const CATEGORIES = [
  { id: "all", label: "전체", value: "all" },
  {
    id: "food",
    label: "맛집",
    value: "food",
    // types: ["clothing_store", "shopping_mall"],
  },
  {
    id: "shopping",
    label: "쇼핑",
    value: "shopping",
    // types: ["beauty_salon", "hair_care"],
  },
  {
    id: "attraction",
    label: "관광명소",
    value: "attraction",
    // types: ["jewelry_store", "shopping_mall"],
  },
  {
    id: "experience",
    label: "체험",
    value: "experience",
    // types: ["gym", "park", "amusement_park"],
  },
  {
    id: "wellness",
    label: "웰니스",
    value: "wellness",
    // types: ["museum", "art_gallery", "movie_theater"],
  },
  {
    id: "nightlife",
    label: "나이트라이프",
    value: "Nightlife",
    // types: ["restaurant", "cafe"],
  },
];

// 지역 목록
// const LOCATIONS = [
//   { id: "전체", label: "전체" },
//   { id: "홍대", label: "홍대" },
//   { id: "명동", label: "명동" },
//   { id: "인사동", label: "인사동" },
//   { id: "강남", label: "강남" },
//   { id: "이태원", label: "이태원" },
//   { id: "한남", label: "한남" },
//   { id: "합정", label: "합정" },
//   { id: "성수", label: "성수" },
//   { id: "여의도", label: "여의도" },
// ];

// emojiMap: 실제 저장된 태그 → 이모지
const emojiMap: { [key: string]: string } = {
  "완전 마음에 들었어요!": "😍",
  친절했어요: "😊",
  "가성비 최고였어요": "💰",
  "찾기 쉬웠어요": "📍",
  "진짜 로컬 느낌이에요": "✨",
  "또 방문하고 싶어요": "🔁",
  "혜택을 잘 받았어요": "🎁",
  "상품 구성이 독특했어요": "🛍️",
  "사진 찍기 좋은 곳이었어요": "📸",
  "다른 사람에게도 추천하고 싶어요": "📢",
};

// TAG_FILTERS 정의 (기존과 동일)
const TAG_FILTERS = [
  { id: "만족도", label: "만족도", icon: "😍" },
  { id: "가성비", label: "가성비", icon: "💰" },
  { id: "혜택만족", label: "혜택만족", icon: "🎁" },
  { id: "위치편의성", label: "위치편의성", icon: "📍" },
  { id: "상품특색", label: "상품특색", icon: "🛍️" },
  { id: "로컬감성", label: "로컬감성", icon: "✨" },
  { id: "사진맛집", label: "사진맛집", icon: "📸" },
  { id: "친절함", label: "친절함", icon: "😊" },
  { id: "재방문의사", label: "재방문의사", icon: "🔁" },
  { id: "추천의향", label: "추천의향", icon: "🧹📢" },
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
  bookmarkCount?: number;
  createdAt?: Date;
}

export default function Restaurants() {
  // State
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState("all");
  const [tempSubCategory, setTempSubCategory] = useState("all");
  const [tempLocation, setTempLocation] = useState("전체");
  const [forceRefetch, setForceRefetch] = useState(0);

  // 새로운 필터 상태
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("distance");
  const [locationMode, setLocationMode] = useState("user"); // 'user' 또는 'map'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [specialOfferTypes, setSpecialOfferTypes] = useState<string[]>([]);
  const router = useRouter();
  const mapRef = useRef<google.maps.Map | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null!);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // 지도 경계 상태 추가
  const [mapBounds, setMapBounds] = useState<{
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  } | null>(null);

  const toggleOfferType = (type: string) => {
    const newTypes = specialOfferTypes.includes(type)
      ? specialOfferTypes.filter((t) => t !== type)
      : [...specialOfferTypes, type];

    setSpecialOfferTypes(newTypes); // 상태 먼저 업데이트

    const params = new URLSearchParams(searchParams.toString());
    if (newTypes.length > 0) {
      params.set("specialOfferType", newTypes.join(","));
    } else {
      params.delete("specialOfferType");
    }

    router.push(`/restaurants?${params.toString()}`);
    refetch();
  };

  useEffect(() => {
    if (!searchParams) return;

    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const subCategory = searchParams.get("subCategory") || "all";

    const location = searchParams.get("location") || "전체";
    const sort = searchParams.get("sort") || "distance";
    const tags = searchParams.get("tags")?.split(",") || [];
    const mode = searchParams.get("mode") || "user";

    setSearchQuery(query);
    setSelectedCategory(category);
    setSelectedLocation(location);
    setTempCategory(category);
    setSelectedSubCategory(subCategory);
    setTempSubCategory(subCategory);
    setTempLocation(location);
    setSortOption(sort);
    setLocationMode(mode);

    if (tags.length > 0) {
      setSelectedTags(tags);
      setTempTags(tags);
    }
  }, [searchParams]);

  // useRestaurants 훅 호출 수정
  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useRestaurants(
    center.lat,
    center.lng,
    searchQuery,
    sortOption,
    locationMode,
    selectedCategory,
    selectedSubCategory, // ⬅️ 추가
    selectedLocation,
    selectedTags,
    locationMode === "map" ? mapBounds || undefined : undefined,
    specialOfferTypes // ✅ 이걸 추가!
  );

  // Force refetch when filters change
  useEffect(() => {
    refetch();
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    selectedTags,
    sortOption,
    locationMode,
    forceRefetch,
    refetch,
  ]);

  const listRestaurants = useMemo(() => {
    return listData?.pages.flatMap((page) => page.restaurants) ?? [];
  }, [listData]);

  const [mapRestaurants, setMapRestaurants] = useState<Restaurant[]>([]);

  const fetchRestaurantsInBounds = async (bounds: google.maps.LatLngBounds) => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // 지도 경계를 상태로 저장
    const newBounds = {
      neLat: ne.lat(),
      neLng: ne.lng(),
      swLat: sw.lat(),
      swLng: sw.lng(),
    };

    // 지도 경계 상태 업데이트
    setMapBounds(newBounds);

    // locationMode가 map일 때는 useRestaurants에 의해 자동으로 데이터를 가져오므로,
    // 여기서는 별도로 API 호출을 하지 않음
    if (locationMode === "map") {
      refetch();
      return;
    }

    const params = new URLSearchParams();
    params.append("neLat", ne.lat().toString());
    params.append("neLng", ne.lng().toString());
    params.append("swLat", sw.lat().toString());
    params.append("swLng", sw.lng().toString());
    params.append("latitude", center.lat.toString()); // 중심점 위도 추가
    params.append("longitude", center.lng.toString()); // 중심점 경도 추가
    params.append("mode", "map"); // 중요: mode=map 명시

    // 추가 필터 적용
    if (selectedCategory !== "all") {
      params.append("category", selectedCategory);
    }
    if (selectedLocation !== "전체") {
      params.append("location", selectedLocation);
    }
    if (selectedTags.length > 0) {
      params.append("tags", selectedTags.join(","));
    }
    if (sortOption) {
      params.append("sort", sortOption);
    }

    try {
      const response = await fetch(`/api/restaurants?${params.toString()}`);
      const data = await response.json();

      setMapRestaurants(data.restaurants || []);
    } catch (error) {
      console.error("Error fetching map markers:", error);
    }
  };

  const filteredRestaurants = useMemo(() => {
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

      // 태그 매칭
      const matchesTags = true;
      // 검색어 매칭
      const matchesSearch =
        !searchQuery || // 검색어가 없으면 모든 항목 표시
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

      return matchesCategory && matchesLocation && matchesTags && matchesSearch;
    });
  }, [
    listRestaurants,
    selectedCategory,
    selectedLocation,
    selectedTags,
    searchQuery,
  ]);

  // 지도 경계 변경 이벤트 리스너 추가
  useEffect(() => {
    if (mapRef.current) {
      // 이벤트 리스너 설정
      const listener = mapRef.current.addListener("idle", () => {
        const bounds = mapRef.current?.getBounds();
        if (bounds) {
          fetchRestaurantsInBounds(bounds);
        }
      });

      // 클린업 함수
      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    }
  }, [mapRef.current, locationMode]);

  // locationMode 변경 감지 및 처리
  useEffect(() => {
    if (locationMode === "map" && mapBounds) {
      // map 모드로 변경되었고 지도 경계 정보가 있을 경우, 데이터 다시 가져오기
      refetch();
    }
  }, [locationMode]);

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

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
      setLocationMode("user");
      updateUrlWithFilters();
    }
  }, [userLocation]);

  const handleCenterOnMap = useCallback(() => {
    if (mapRef.current) {
      setLocationMode("map");
      updateUrlWithFilters();
    }
  }, []);

  // Update URL when filters change and trigger a refetch
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSubCategory !== "all") {
      params.set("subCategory", selectedSubCategory);
    }
    if (selectedLocation !== "전체") params.set("location", selectedLocation);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (sortOption !== "distance") params.set("sort", sortOption);
    if (locationMode !== "user") params.set("mode", locationMode);

    router.push(`/restaurants?${params.toString()}`);
    setForceRefetch((prev) => prev + 1);
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    selectedTags,
    sortOption,
    locationMode,
    router,
  ]);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlWithFilters();
    refetch();
  };

  // Function to clear search query
  const clearSearchQuery = () => {
    setSearchQuery("");
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedLocation !== "전체") params.set("location", selectedLocation);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (sortOption !== "distance") params.set("sort", sortOption);
    if (locationMode !== "user") params.set("mode", locationMode);

    router.push(`/restaurants?${params.toString()}`);
    refetch();
  };

  // Tag filter toggle
  const toggleTag = (tagId: string) => {
    setTempTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  // Apply filters
  const applyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedLocation(tempLocation);
    setSelectedTags(tempTags);
    setSelectedSubCategory(tempSubCategory); // ✅ 이건 잘 되어 있음
    setIsFilterModalOpen(false);

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (tempCategory !== "all") params.set("category", tempCategory);
    if (tempSubCategory !== "all") params.set("subCategory", tempSubCategory); // ✅ 이거 빠졌었음!
    if (tempLocation !== "전체") params.set("location", tempLocation);
    if (tempTags.length > 0) params.set("tags", tempTags.join(","));
    if (sortOption !== "distance") params.set("sort", sortOption);
    if (locationMode !== "user") params.set("mode", locationMode);

    router.push(`/restaurants?${params.toString()}`);
    refetch();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setTempSubCategory("all");
    setSelectedLocation("전체");
    setSelectedTags([]);
    setTempCategory("all");
    setTempLocation("전체");
    setTempTags([]);
    setSortOption("distance");
    setLocationMode("user");

    router.push("/restaurants");
    refetch();
  };

  // Sort option change
  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortDropdown(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", option);
    router.push(`/restaurants?${params.toString()}`);
    refetch();
  };

  // Location mode change
  const handleLocationModeChange = (mode: string) => {
    setLocationMode(mode);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    router.push(`/restaurants?${params.toString()}`);
    refetch();
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

  useOnClickOutside(dropdownRef, () => {
    setIsFilterModalOpen(false);
  });

  useOnClickOutside(
    (sortDropdownRef as any) || document.createElement("div"),
    () => {
      setShowSortDropdown(false);
    }
  );

  const handleTagFilterClick = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newTags);

    // URL 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());

    if (newTags.length > 0) {
      params.set("tags", newTags.join(","));
      // 태그가 선택되면 정렬 방식을 'tag_count'로 변경
      params.set("sort", "tag_count");
      setSortOption("tag_count");
    } else {
      params.delete("tags");
      // 모든 태그가 해제되면 기본 정렬로 돌아감
      if (sortOption === "tag_count") {
        params.set("sort", "distance");
        setSortOption("distance");
      }
    }

    router.push(`/restaurants?${params.toString()}`);
    refetch();
  };

  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  useOnClickOutside(
    (locationDropdownRef as any) || document.createElement("div"),
    () => {
      setShowLocationDropdown(false);
    }
  );
  return (
    <div className="container mx-auto py-2 pb-16">
      <div className="flex justify-end mb-6">
        <ExcelImport />
      </div>

      <div className="mb-4 relative">
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
                    className="w-full pl-4 pr-16 py-2 border rounded-full shadow-md focus:ring-2 focus:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearchQuery}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>

                {/* 필터 버튼 */}
                <div className="flex mt-2 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempCategory(selectedCategory);
                      setTempLocation(selectedLocation);
                      setTempTags(selectedTags);
                      setIsFilterModalOpen(true);
                    }}
                  >
                    <Sliders className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>

                {isFilterModalOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-50">
                    <button
                      onClick={() => setIsFilterModalOpen(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">지역</h3>
                      <div className="flex flex-wrap gap-2">
                        {regions.map((location) => (
                          <button
                            key={location.id}
                            onClick={() => setTempLocation(location.id)}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              tempLocation === location.id
                                ? "bg-primary text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {location.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">카테고리</h3>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setTempCategory(category.value);
                              setTempSubCategory("all"); // ← 이거 꼭 필요함!
                            }}
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

                    {tempCategory !== "all" && subCategoryMap[tempCategory] && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">
                          세부 카테고리
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(subCategoryMap[tempCategory]).map(
                            ([label, value]) => (
                              <button
                                key={value as any}
                                onClick={() => setTempSubCategory(value as any)}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  tempSubCategory === value
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                {label}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button className="flex-1" onClick={applyFilters}>
                        적용하기
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={resetFilters}
                      >
                        초기화
                      </Button>
                    </div>
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

      {/* 위치 모드 토글 */}
      <div className="flex">
        {/* 정렬 옵션 드롭다운 */}
        <div className="relative" ref={sortDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center"
          >
            {SORT_OPTIONS.find((o) => o.id === sortOption)?.label || "정렬"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {showSortDropdown && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSortChange(option.id)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortOption === option.id
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 위치 모드 드롭다운 */}
        <div className="relative" ref={locationDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLocationDropdown((prev) => !prev)}
            className="flex items-center"
          >
            {locationMode === "user" ? "현재위치 기준" : "지도위치 기준"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {showLocationDropdown && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50">
              <button
                onClick={() => {
                  handleLocationModeChange("user");
                  setShowLocationDropdown(false); // 드롭다운 닫기
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  locationMode === "user"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                현재위치 기준
              </button>
              <button
                onClick={() => {
                  handleLocationModeChange("map");
                  setShowLocationDropdown(false); // 드롭다운 닫기
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  locationMode === "map"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                지도위치 기준
              </button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {["Discount", "Special Gift"].map((type) => {
            const isSelected = specialOfferTypes.includes(type);

            const customStyle = !isSelected
              ? type === "Discount"
                ? { border: "1px solid #f97316", color: "#f97316" } // orange-500
                : { border: "1px solid #ec4899", color: "#ec4899" } // pink-500
              : { border: "1px solid #fff" };

            return (
              <button
                key={type}
                onClick={() => toggleOfferType(type)}
                style={customStyle}
                className={`px-2 py-1.5 rounded-full text-sm font-medium transition-all duration-150
          ${
            isSelected
              ? `text-white ${
                  type === "Discount" ? "bg-orange-500" : "bg-pink-500"
                }`
              : "bg-white"
          }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex overflow-x-auto pb-2 -mx-2 px-2">
        {TAG_FILTERS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagFilterClick(tag.id)}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm whitespace-nowrap mr-2 ${
              selectedTags.includes(tag.id)
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span className="mr-1">{tag.icon}</span>
            {tag.label}
            {/* 태그가 선택되었을 때 '태그순' 정렬 중임을 표시 */}
            {/* {selectedTags.includes(tag.id) &&
              selectedTags.length === 1 &&
              sortOption === "tag_count" && (
                <span className="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">
                  정렬중
                </span>
              )} */}
          </button>
        ))}
      </div>
      <div>
        {isLoading && !isFetchingNextPage && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>장소를 불러오는 중...</span>
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
            // 선택된 태그를 하이라이트
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
