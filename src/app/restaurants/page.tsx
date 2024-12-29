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
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import Image from "next/image";

const CATEGORIES = [
    { id: 'all', label: 'All', value: 'all' },
    { id: 'fashion', label: 'Fashion', value: 'fashion', types: ['clothing_store', 'shopping_mall'] },
    { id: 'beauty', label: 'Beauty', value: 'beauty', types: ['beauty_salon', 'hair_care'] },
    { id: 'luxury', label: 'Luxury', value: 'luxury', types: ['jewelry_store', 'shopping_mall'] },
    { id: 'activities', label: 'Activities', value: 'activities', types: ['gym', 'park', 'amusement_park'] },
    { id: 'culture', label: 'Culture', value: 'culture', types: ['museum', 'art_gallery', 'movie_theater'] },
    { id: 'food', label: 'Food', value: 'food', types: ['restaurant', 'cafe'] }
];

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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
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

    const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);


    useEffect(() => {
        let filtered = restaurants;

        // 카테고리 필터링
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(r => r.category === selectedCategory);
        }

        // 검색어 필터링
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
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

    const handleMarkerClick = (restaurant: Restaurant) => {
        setSelectedMarker(restaurant);
    };


    const initAutocomplete = () => {
        if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
        }

        if (inputRef.current && window.google) {
            const selectedCategoryTypes = CATEGORIES.find(cat => cat.value === selectedCategory)?.types || ['restaurant'];

            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ['name', 'formatted_address', 'geometry', 'rating', 'types'],
                types: selectedCategoryTypes,
                componentRestrictions: { country: 'kr' }
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
                        category: selectedCategory,
                        rating: place.rating || 0,
                    };

                    setNewRestaurant(restaurantData);
                    setCenter({ lat, lng });
                }
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            initAutocomplete();
        }
    }, [selectedCategory, isOpen]);

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
        <div className="container mx-auto py-2">
            <div className="flex justify-end mb-6">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>장소 추가</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>새로운 장소 추가</DialogTitle>
                            <DialogDescription>
                                카테고리를 선택하고 장소를 검색하세요
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSelectedRestaurant} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        카테고리 선택
                                    </label>
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={(value) => {
                                            setSelectedCategory(value);
                                            if (inputRef.current) {
                                                inputRef.current.value = '';
                                            }
                                            setNewRestaurant({
                                                name: "",
                                                address: "",
                                                category: value,
                                                latitude: center.lat,
                                                longitude: center.lng,
                                                rating: 0,
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="카테고리 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((category) => (
                                                <SelectItem
                                                    key={category.value}
                                                    value={category.value}
                                                >
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        장소 검색
                                    </label>
                                    <Input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="장소 이름이나 주소를 검색하세요"
                                    />
                                </div>
                            </div>
                            {newRestaurant.name && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">선택된 장소 정보:</p>
                                    <div className="text-sm">
                                        <p><strong>이름:</strong> {newRestaurant.name}</p>
                                        <p><strong>주소:</strong> {newRestaurant.address}</p>
                                        <p><strong>카테고리:</strong> {
                                            CATEGORIES.find(cat => cat.value === newRestaurant.category)?.label ||
                                            newRestaurant.category || '정보 없음'
                                        }</p>
                                        <p><strong>위도:</strong> {newRestaurant.latitude.toFixed(6)}</p>
                                        <p><strong>경도:</strong> {newRestaurant.longitude.toFixed(6)}</p>
                                        <p><strong>평점:</strong> {newRestaurant.rating.toFixed(1)}</p>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    취소
                                </Button>
                                <Button type="submit" disabled={!newRestaurant.name}>
                                    추가
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-4 relative">
                <div className="absolute top-1 left-1 right-1 z-10 space-y-4">
                    <div className="bg-transparent rounded-lg p-1">
                        <div className="flex p-1 bg-white rounded-md items-center space-x-2 mb-4">

                            {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg> */}
                            <Search />
                            <Input
                                type="text"
                                placeholder="Stay, shop, and save—where to?"
                                className="w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1 overflow-x-auto pb-1 -mb-1 bg-gray">
                            {CATEGORIES.map((category) => (
                                <Button

                                    key={category.id}
                                    variant={selectedCategory === category.value ? "default" : "outline"}
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
                        fullscreenControl: false
                    }}
                >
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
                    {selectedMarker && <InfoWindow
                        position={{
                            lat: selectedMarker!.latitude,
                            lng: selectedMarker!.longitude
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-semibold mb-1">{selectedMarker!.name}</h3>
                            <p className="text-sm text-gray-600">{selectedMarker!.address}</p>
                            <div className="flex items-center mt-2">
                                <span>평점: </span>
                                <span className="ml-1">{selectedMarker?.rating?.toFixed(1)}</span>
                                <span className="ml-1">★</span>
                            </div>
                            <Button
                                className="w-full mt-2 text-sm"
                                size="sm"
                                onClick={() => router.push(`/restaurants/${selectedMarker!.id}`)}
                            >
                                자세히 보기
                            </Button>
                        </div>
                    </InfoWindow>}
                </GoogleMap>

            </div>

            <div >
                {filteredRestaurants.map((restaurant) => (
                    <Card
                        key={restaurant.id}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
                        onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                    >
                        {restaurant.images && restaurant.images.length > 0 && (
                            <div className="aspect-square relative">
                                <Image
                                    src={restaurant.images[0]}
                                    alt={restaurant.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="p-4 space-y-2">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base line-clamp-1">
                                    {restaurant.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {restaurant.address}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {CATEGORIES.find(cat => cat.value === restaurant.category)?.label || '기타'}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 text-sm">
                                {restaurant.distance && (
                                    <span className="text-muted-foreground">
                                        {restaurant.distance.toFixed(2)}km
                                    </span>
                                )}
                                {restaurant.rating && (
                                    <div className="flex items-center text-yellow-500">
                                        <span className="mr-1">★</span>
                                        <span>{restaurant.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}