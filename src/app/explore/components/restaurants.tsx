"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import type { Review } from "@prisma/client";
import { Input } from "@/components/ui/input";

import { MapPin, Search, Sliders, X, ChevronDown } from "lucide-react";
import { useRestaurants } from "../hooks/use-restaurants";
import ExcelImport from "./excel-import";
import GoogleMapsProvider from "@/app/google-maps-provider";
import RestaurantMap from "./restaurant-map";
import { RestaurantCard } from "@/app/search/component/restaurant-card";
import { t } from "@/lib/i18n";
import { getRegions, regions, subCategoryMap } from "@/types/category";
import { useLanguage } from "@/context/LanguageContext";
import { TAG_KEYS } from "@/lib/constants";
import { emojiMap } from "@/lib/tags";

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
// 태그 i18n

export default function Restaurants() {
  const { language } = useLanguage();
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

  const TAG_FILTERS = TAG_KEYS.map((key) => ({
    id: key, // 필터 클릭 시 이 key가 URL에 들어감
    icon: emojiMap[key],
    label: t(key, language),
  }));
  // 정렬 옵션 번역적용
  const SORT_OPTIONS = [
    { id: "distance", label: t("explore.sort.distance", language) },
    { id: "rating", label: t("explore.sort.rating", language) },
    { id: "bookmark", label: t("explore.sort.bookmark", language) },
    { id: "latest", label: t("explore.sort.latest", language) },
  ];

  // 카테고리 i18n
  const CATEGORIES = [
    { id: "all", label: t("explore.category.all", language), value: "전체" },
    { id: "food", label: t("explore.category.food", language), value: "맛집" },
    {
      id: "shopping",
      label: t("explore.category.shopping", language),
      value: "쇼핑",
    },

    {
      id: "activities",
      label: t("explore.category.activities", language),
      value: "체험",
    },
    {
      id: "wellness",
      label: t("explore.category.wellness", language),
      value: "웰니스",
    },
    {
      id: "nightlife",
      label: t("explore.category.nightlife", language),
      value: "나이트라이프",
    },
  ];

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

    router.push(`/explore?${params.toString()}`);
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

    router.push(`/explore?${params.toString()}`);
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

    router.push(`/explore?${params.toString()}`);
    refetch();
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

    router.push(`/explore?${params.toString()}`);
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

    router.push("/explore");
    refetch();
  };

  // Sort option change
  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortDropdown(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", option);
    router.push(`/explore?${params.toString()}`);
    refetch();
  };

  // Location mode change
  const handleLocationModeChange = (mode: string) => {
    setLocationMode(mode);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    router.push(`/explore?${params.toString()}`);
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

    router.push(`/explore?${params.toString()}`);
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
                    placeholder={t("explore.searchPlaceholder", language)}
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
                    {t("explore.filter", language)}
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
                      <h3 className="text-sm font-medium mb-2">
                        {t("explore.region", language)}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getRegions(language).map((location) => (
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
                      <h3 className="text-sm font-medium mb-2">
                        {t("explore.category", language)}
                      </h3>
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

                    {console.log("temp", subCategoryMap[tempCategory])}
                    {tempCategory !== "all" && subCategoryMap[tempCategory] && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">
                          {t("explore.subCategory", language)}
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
                                {t(`explore.subCategory.${label}`, language)}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button className="flex-1" onClick={applyFilters}>
                        {t("explore.apply", language)}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={resetFilters}
                      >
                        {t("explore.reset", language)}
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
            {locationMode === "user"
              ? t("explore.locationMode.현재위치기준", language)
              : t("explore.locationMode.지도위치기준", language)}
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
                {t("explore.locationMode.현재위치기준", language)}
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
                {t("explore.locationMode.지도위치기준", language)}
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
              <span>{t("explore.loading", language)}</span>
            </div>
          </div>
        )}

        {!isLoading && filteredRestaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium text-gray-900">
                {t("explore.noResult.title", language)}
              </p>
              <p className="text-sm text-gray-500">
                {t("explore.noResult.desc", language)}
              </p>
              <Button variant="outline" onClick={resetFilters}>
                {t("explore.noResult.reset", language)}
              </Button>
            </div>
          </div>
        )}

        {filteredRestaurants.map((restaurant) => (
          <RestaurantCard
            key={`restaurant-${restaurant.id}`}
            restaurant={restaurant}
            onClick={() => router.push(`/explore/${restaurant.id}`)}
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
