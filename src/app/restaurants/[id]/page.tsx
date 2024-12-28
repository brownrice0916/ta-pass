"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleMap, Marker, } from "@react-google-maps/api";
import { ReviewForm } from '@/components/review-form';

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

export default function RestaurantDetail() {
    const params = useParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);

    // 리뷰 목록 가져오기
    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/restaurants/${params.id}/reviews`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            const data = await response.json();
            console.log("data", data)
            setReviews(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchReviews();
        }
    }, [params.id]);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const response = await fetch(`/api/restaurants/${params.id}`);
                if (!response.ok) throw new Error('Failed to fetch restaurant');
                const data = await response.json();
                setRestaurant(data);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchRestaurant();
        }
    }, [params.id]);

    if (loading) return <div>Loading...</div>;
    if (!restaurant) return <div>Restaurant not found</div>;

    return (
        <div className="container mx-auto p-4 pb-16">
            <Button
                variant="outline"
                className="mb-4"
                onClick={() => router.back()}
            >
                뒤로 가기
            </Button>

            <Card className="mb-6">
                <div className="p-6">
                    <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                    <p className="text-gray-600 mb-4">{restaurant.address}</p>
                    {restaurant.category && (
                        <p className="text-sm text-gray-500 mb-2">
                            카테고리: {restaurant.category}
                        </p>
                    )}
                    {restaurant.rating && (
                        <div className="flex items-center mb-4">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{restaurant.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </Card>

            <div className="mb-6">

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{
                        lat: restaurant.latitude,
                        lng: restaurant.longitude
                    }}
                    zoom={17}
                >
                    <Marker
                        position={{
                            lat: restaurant.latitude,
                            lng: restaurant.longitude
                        }}
                        title={restaurant.name}
                    />
                </GoogleMap>

            </div>
            <div className="mt-6 space-y-4">
                {reviews.map((review: any) => (
                    <Card key={review.id}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <span className="font-medium">{review.user.name}</span>
                                    <span className="text-yellow-500 ml-2">
                                        {'★'.repeat(review.rating)}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{review.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">리뷰</h2>
                <ReviewForm restaurantId={restaurant.id} onReviewAdded={fetchReviews} />


            </div>
        </div>
    );
}

