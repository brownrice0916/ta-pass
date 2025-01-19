"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { ReviewForm } from "@/components/review-form";
import { Instagram, Facebook, Twitter, Globe, Youtube, BookOpen } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Star } from "lucide-react";
import { Restaurant } from "@prisma/client";
import ReviewSection from "../components/review-section";
import { getNeighborhood } from "@/lib/address";
import SocialLinks from "../components/social-links";

export interface Review {
  id: string;
  user: { name: string; avatar: string };
  rating: number;
  createdAt: string;
  content: string;
  images: string[]; // 리뷰 이미지 배열 추가
}

// 플랫폼별 아이콘 매핑
const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  blog: BookOpen,
  youtube: Youtube,
  website: Globe,
} as const;


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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [imageLoading, setImageLoading] = useState(true);


  // 슬라이드 변경 핸들러
  const handleSlideChange = useCallback(() => {
    if (carouselApi) {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    }
  }, [carouselApi]);

  // Carousel API 이벤트 연결
  useEffect(() => {
    if (carouselApi) {
      carouselApi.on("scroll", handleSlideChange); // 스크롤 이벤트 핸들러 등록
      handleSlideChange(); // 초기 상태 설정
    }

    return () => {
      carouselApi?.off("scroll", handleSlideChange); // 클린업
    };
  }, [carouselApi, handleSlideChange]);

  useEffect(() => {
    if (restaurant) {
      fetchNearbyRestaurants(restaurant!.latitude, restaurant!.longitude);
    }
  }, [restaurant]);

  const fetchNearbyRestaurants = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const response = await fetch(
        `/api/restaurants?latitude=${latitude}&longitude=${longitude}&radius=1`
      );
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      // API 응답이 { restaurants: [], metadata: {} } 구조이므로 restaurants 배열만 설정
      setRestaurants(data.restaurants || []);
      console.log("data", data);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };
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

  // const handleSlideChange = (newIndex: number) => {
  //   setCurrentSlide(newIndex);
  // };

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
      {restaurant.images && restaurant.images.length > 0 && (
        <div className="relative">
          <Carousel setApi={setCarouselApi} className="w-full" onChange={handleSlideChange}>
            <CarouselContent>
              {restaurant.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square w-full">
                    <Image
                      src={image}
                      alt={`${restaurant.name} image ${index + 1}`}
                      fill
                      className="object-cover rounded-none"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {restaurant.images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${currentSlide === index ? "bg-white" : "bg-white/50"
                  }`}
                onClick={() => {
                  if (carouselApi) {
                    carouselApi.scrollTo(index);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-2">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {getNeighborhood(restaurant?.address)}
          </p>
          <div className="flex">
            <h1 className="text-xl font-semibold text-primary">
              {restaurant?.name}
            </h1>
            <span className="mx-2"> | </span>
            <h1>{restaurant?.category}</h1>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < (restaurant?.rating || 0)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
                  }`}
              />
            ))}
            <span className="text-sm text-muted-foreground">
              ({reviews.length || 0} Reviews)
            </span>
          </div>
          {/* <div className="mt-2">
            <span className="text-lg font-bold">36,000원</span>
            <span className="text-sm text-red-500 ml-2">20% 할인</span>
          </div> */}
        </div>
        {restaurant.socialLinks && <div className="p-2">
          {restaurant.socialLinks && (
            <div className="py-2">
              <SocialLinks links={restaurant.socialLinks} />
            </div>
          )}
        </div>}
        {/* Photos Grid */}
        <div className="mb-6 mt-10">
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-3 gap-1">
            {restaurant.images?.slice(0, 6).map((image, index) => (
              <div key={index} className="relative aspect-square">
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
        </div>

        {/* Customer Satisfaction */}
        <ReviewSection onReviewsChange={fetchReviews} restaurant={restaurant} reviews={reviews} />
        {/* About Section */}
        <div className="mb-6 mt-4">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p>{restaurant?.description || "서비스 소개"}</p>
              <div className="mt-10 text-gray-500 text-sm">
                {restaurant.tags.map((tag, index) => (<span key={index}>{tag}<span>{index !== restaurant.tags.length - 1 ? "," : ''}</span></span>))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Reservation Info */}
        {/* <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Reservation Info</h2>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p>{restaurant?.about || "서비스 소개"}</p>
            </CardContent>
          </Card>
        </div> */}
        <div className="mb-6 mt-4">
          <h2 className="text-lg font-semibold mb-2">Store Info</h2>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{
              lat: restaurant.latitude,
              lng: restaurant.longitude,
            }}
            zoom={17}
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
            <Marker
              position={{
                lat: restaurant.latitude,
                lng: restaurant.longitude,
              }}
              icon={{
                url: '/markers/my-location.png',
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(20, 20),
              }}
              title={restaurant.name}
            />
            {restaurants.map((restaurant) => (
              <Marker
                // onClick={() => handleMarkerClick(restaurant)}
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
          </GoogleMap>
          <p className="text-sm">{restaurant?.address}</p>
        </div>

        {/* <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>

          <ReviewForm
            restaurantId={restaurant.id}
            onReviewAdded={fetchReviews}
          />
        </div> */}
      </div>
    </div >
  );
}
