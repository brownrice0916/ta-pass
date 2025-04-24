"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
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
import GoogleMapsProvider from "@/app/google-maps-provider";
import RestaurantMap from "../components/restaurant-map";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export interface Review {
  id: string;
  user: { name: string; avatar: string };
  rating: number;
  createdAt: string;
  content: string;
  images: string[];
  restaurant?: Restaurant;
}

export default function RestaurantDetail() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [modalCarouselApi, setModalCarouselApi] = useState<CarouselApi | null>(
    null
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const handleSlideChange = useCallback(() => {
    if (carouselApi) {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    }
  }, [carouselApi]);

  useEffect(() => {
    if (carouselApi) {
      carouselApi.on("scroll", handleSlideChange);
      handleSlideChange();
    }
    return () => {
      carouselApi?.off("scroll", handleSlideChange);
    };
  }, [carouselApi, handleSlideChange]);

  useEffect(() => {
    if (restaurant) {
      fetchNearbyRestaurants(restaurant.latitude, restaurant.longitude);
    }
  }, [restaurant]);

  const checkBookmarkStatus = async () => {
    if (!session || !id) return;
    try {
      const response = await fetch(`/api/bookmarks/by-restaurant/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("bookmark data", data);
        setIsBookmarked(data.isBookmarked);
        if (data.bookmark) {
          setBookmarkId(data.bookmark.id);
        }
      } else {
        const localBookmarks = localStorage.getItem("userBookmarks");
        if (localBookmarks) {
          const bookmarksArray = JSON.parse(localBookmarks);
          setIsBookmarked(bookmarksArray.includes(id));
        }
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      toast.error("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    if (!id) return;

    // ✨ 여기에서 bookmarkId 없으면 중단
    if (isBookmarked && !bookmarkId) {
      toast.error("북마크 ID를 찾을 수 없습니다.");
      return;
    }

    setBookmarkLoading(true);
    try {
      const method = isBookmarked ? "DELETE" : "POST";
      const endpoint =
        isBookmarked && bookmarkId
          ? `/api/bookmarks/${bookmarkId}` // ✅ bookmarkId 필요
          : "/api/bookmarks";

      if (isBookmarked && !bookmarkId) {
        console.warn("bookmarkId is null while trying to DELETE");
        return;
      }

      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "POST" && {
          body: JSON.stringify({ restaurantId: id }),
        }),
      };

      const response = await fetch(endpoint, options);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || "북마크 처리 실패");
      }

      const localBookmarks = JSON.parse(
        localStorage.getItem("userBookmarks") || "[]"
      );
      const updatedBookmarks = isBookmarked
        ? localBookmarks.filter((bid: string) => bid !== id)
        : [...new Set([...localBookmarks, id])];
      localStorage.setItem("userBookmarks", JSON.stringify(updatedBookmarks));

      toast.success(
        isBookmarked ? "북마크가 해제되었습니다." : "북마크에 추가되었습니다."
      );
      setIsBookmarked(!isBookmarked);
      setBookmarkId(isBookmarked ? null : bookmarkId);
    } catch (error) {
      toast.error("북마크 처리 중 오류가 발생했습니다.");
      console.error("Bookmark toggle error:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  useEffect(() => {
    if (session && id) checkBookmarkStatus();
  }, [session, id]);

  useEffect(() => {
    if (restaurant && session && id) checkBookmarkStatus();
  }, [restaurant, session, id]);

  useEffect(() => {
    if (id) {
      const localBookmarks = localStorage.getItem("userBookmarks");
      if (localBookmarks) {
        const bookmarksArray = JSON.parse(localBookmarks);
        if (bookmarksArray.includes(id)) {
          setIsBookmarked(true);
        }
      }
    }
  }, [id]);

  const fetchNearbyRestaurants = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const res = await fetch(
        `/api/restaurants?latitude=${latitude}&longitude=${longitude}&radius=1`
      );
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (e) {
      console.error("Error fetching nearby restaurants:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/restaurants/${id}/reviews`);
      const data = await res.json();
      setReviews(data);
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        const data = await res.json();
        setRestaurant(data);
      } catch (e) {
        console.error("Error fetching restaurant:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRestaurant();
  }, [id]);

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

      {/* 이미지 슬라이더 영역 - 이미지가 없어도 공간 차지 */}
      <div className="relative">
        {restaurant.images && restaurant.images.length > 0 ? (
          <Carousel
            setApi={setCarouselApi}
            className="w-full"
            onChange={handleSlideChange}
          >
            <CarouselContent>
              {restaurant.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square w-full">
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
                      className={`object-cover transition-opacity duration-300 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          // 이미지가 없을 때 보여줄 빈 공간
          <div className="w-full aspect-square bg-gray-100 rounded-md"></div>
        )}

        {/* 북마크 버튼 */}
        <button
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
          className="absolute top-4 right-4 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
        >
          <Bookmark
            size={24}
            className={`transition-colors ${
              isBookmarked ? "fill-primary text-primary" : "text-gray-600"
            }`}
          />
        </button>

        {/* 이미지 인디케이터는 이미지가 있을 때만 표시 */}
        {restaurant.images && restaurant.images.length > 0 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {restaurant.images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${
                  currentSlide === index ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => {
                  if (carouselApi) {
                    carouselApi.scrollTo(index);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

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
                className={`h-4 w-4 ${
                  i < (restaurant?.rating || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground">
              ({reviews.length || 0} Reviews)
            </span>
          </div>
          {restaurant.specialOfferType?.length > 0 && (
            <div className="mb-2 mt-2 flex items-center">
              {restaurant.specialOfferType.map((offerType, index) => (
                <div key={`${restaurant.id}-offer-${index}`}>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs text-white mr-1 ${
                      offerType === "Special Gift"
                        ? "bg-pink-500"
                        : "bg-orange-500"
                    }`}
                  >
                    {offerType === "Special Gift" ? "Special Gift" : "Discount"}
                  </span>
                </div>
              ))}
              <span className="text-sm ml-2 text-gray-600 ">
                {restaurant.specialOfferText}
              </span>
            </div>
          )}
        </div>
        {restaurant.socialLinks && (
          <div className="p-2">
            {restaurant.socialLinks && (
              <div className="py-2">
                <SocialLinks links={restaurant.socialLinks} />
              </div>
            )}
          </div>
        )}
        {/* Photos Grid */}
        <div className="mb-6 mt-10">
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-3 gap-1">
            {reviews
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .filter((review) => review.images && review.images.length > 0)
              .slice(0, 6)
              .map((review, index) => (
                <div
                  key={index}
                  className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  )}
                  <Image
                    src={review.images[0]}
                    alt={`Review photo ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 25vw"
                    loading="lazy"
                    quality={75}
                    className={`object-cover transition-opacity duration-300 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </div>
              ))}
          </div>
          {selectedImageIndex !== null && (
            <div className="fixed inset-0 z-50">
              {/* 배경 오버레이 */}
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setSelectedImageIndex(null)}
              />

              {/* 모달 컨텐츠 */}
              <div className="relative h-full flex items-center justify-center p-4">
                <div className="relative w-full max-w-[393px] bg-white rounded-lg overflow-hidden">
                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="absolute top-2 right-2 z-50 text-gray-500 rounded-full p-1.5 hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>

                  {/* 캐러셀 */}
                  <Carousel setApi={setModalCarouselApi} className="w-full">
                    <CarouselContent>
                      {reviews
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .filter(
                          (review) => review.images && review.images.length > 0
                        )
                        .slice(0, 6)
                        .map((review, index) => (
                          <CarouselItem key={index}>
                            <div className="relative aspect-square w-full">
                              <Image
                                src={review.images[0]}
                                alt={`Review photo ${index + 1}`}
                                fill
                                quality={100}
                                className="object-contain"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                    </CarouselContent>
                  </Carousel>

                  {/* 좌우 네비게이션 버튼 */}
                  <button
                    onClick={() => modalCarouselApi?.scrollPrev()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-gray-100/80 text-gray-700 rounded-full p-1.5 hover:bg-gray-200 transition-colors w-8 h-8 flex items-center justify-center"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => modalCarouselApi?.scrollNext()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-gray-100/80 text-gray-700 rounded-full p-1.5 hover:bg-gray-200 transition-colors w-8 h-8 flex items-center justify-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Satisfaction */}
        <ReviewSection
          onReviewsChange={fetchReviews}
          restaurant={restaurant}
          reviews={reviews}
        />
        {/* About Section */}
        <div className="mb-6 mt-4">
          <h2 className="text-lg font-semibold mb-2">가게 소개</h2>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p className="text-sm">
                {restaurant?.description || "서비스 소개"}
              </p>
              <div className="mt-10 text-gray-500 text-sm">
                {restaurant.tags.map((tag, index) => (
                  <span key={index}>
                    {tag}
                    <span>
                      {index !== restaurant.tags.length - 1 ? "," : ""}
                    </span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">패스 제공 혜택</h2>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <pre className="text-sm whitespace-pre-wrap word-wrap break-words">
                {restaurant.specialOfferTextDetail}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 mt-4">
          <h2 className="text-lg font-semibold mb-2">Store Info</h2>
          <GoogleMapsProvider>
            <RestaurantMap
              center={{
                lat: restaurant.latitude,
                lng: restaurant.longitude,
              }}
              userLocation={null}
              mapRestaurants={restaurants}
              selectedMarker={null}
              onMarkerClick={() => {}}
              onUserLocationClick={() => {}}
              onBoundsChanged={() => {}}
              setSelectedMarker={() => {}}
              mapRef={mapRef}
            />
          </GoogleMapsProvider>
          <p className="text-sm">{restaurant?.address}</p>
        </div>
      </div>
    </div>
  );
}
