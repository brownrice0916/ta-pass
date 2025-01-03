"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Review } from "@prisma/client";

export const getNeighborhood = (address: string) => {
  // 주소를 콤마로 분리하고 필요없는 부분 제거
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => !part.includes("South Korea")) // South Korea 제거
    .filter((part) => !part.includes("-dong")); // -dong으로 끝나는 부분 제거

  // District와 Seoul을 포함한 부분들 반환
  return parts
    .filter((part) => part.includes("District") || part === "Seoul")
    .join(", ");
};

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

const LOCATIONS = [
  { id: "current", label: "현재 위치", value: "current", coordinates: null },
  {
    id: "hongdae",
    label: "홍대",
    value: "hongdae",
    coordinates: { lat: 37.5578, lng: 126.9254 },
  },
  {
    id: "gangnam",
    label: "강남",
    value: "gangnam",
    coordinates: { lat: 37.4979, lng: 127.0276 },
  },
  {
    id: "myeongdong",
    label: "명동",
    value: "myeongdong",
    coordinates: { lat: 37.5637, lng: 126.9838 },
  },
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
}

const containerStyle = {
  width: "100%",
  height: "400px",
};
export default function RestaurantsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    if (value === "current") {
      if (userLocation) {
        setCenter(userLocation);
        fetchNearbyRestaurants(userLocation.lat, userLocation.lng);
      } else {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location = { lat: latitude, lng: longitude };
            setUserLocation(location);
            setCenter(location);
            fetchNearbyRestaurants(latitude, longitude);
            setLoading(false);
          },
          (error) => {
            console.log(error);
            setError("위치 정보를 가져올 수 없습니다.");
            setLoading(false);
          }
        );
      }
    } else {
      const location = LOCATIONS.find((loc) => loc.value === value);
      if (location?.coordinates) {
        setCenter(location.coordinates);
        fetchNearbyRestaurants(
          location.coordinates.lat,
          location.coordinates.lng
        );
      }
    }
  };

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
    let filtered = restaurants;

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
          r.address.toLowerCase().includes(query)
      );
    }

    setFilteredRestaurants(filtered);
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

      //   autocompleteRef.current.addListener("place_changed", () => {
      //     console.log("place_changed,,");
      //     const place = autocompleteRef.current?.getPlace();
      //     if (place && place.geometry && place.geometry.location) {
      //       const lat = place.geometry.location.lat();
      //       const lng = place.geometry.location.lng();

      //       // 동 정보 추출
      //       let district = "";
      //       if (place.address_components) {
      //         const subLocality = place.address_components.find((component) =>
      //           component.types.includes("sublocality_level_2")
      //         );
      //         if (subLocality) {
      //           district = subLocality.long_name;
      //         }
      //       }

      //       const restaurantData = {
      //         name: place.name || "",
      //         address: place.formatted_address || "",
      //         latitude: lat,
      //         longitude: lng,
      //         category: selectedCategory,
      //         rating: place.rating || 0,
      //         isOpen: place.opening_hours?.isOpen() || false,
      //         district,
      //       };

      //       console.log(place.opening_hours);
      //       setNewRestaurant(restaurantData);
      //       setCenter({ lat, lng });
      //     }
      //   });
    }
  };

  //   useEffect(() => {
  //     if (isOpen) {
  //       initAutocomplete();
  //     }
  //   }, [selectedCategory, isOpen]);

  const fetchNearbyRestaurants = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      // setLoading(true);
      const response = await fetch(
        `/api/restaurants?latitude=${latitude}&longitude=${longitude}&radius=1`
      );
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      setRestaurants(data);
      console.log("data", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return null; // or loading state
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-2 pb-16">
      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push("/restaurants/post")}>
          장소 추가
        </Button>
      </div>

      <div className="mb-4 relative">
        <div className="absolute top-1 left-1 right-1 z-10 space-y-4">
          <div className="rounded-lg p-1">
            <div className="flex p-1 bg-white rounded-md items-center space-x-2 mb-4">
              <Select
                value={selectedLocation}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger className="w-full border-0 focus:ring-0">
                  <SelectValue placeholder="위치 선택" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#4f46e5",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                  scale: 8,
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
          {filteredRestaurants.map((restaurant) => (
            <Marker
              onClick={() => handleMarkerClick(restaurant)}
              key={restaurant.id}
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
        <Button
          onClick={handleCenterOnUser}
          variant="outline"
          size="icon"
          className="bg-white shadow-lg hover:bg-gray-100"
        >
          <MapPin className="h-5 w-5 text-indigo-600" />
        </Button>
      </div>

      <div>
        {filteredRestaurants.map((restaurant) => (
          <Card
            key={restaurant.id}
            className="mb-4 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {restaurant.name.charAt(0)}
                </div> */}
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
              {/* Special Offer 태그 */}
              {restaurant.specialOfferType &&
                restaurant.specialOfferType !== "none" && (
                  <div className="mb-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                        restaurant.specialOfferType === "gift"
                          ? "bg-pink-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {restaurant.specialOfferType === "gift"
                        ? "Extra Gift"
                        : "Discount"}
                    </span>
                    <span className="text-sm ml-2 text-gray-600">
                      {restaurant.specialOfferText}
                    </span>
                  </div>
                )}
              {/* 영업 정보, 리뷰 수 표시 */}
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
                {/* <span>{restaurant.district}</span>
                <span>|</span> */}
                <span className="line-clamp-1">
                  {getNeighborhood(restaurant.address)}
                </span>
              </div>

              {restaurant.images && restaurant.images.length > 0 && (
                <div className="grid grid-cols-2 gap-0.5">
                  {restaurant.images.slice(0, 4).map((image, index) => (
                    <div
                      key={image}
                      className={`relative aspect-square overflow-hidden `}
                    >
                      <Image
                        src={image}
                        alt={`${restaurant.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
