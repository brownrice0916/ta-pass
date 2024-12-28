"use client"

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useRouter } from "next/navigation";

const libraries = ["places"];

interface Restaurant {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    category?: string;
    rating?: number;
    images: string[];
    distance?: number;
}

const containerStyle = {
    width: '100%',
    height: '400px'
};

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [center, setCenter] = useState({
        lat: 37.5665,
        lng: 126.9780,
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

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCenter({ lat: latitude, lng: longitude });
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

    // Places Autocomplete 초기화
    const initAutocomplete = () => {
        // autocompleteRef가 이미 존재하면 제거
        if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
        }

        if (inputRef.current && window.google) {
            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ['name', 'formatted_address', 'geometry', 'rating', 'types'],
                types: ['restaurant', 'food'],  // 식당 관련 장소만 검색
                componentRestrictions: { country: 'kr' }  // 한국 내 장소만 검색
            });

            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current?.getPlace();
                if (place && place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    const restaurantData = {
                        name: place.name || "",
                        address: place.formatted_address || "",
                        latitude: lat,
                        longitude: lng,
                        category: place.types ? place.types[0].replace(/_/g, ' ') : "",
                        rating: place.rating || 0,
                    };

                    setNewRestaurant(restaurantData);
                    setCenter({ lat, lng });
                    // handleAddSelectedRestaurant(restaurantData);
                }
            });
        }
    };

    // Google Maps Script 로드 완료 후 Autocomplete 초기화
    useEffect(() => {
        if (isOpen) {
            // 다이얼로그가 열릴 때 초기화
            setTimeout(() => {
                initAutocomplete();
            }, 0);
        }
    }, [isOpen]); // 다이얼로그가 열릴 때마다 초기화

    const handleAddSelectedRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/restaurants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newRestaurant),
            });

            if (!response.ok) throw new Error("Failed to add restaurant");

            const addedRestaurant = await response.json();
            setRestaurants((prev) => [...prev, addedRestaurant]);
            setIsOpen(false);

            if (inputRef.current) {
                inputRef.current.value = "";
            }

            setNewRestaurant({
                name: "",
                address: "",
                category: "",
                latitude: center.lat,
                longitude: center.lng,
                rating: 0,
            });
        } catch (err) {
            console.error("Error adding restaurant:", err);
        }
    };

    const fetchNearbyRestaurants = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `/api/restaurants?latitude=${latitude}&longitude=${longitude}&radius=1`
            );
            if (!response.ok) throw new Error("Failed to fetch restaurants");
            const data = await response.json();
            setRestaurants(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (

        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">내 주변 맛집</h1>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>샘플 식당 추가</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>새로운 식당 추가</DialogTitle>
                            <DialogDescription>
                                식당을 검색하고 선택하세요
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <form onSubmit={handleAddSelectedRestaurant} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        식당 검색
                                    </label>
                                    <Input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="식당 이름이나 주소를 검색하세요"
                                    />
                                </div>
                                {newRestaurant.name && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">선택된 식당 정보:</p>
                                        <div className="text-sm">
                                            <p><strong>이름:</strong> {newRestaurant.name}</p>
                                            <p><strong>주소:</strong> {newRestaurant.address}</p>
                                            <p><strong>카테고리:</strong> {newRestaurant.category}</p>
                                            <p><strong>위도:</strong> {newRestaurant.latitude.toFixed(6)}</p>
                                            <p><strong>경도:</strong> {newRestaurant.longitude.toFixed(6)}</p>
                                            <p><strong>평점:</strong> {newRestaurant.rating.toFixed(1)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* ... 기존 내용 ... */}
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                        취소
                                    </Button>
                                    <Button type="submit" disabled={!newRestaurant.name}>
                                        추가
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={15}
                >
                    {restaurants.map((restaurant) => (
                        <Marker
                            key={restaurant.id}
                            position={{
                                lat: restaurant.latitude,
                                lng: restaurant.longitude,
                            }}
                            title={restaurant.name}
                        />
                    ))}
                </GoogleMap>
            </div>

            <div className="space-y-4">
                {restaurants.map((restaurant) => (
                    <Card
                        key={restaurant.id}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                    >
                        <div className="p-4">
                            <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                            <p className="text-sm text-gray-500">{restaurant.address}</p>
                            <p className="text-sm text-gray-500">카테고리: {restaurant.category || '정보 없음'}</p>
                            {restaurant.distance && (
                                <p className="text-sm text-gray-500">
                                    거리: {restaurant.distance.toFixed(2)}km
                                </p>
                            )}
                            {restaurant.rating && (
                                <div className="flex items-center mt-2">
                                    <span>평점: </span>
                                    <span className="ml-1">{restaurant.rating.toFixed(1)}</span>
                                    <span className="ml-1">★</span>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>

    );
}