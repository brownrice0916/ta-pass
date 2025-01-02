"use client"

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { MapPin, Upload, X } from "lucide-react";
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


interface UploadedImage {
    file: File;
    preview: string;
}


export default function PostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [newPlace, setNewPlace] = useState({
        name: "",
        address: "",
        category: "",
        latitude: 0,
        longitude: 0,
        rating: 0,
    });
    const [images, setImages] = useState<UploadedImage[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 업로드 처리
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: UploadedImage[] = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setImages(prev => [...prev, ...newImages].slice(0, 5)); // 최대 5개까지만 허용
    };
    // 이미지 제거
    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    // 이미지 드래그 앤 드롭 처리
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files)
            .filter(file => file.type.startsWith('image/'));

        const newImages: UploadedImage[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setImages(prev => [...prev, ...newImages].slice(0, 5));
    };

    useEffect(() => {
        return () => {
            images.forEach(image => URL.revokeObjectURL(image.preview));
        };
    }, []);


    const initAutocomplete = () => {
        if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
        }

        if (inputRef.current && window.google) {
            const selectedCategoryTypes = CATEGORIES.find(cat => cat.value === selectedCategory)?.types || ['establishment'];

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

                    setNewPlace({
                        name: place.name || "",
                        address: place.formatted_address || "",
                        category: selectedCategory,
                        latitude: lat,
                        longitude: lng,
                        rating: place.rating || 0,
                    });
                }
            });
        }
    };

    useEffect(() => {
        initAutocomplete();
    }, [selectedCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlace.name || !selectedCategory) return;

        try {
            setLoading(true);

            // 이미지 파일들을 FormData로 변환
            const formData = new FormData();
            formData.append('data', JSON.stringify({
                ...newPlace,
                category: selectedCategory,
            }));

            // 이미지 파일들 추가
            images.forEach((image, index) => {
                formData.append(`images`, image.file);
            });

            const response = await fetch("/api/restaurants", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to add place");

            router.push("/restaurants");
            router.refresh();
        } catch (error) {
            console.error("Error adding place:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <Card className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">새로운 장소 추가</h1>
                    <p className="text-muted-foreground">
                        카테고리를 선택하고 장소를 검색하여 추가하세요
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            카테고리
                        </label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(value) => {
                                setSelectedCategory(value);
                                if (inputRef.current) {
                                    inputRef.current.value = '';
                                }
                                setNewPlace({
                                    name: "",
                                    address: "",
                                    category: value,
                                    latitude: 0,
                                    longitude: 0,
                                    rating: 0,
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="카테고리를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.filter(cat => cat.value !== 'all').map((category) => (
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
                        <label className="block text-sm font-medium mb-2">
                            장소 검색
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <Input
                                ref={inputRef}
                                className="pl-10"
                                placeholder="장소 이름이나 주소를 검색하세요"
                                disabled={!selectedCategory}
                            />
                        </div>
                    </div>

                    {/* 이미지 업로드 섹션 */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            이미지 추가 (최대 5개)
                        </label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                            />
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                클릭하거나 이미지를 드래그하여 업로드하세요
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF (최대 5MB)
                            </p>
                        </div>

                        {/* 이미지 미리보기 */}
                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image
                                            src={image.preview}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="rounded-lg object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                    {newPlace.name && (
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <h3 className="font-medium">선택된 장소 정보</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">이름:</span> {newPlace.name}</p>
                                <p><span className="font-medium">주소:</span> {newPlace.address}</p>
                                <p><span className="font-medium">카테고리:</span> {
                                    CATEGORIES.find(cat => cat.value === selectedCategory)?.label || '정보 없음'
                                }</p>
                                <p><span className="font-medium">위도:</span> {newPlace.latitude.toFixed(6)}</p>
                                <p><span className="font-medium">경도:</span> {newPlace.longitude.toFixed(6)}</p>
                                <p><span className="font-medium">평점:</span> {newPlace.rating.toFixed(1)}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/restaurants')}
                            className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={!newPlace.name || !selectedCategory || loading}
                            className="flex-1"
                        >
                            {loading ? "추가 중..." : "추가하기"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}