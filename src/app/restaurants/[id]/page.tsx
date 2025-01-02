"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { ReviewForm } from "@/components/review-form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Star, Bookmark } from "lucide-react";

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

interface Review {
  id: string;
  user: { name: string };
  rating: number;
  createdAt: string;
  content: string;
  images: string[]; // 리뷰 이미지 배열 추가
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function RestaurantDetail() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Error:", error);
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
        if (!response.ok) throw new Error("Failed to fetch restaurant");
        const data = await response.json();
        setRestaurant(data);
      } catch (error) {
        console.error("Error:", error);
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
    <div className="container mx-auto p-4 pb-16 max-w-3xl">
      <Button variant="outline" className="mb-4" onClick={() => router.back()}>
        뒤로 가기
      </Button>
      <Button
        variant="outline"
        className="mb-4 ml-2"
        onClick={() => router.push(`/restaurants/${params.id}/edit`)}
      >
        수정하기
      </Button>
      <Card className="mb-6 overflow-hidden">
        {restaurant.images && restaurant.images.length > 0 && (
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {restaurant.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={image}
                        alt={`${restaurant.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-2">{restaurant.address}</p>
              {restaurant.category && (
                <p className="text-sm text-gray-500">
                  카테고리: {restaurant.category}
                </p>
              )}
            </div>
            <Button variant="outline" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>

          {restaurant.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(restaurant.rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Photos</h2>
        <div className="grid grid-cols-3 gap-1">
          {restaurant.images?.map((image, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={image}
                alt={`${restaurant.name} gallery image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{
            lat: restaurant.latitude,
            lng: restaurant.longitude,
          }}
          zoom={17}
        >
          <Marker
            position={{
              lat: restaurant.latitude,
              lng: restaurant.longitude,
            }}
            title={restaurant.name}
          />
        </GoogleMap>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Reviews</h2>
        <div className="space-y-4 mb-8">
          {reviews.map((review: Review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium">{review.user.name}</span>
                    <div className="flex ml-2">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.content}</p>
                {console.log(review.images)}
                {/* Review images */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {review.images.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={image}
                          alt={`${restaurant.name} image ${index + 1}`}
                          fill
                          className="object-cover"
                          priority // Add this line to prioritize the image loading
                        />
                        <p>img</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <ReviewForm restaurantId={restaurant.id} onReviewAdded={fetchReviews} />
      </div>
    </div>
  );
}
