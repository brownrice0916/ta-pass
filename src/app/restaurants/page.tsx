"use client";

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
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import Image from "next/image";

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
        lat: 37.5665, // 서울 기본 좌표
        lng: 126.9780,
    });
    const [newRestaurant, setNewRestaurant] = useState({
        name: "",
        address: "",
        category: "",
        latitude: center.lat,
        longitude: center.lng,
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCenter({ lat: latitude, lng: longitude });
                    fetchNearbyRestaurants(latitude, longitude);
                },
                (error) => {
                    setError("위치 정보를 가져올 수 없습니다.");
                    setLoading(false);
                }
            );
        }
    }, []);

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

    const handleAddRestaurant = async (e: React.FormEvent) => {
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
            setNewRestaurant({
                name: "",
                address: "",
                category: "",
                latitude: center.lat,
                longitude: center.lng,
            });
        } catch (err) {
            console.error("Error adding restaurant:", err);
        }
    };

    const handleMapClick = (e: google.maps.MouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setNewRestaurant(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng
            }));
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRestaurant({ ...newRestaurant, address: e.target.value });
    };

    const handlePlaceSelect = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setNewRestaurant(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    address: place.formatted_address || "",
                }));
                setCenter({ lat, lng });
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} libraries={['places']}>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">내 주변 맛집</h1>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>식당 추가</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>새로운 식당 추가</DialogTitle>
                                <DialogDescription>
                                    지도를 클릭하여 식당 위치를 선택하세요
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <form onSubmit={handleAddRestaurant} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            식당 이름
                                        </label>
                                        <Input
                                            value={newRestaurant.name}
                                            onChange={(e) =>
                                                setNewRestaurant({ ...newRestaurant, name: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">주소</label>
                                        <Autocomplete
                                            onPlaceChanged={handlePlaceSelect}
                                            onLoad={(ref) => autocompleteRef.current = ref}
                                        >
                                            <Input
                                                value={newRestaurant.address}
                                                onChange={handleAddressChange}
                                                required
                                            />
                                        </Autocomplete>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            카테고리
                                        </label>
                                        <Input
                                            value={newRestaurant.category}
                                            onChange={(e) =>
                                                setNewRestaurant({
                                                    ...newRestaurant,
                                                    category: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            취소
                                        </Button>
                                        <Button type="submit">추가</Button>
                                    </div>
                                </form>
                                <div className="h-[400px]">
                                    <GoogleMap
                                        mapContainerStyle={containerStyle}
                                        center={center}
                                        zoom={15}
                                        onClick={handleMapClick}
                                    >
                                        {/* Current selected location */}
                                        <Marker
                                            position={{
                                                lat: newRestaurant.latitude,
                                                lng: newRestaurant.longitude,
                                            }}
                                        />
                                        {/* Existing restaurants */}
                                        {restaurants.map((restaurant) => (
                                            <Marker
                                                key={restaurant.id}
                                                position={{
                                                    lat: restaurant.latitude,
                                                    lng: restaurant.longitude,
                                                }}
                                            />
                                        ))}
                                    </GoogleMap>
                                </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurants.map((restaurant) => (
                        <Card key={restaurant.id} className="overflow-hidden">
                            <div className="p-4">
                                <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                                <p className="text-sm text-gray-500">{restaurant.address}</p>
                                {restaurant.distance && (
                                    <p className="text-sm text-gray-500">
                                        {restaurant.distance.toFixed(2)}km away
                                    </p>
                                )}
                                {restaurant.rating && (
                                    <div className="flex items-center mt-2">
                                        <span>★</span>
                                        <span className="ml-1">{restaurant.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </LoadScript>
    );
}
