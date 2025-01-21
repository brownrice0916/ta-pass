"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  MarkerClusterer,
} from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import type { Review } from "@prisma/client";
import { Input } from "@/components/ui/input";
import ExcelImport from "./components/excel-import";
import { useRestaurants } from "./hooks/use-restaurants";
import { RestaurantCard } from "../search/component/restaurant-card";
import { MapPin, Search } from "lucide-react";

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
  about?: string; // API에 있는 필드 추가
  address: string;
  latitude: number;
  longitude: number;
  category: string | null; // null 허용
  rating: number | null; // undefined 대신 null 사용
  images: string[];
  distance?: number;
  specialOfferType: string[]; // string[] 타입으로 변경
  specialOfferText?: string;
  isOpen?: boolean;
  reviewCount?: number;
  district?: string;
  reviews?: Review[];
  region1: string | null; // null 허용
  region2: string | null; // null 허용
  region3: string | null; // null 허용
  region4: string | null; // null 허용
  tags: string[];
  addressDetail: string | null; // null 허용
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function RestaurantsPage() {
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const router = useRouter();

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

    const fetchedRestaurants = data.restaurants;

    setMapRestaurants(fetchedRestaurants);
    return fetchedRestaurants;
  };
  const filteredRestaurants = useMemo(() => {
    return listRestaurants.filter((restaurant: Restaurant) => {
      // 카테고리 매칭
      const matchesCategory =
        selectedCategory === "all" || restaurant.category === selectedCategory;

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
  }, [listData, selectedCategory, selectedLocation, searchQuery]); // selectedLocation 의존성 추가
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

  const memoizedMapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    }),
    []
  );

  // MarkerList 컴포넌트 생성
  const MarkerList = ({
    restaurants,
    onMarkerClick,
  }: {
    restaurants: Restaurant[];
    onMarkerClick: (restaurant: Restaurant) => void;
  }) => {
    return (
      <MarkerClusterer averageCenter enableRetinaIcons gridSize={60}>
        {(clusterer) => (
          <>
            {restaurants.map((restaurant: Restaurant) => (
              <Marker
                key={restaurant.id}
                position={{
                  lat: restaurant.latitude,
                  lng: restaurant.longitude,
                }}
                onClick={() => onMarkerClick(restaurant)}
                clusterer={clusterer}
                icon={{
                  url: "/markers/restaurant.png",
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
              />
            ))}
          </>
        )}
      </MarkerClusterer>
    );
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

  // 드롭다운 부분 수정
  const dropdownRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(dropdownRef, () => {
    setIsFilterModalOpen(false);
  });

  // if (isError) {
  //   return <div>error</div>;
  // }

  // 초기 로딩 상태
  // if (isLoading && !isFetchingNextPage) {
  //   return (
  //     <div className="container mx-auto py-2 pb-16">
  //       <div className="flex justify-center items-center min-h-[400px]">
  //         <div className="flex flex-col items-center gap-2">
  //           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  //           <span>장소를 불러오는 중...</span>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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

      <div className="mb-4 relative">
        <div className="absolute top-1 left-1 right-1 space-y-4 z-20">
          <div className="rounded-lg p-1">
            <div className="p-4">
              <div className="relative z-100" ref={dropdownRef}>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where to?"
                  className="w-full pl-4 pr-10 py-3 border rounded-full shadow-md focus:ring-2 focus:ring-primary/20"
                  onClick={() => setIsFilterModalOpen(true)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                >
                  <Search className="w-5 h-5" />
                </button>

                {isFilterModalOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-50">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">지역</h3>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((location) => (
                          <button
                            key={location.id}
                            onClick={() => {
                              setSelectedLocation(location.id);
                              setIsFilterModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              selectedLocation === location.id
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
                            onClick={() => {
                              setSelectedCategory(category.value);
                              setIsFilterModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              selectedCategory === category.value
                                ? "bg-primary text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={memoizedMapOptions}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onBoundsChanged={async () => {
            const bounds = mapRef.current?.getBounds();
            console.log("bounds", bounds);
            if (bounds) {
              const restaurants = await fetchRestaurantsInBounds(bounds);
              console.log(restaurants);
              setMapRestaurants(restaurants);
            }
          }}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "/markers/my-location.png",
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(20, 20),
              }}
              title="내 위치"
              onClick={handleUserLocationClick}
            />
          )}
          <MarkerList
            restaurants={mapRestaurants}
            onMarkerClick={handleMarkerClick}
          />
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.latitude,
                lng: selectedMarker.longitude,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold mb-1">{selectedMarker.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedMarker.address}
                </p>
                <div className="flex items-center mt-2">
                  <span>평점: </span>
                  <span className="ml-1">
                    {selectedMarker.rating?.toFixed(1)}
                  </span>
                  <span className="ml-1">★</span>
                </div>
                <Button
                  className="w-full mt-2 text-sm"
                  size="sm"
                  onClick={() =>
                    router.push(`/restaurants/${selectedMarker.id}`)
                  }
                >
                  자세히 보기
                </Button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
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
        {/* 추가 데이터 로딩 상태 */}
        {isFetchingNextPage && (
          <div className="text-center py-4 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>더 많은 장소를 불러오는 중...</span>
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasNextPage && !isFetchingNextPage && (
          <LoaderRef onIntersect={() => fetchNextPage()} />
        )}
      </div>
    </div>
  );
}
