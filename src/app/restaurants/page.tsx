"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import { Review } from "@prisma/client";
import { getNeighborhood } from "@/lib/address";
import { Input } from "@/components/ui/input";
import ExcelImport from "./components/excel-import";



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
  { id: "food", label: "Food", value: "food", types: ["restaurant", "cafe"] },
];

interface Restaurant {
  id: string;
  name: string;
  description: string; // 추가
  address: string;
  latitude: number;
  longitude: number;
  category?: string;
  rating?: number;
  images: string[];
  distance?: number;
  specialOfferType?: "none" | "gift" | "discount"; // 추가
  specialOfferText?: string; // 추가
  isOpen?: boolean; // 추가
  reviewCount?: number; // 추가
  district?: string; // 추가: 동 정보
  reviews?: Review[]; // 추가: 리뷰 배열
  region1?: string;
  region2?: string;
  region3?: string;
  region4?: string;
  tags: any;
  addressDetail?: string;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};
export default function RestaurantsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [center, setCenter] = useState({
    lat: 37.5665,
    lng: 126.978,
  });

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    address: "",
    category: "",
    latitude: center.lat,
    longitude: center.lng,
    rating: 0,
  });

  const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showUserLocationInfo, setShowUserLocationInfo] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState("current");
  const [isClient, setIsClient] = useState(false);

  const ITEMS_PER_PAGE = 10;  // 한 번에 불러올 아이템 수

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 페이지 변경 시 새로운 데이터 불러오기
  useEffect(() => {
    if (userLocation && page > 1) {
      fetchNearbyRestaurants(userLocation.lat, userLocation.lng, page);
    }
  }, [page]);


  const mapRef = useRef<google.maps.Map | null>(null);
  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
      setSelectedLocation("current");
      fetchNearbyRestaurants(userLocation.lat, userLocation.lng);
    }
  };

  useEffect(() => {
    if (restaurants.length > 0) {
      let filtered = [...restaurants];

      // 카테고리 필터링
      if (selectedCategory !== "all") {
        filtered = filtered.filter((r) => r.category === selectedCategory);
      }

      // 검색어 필터링
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.address.toLowerCase().includes(query) ||
            (Array.isArray(r.tags) && r.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }

      setFilteredRestaurants(filtered);
    }
  }, [selectedCategory, restaurants, searchQuery]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCenter(location);
          setUserLocation(location);
          fetchNearbyRestaurants(latitude, longitude);
        },
        (error) => {
          console.log(error);
          setError("위치 정보를 가져올 수 없습니다.");
          setLoading(false);
        }
      );
    }
  }, []);

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedMarker(restaurant);
    setShowUserLocationInfo(false);
  };

  const handleUserLocationClick = () => {
    setShowUserLocationInfo(true);
    setSelectedMarker(null);
  };

  const initAutocomplete = () => {
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    if (inputRef.current && window.google) {
      const selectedCategoryTypes = CATEGORIES.find(
        (cat) => cat.value === selectedCategory
      )?.types || ["restaurant"];

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "rating",
            "types",
            "opening_hours", // 영업 시간 정보 추가
            "address_components", // 동 정보를 위해 추가
          ],
          types: selectedCategoryTypes,
          componentRestrictions: { country: "kr" },
        }
      );
    }
  };


  const fetchNearbyRestaurants = async (
    latitude: number,
    longitude: number,
    pageNumber = 1
  ) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setIsLoading(true);
      }
      const response = await fetch(
        `/api/restaurants?latitude=${latitude}&longitude=${longitude}&radius=1&page=${pageNumber}&limit=${ITEMS_PER_PAGE}`
      );
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();

      // 거리 정보 추가 및 정렬
      const restaurantsWithDistance = data.restaurants.map((restaurant: Restaurant) => ({
        ...restaurant,
        distance: calculateDistance(
          latitude,
          longitude,
          restaurant.latitude,
          restaurant.longitude
        )
      })).sort((a: Restaurant, b: Restaurant) => (a.distance || 0) - (b.distance || 0));

      if (pageNumber === 1) {
        setRestaurants(restaurantsWithDistance);
      } else {
        setRestaurants(prev => {
          const newRestaurants = restaurantsWithDistance;
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNewRestaurants = newRestaurants.filter(
            (restaurant: Restaurant) => !existingIds.has(restaurant.id)
          );
          return [...prev, ...uniqueNewRestaurants].sort((a, b) => (a.distance || 0) - (b.distance || 0));
        });
      }

      setHasMore(data.metadata.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRestaurantRef = useRef<HTMLDivElement>(null);

  const [imageLoading, setImageLoading] = useState(true);


  // useCallback으로 lastElementRef 함수 생성
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    if (userLocation && page > 1) {
      console.log('Fetching page:', page); // 디버깅용
      fetchNearbyRestaurants(userLocation.lat, userLocation.lng, page);
    }
  }, [page, userLocation]);

  // 두 지점 간의 거리를 계산하는 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구의 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // km 단위
    return distance;
  };


  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    observerRef.current = observer;

    if (lastRestaurantRef.current) {
      observer.observe(lastRestaurantRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore]);


  useEffect(() => {
    if (!restaurants || !Array.isArray(restaurants)) return;

    const query = searchQuery.toLowerCase();
    const filtered = query
      ? restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query) ||
        (Array.isArray(restaurant.tags) && restaurant.tags.some((tag: string) => tag.toLowerCase().includes(query))) ||
        restaurant.address.toLowerCase().includes(query) ||
        restaurant.addressDetail?.toLowerCase().includes(query) ||
        restaurant.category?.toLowerCase().includes(query) ||
        restaurant.region1?.toLowerCase().includes(query) ||
        restaurant.region2?.toLowerCase().includes(query) ||
        restaurant.region3?.toLowerCase().includes(query) ||
        restaurant.region4?.toLowerCase().includes(query)
      )
      : restaurants;

    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (!isClient) {
    return null; // or loading state
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-2 pb-16">
      <div className="flex justify-end mb-6">
        {/* <Button className="mr-1" onClick={() => router.push("/restaurants/post")}>
          파트너 추가
        </Button> */}
        <ExcelImport />
      </div>

      <div className="mb-4 relative">
        <div className="absolute top-1 left-1 right-1 z-10 space-y-4">
          <div className="rounded-lg p-1">
            <div className="p-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Stay, shop, and save—where to?"
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
            <div className="flex gap-1 overflow-x-auto pb-1 -mb-1 bg-gray">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.value ? "default" : "outline"
                  }
                  className="whitespace-nowrap rounded-full shadow-md"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          }}
        >
          {userLocation && (
            <>
              <Marker
                position={userLocation}
                icon={{
                  url: '/markers/my-location.png',
                  scaledSize: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(20, 20),
                }}
                title="내 위치"
                onClick={handleUserLocationClick}
              />
              {showUserLocationInfo && (
                <InfoWindow
                  position={userLocation}
                  onCloseClick={() => setShowUserLocationInfo(false)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold">현재 위치</h3>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
          {restaurants.map((restaurant) => (
            <Marker
              onClick={() => handleMarkerClick(restaurant)}
              key={restaurant.id}
              icon={{
                url: '/markers/restaurant.png',
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              }}
              position={{
                lat: restaurant.latitude,
                lng: restaurant.longitude,
              }}
              title={restaurant.name}
            />
          ))}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker!.latitude,
                lng: selectedMarker!.longitude,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold mb-1">{selectedMarker!.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedMarker!.address}
                </p>
                <div className="flex items-center mt-2">
                  <span>평점: </span>
                  <span className="ml-1">
                    {selectedMarker?.rating?.toFixed(1)}
                  </span>
                  <span className="ml-1">★</span>
                </div>
                <Button
                  className="w-full mt-2 text-sm"
                  size="sm"
                  onClick={() =>
                    router.push(`/restaurants/${selectedMarker!.id}`)
                  }
                >
                  자세히 보기
                </Button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        {/* <Button
          onClick={handleCenterOnUser}
          variant="outline"
          size="icon"
          className="bg-white shadow-lg hover:bg-gray-100"
        >
          <MapPin className="h-5 w-5 text-indigo-600" />
        </Button> */}
      </div>

      <div>
        {restaurants.map((restaurant, index) => (
          <Card
            key={`restaurant-${restaurant.id}`}
            ref={index === restaurants.length - 1 ? lastElementRef : null}
            className="mb-4 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-lg mr-3 text-primary">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-orange-500">
                      {restaurant.description}
                    </p>
                  </div>
                </div>
              </div>
              {restaurant.specialOfferType &&
                restaurant.specialOfferType !== "none" && (
                  <div className="mb-2">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span
                  className={
                    restaurant.isOpen ? "text-green-600" : "text-red-600"
                  }
                >
                  {restaurant.isOpen ? "영업중" : "영업종료"}
                </span>
                <span>|</span>
                <span>리뷰 {restaurant.reviewCount || 0}</span>
                <span>|</span>
                <span className="line-clamp-1">
                  {restaurant.region1} {restaurant.region2}
                  {/* {getNeighborhood(restaurant.address)} */}
                </span>
                {restaurant.distance && (
                  <>
                    <span>|</span>
                    <span>{restaurant.distance < 1
                      ? `${Math.round(restaurant.distance * 1000)}m`
                      : `${restaurant.distance.toFixed(1)}km`}
                    </span>
                  </>
                )}
              </div>

              {restaurant.images && restaurant.images.length > 0 && (
                <div className="grid grid-cols-4 gap-0.5">
                  {restaurant.images.slice(0, 4).map((image, index) => (
                    <div
                      key={image}
                      className={`relative aspect-square overflow-hidden `}
                    >
                      {imageLoading && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                      )}
                      <Image
                        src={image}
                        alt={`${restaurant.name} ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 25vw, 25vw"
                        loading="lazy"
                        quality={75}
                        className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                          }`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {loading && <div className="text-center py-4">Loading...</div>}
        {!hasMore && <div className="text-center py-4">No more restaurants</div>}
      </div>
    </div>
  );
}
