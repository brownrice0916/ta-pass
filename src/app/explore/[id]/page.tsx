"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2, ChevronLeft, ChevronRight, X } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";
import { emojiMap } from "@/lib/tags";

export interface Review {
  id: string;
  user: { name: string; avatar: string; image: string };
  rating: number;
  createdAt: string;
  content: string;
  images: string[];
  tags: string[];
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
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(
    0
  );
  // 컴포넌트 상단에 상태 변수 추가
  const [copiedName, setCopiedName] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // References for section navigation
  const photosSectionRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const benefitsSectionRef = useRef<HTMLDivElement>(null);
  const infoSectionRef = useRef<HTMLDivElement>(null);
  // 기존 state 선언부에 다음 추가
  const [activeTab, setActiveTab] = useState<
    "photos" | "reviews" | "benefits" | "info"
  >("photos");

  const scrollToSection = (
    ref: React.RefObject<HTMLDivElement>,
    tab: "photos" | "reviews" | "benefits" | "info"
  ) => {
    if (ref.current) {
      // 선택된 탭 업데이트
      setActiveTab(tab);

      // 스크롤 위치 조정 (사진 탭의 경우 약간 위로)
      const yOffset = tab === "photos" ? -50 : 0;
      const y =
        ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ behavior: "smooth", top: y });
    }
  };

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
    if (id) {
      fetch(`/api/restaurants/${id}/view`, {
        method: "POST",
      }).catch((err) => console.error("Failed to increase view count", err));
    }
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      fetchNearbyRestaurants(restaurant.latitude, restaurant.longitude);
    }
  }, [restaurant]);

  const checkBookmarkStatus = async () => {
    const currentId = id;
    if (!currentId) return;

    // localStorage 먼저 확인
    const localBookmarks = localStorage.getItem("userBookmarks");
    if (localBookmarks) {
      const bookmarksArray = JSON.parse(localBookmarks);
      if (bookmarksArray.includes(currentId)) {
        setIsBookmarked(true);
      }
    }

    // 로그인한 경우 서버에서 다시 확인
    if (!session) return;

    try {
      const response = await fetch(`/api/bookmarks/by-restaurant/${currentId}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        if (data.bookmark) {
          setBookmarkId(data.bookmark.id);
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

    const currentId = id;
    const currentBookmarkId = bookmarkId;

    if (isBookmarked && !currentBookmarkId) {
      toast.error("북마크 ID를 찾을 수 없습니다.");
      return;
    }

    setBookmarkLoading(true);
    try {
      const method = isBookmarked ? "DELETE" : "POST";
      const endpoint = isBookmarked
        ? `/api/bookmarks/${currentBookmarkId}`
        : "/api/bookmarks";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "POST" && {
          body: JSON.stringify({ restaurantId: currentId }),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || "북마크 처리 실패");
      }

      if (!isBookmarked) {
        const data = await response.json();
        setBookmarkId(data.bookmark.id);

        // ✅ BookmarkLog 기록
        await fetch("/api/bookmarks/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: currentId }),
        });
      } else {
        setBookmarkId(null);
      }

      setIsBookmarked(!isBookmarked);
      toast.success(
        isBookmarked
          ? t("bookmarkRemoved", language)
          : t("bookmarkAdded", language)
      );
    } catch (error) {
      toast.error("북마크 처리 중 오류 발생");
      console.error("Bookmark toggle error:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !restaurant || !id) return;
    checkBookmarkStatus();
  }, [session, restaurant, id]);

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
  const [photoCarouselApi, setPhotoCarouselApi] = useState<CarouselApi | null>(
    null
  );
  const { language } = useLanguage();
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

  // Generate tag statistics for the review chart
  const generateTagStats = () => {
    const tagCount: Record<string, number> = {};

    // Count occurrences of each tag
    reviews.forEach((review) => {
      if (review.tags && review.tags.length > 0) {
        review.tags.forEach((tag) => {
          // Remove emoji from tag for counting
          const tagText = tag.replace(/^\p{Emoji}/gu, "").trim();
          tagCount[tagText] = (tagCount[tagText] || 0) + 1;
        });
      }
    });

    // Convert to array and sort
    const sortedTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return sortedTags.slice(0, 8); // Return top 8 tags
  };

  const tagStats = generateTagStats();

  // Find the max count to normalize bars
  const maxTagCount =
    tagStats.length > 0 ? Math.max(...tagStats.map((stat) => stat.count)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-xl font-medium mb-2"> {t("notFound", language)}</h2>
        <Button onClick={() => router.back()}>{t("goBack", language)}</Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Restaurant Header */}
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
                  <div className="relative h-64 w-full md:h-80">
                    {imageLoading && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                    )}
                    <Image
                      src={image}
                      alt={`${restaurant.name} ${index + 1}`}
                      fill
                      sizes="100vw"
                      priority
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

            {/* Slide indicators */}
            {restaurant.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {restaurant.images.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      currentSlide === index ? "bg-white" : "bg-white/60"
                    }`}
                    onClick={() => carouselApi?.scrollTo(index)}
                  />
                ))}
              </div>
            )}
          </Carousel>
        ) : (
          <div className="w-full h-48 bg-gray-100"></div>
        )}

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm rounded-full h-10 w-10"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/80 backdrop-blur-sm rounded-full h-10 w-10"
              onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator
                    .share({
                      title: restaurant.name,
                      text: `${restaurant.name} - ${restaurant.description}`,
                      url: window.location.href,
                    })
                    .catch((err) => console.error("Share failed:", err));
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success(t("linkCopied", language));
                }
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-10 w-10 ${
                isBookmarked
                  ? "bg-blue-500 text-white"
                  : "bg-white/80 backdrop-blur-sm"
              }`}
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
            >
              <Bookmark
                className={`h-5 w-5 ${isBookmarked ? "fill-white" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>
      {/* Restaurant Info */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <span>{getNeighborhood(restaurant.address)}</span>
            </div>
            <h1
              className="text-xl font-bold flex items-center cursor-pointer relative"
              onClick={() => {
                navigator.clipboard.writeText(restaurant.name);
                setCopiedName(true);
                setTimeout(() => setCopiedName(false), 2000);
              }}
              title="클릭하여 가게 이름 복사하기"
            >
              {restaurant.name}
              {copiedName && (
                <span className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded">
                  복사되었습니다!
                </span>
              )}
              <span className="ml-2 px-2 text-xs py-0.5 bg-blue-100 text-blue-800 rounded-full">
                {(restaurant as any).category.name}
              </span>
            </h1>
            <div className="flex items-center mt-2">
              <div className="flex">
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
              </div>
              <span className="ml-2 text-sm text-gray-600 font-medium">
                {restaurant.rating?.toFixed(1) || "0.0"}
              </span>
              <span className="mx-1 text-gray-300">|</span>
              <span className="text-sm text-gray-600">
                {t("bookmarkAdded", language)} {reviews.length}
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex justify-between"
          onClick={() => scrollToSection(benefitsSectionRef as any, "benefits")}
        >
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
              {/* <span className="text-sm ml-2 text-gray-600 ">
                {restaurant.specialOfferText}
              </span> */}
            </div>
          )}
          <div className="flex items-center px-4 py-0">
            {restaurant.socialLinks && (
              <div className="p-2">
                {restaurant.socialLinks && (
                  <div className="py-2">
                    <SocialLinks links={restaurant.socialLinks} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className=" px-2 py-3 text-sm">
          <p className="text-sm mb-2 flex items-center">
            <span className="mr-2">📍</span>
            <span>{restaurant.address}</span>
            <button
              className="ml-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                navigator.clipboard.writeText(restaurant.address);
                toast.success("주소가 복사되었습니다");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </p>
          <p className="flex">
            <span className="mr-2">🕒 </span>

            {restaurant.openingHoursText || "영업 시간 정보 없음"}
          </p>
        </div>
      </div>
      {/* Navigation Tabs */}
      <div className="border-b sticky top-0 bg-white z-10">
        <div className="flex justify-between">
          <button
            className={`py-3 px-6 text-center text-sm font-medium ${
              activeTab === "photos" ? "text-blue-500" : "text-gray-500"
            }`}
            style={{
              borderBottom:
                activeTab === "photos" ? "2px solid #3b82f6" : "none",
            }}
            onClick={() => scrollToSection(photosSectionRef as any, "photos")}
          >
            {t("photos", language)}
          </button>
          <button
            className={`py-3 px-6 text-center text-sm font-medium ${
              activeTab === "reviews"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500"
            }`}
            style={{
              borderBottom:
                activeTab === "reviews" ? "2px solid #3b82f6" : "none",
            }}
            onClick={() => scrollToSection(reviewsSectionRef as any, "reviews")}
          >
            {t("review", language)}
          </button>
          <button
            className={`py-3 px-6 text-center text-sm font-medium ${
              activeTab === "benefits"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500"
            }`}
            style={{
              borderBottom:
                activeTab === "benefits" ? "2px solid #3b82f6" : "none",
            }}
            onClick={() =>
              scrollToSection(benefitsSectionRef as any, "benefits")
            }
          >
            {t("benefit", language)}
          </button>
          <button
            className={`py-3 px-6 text-center text-sm font-medium ${
              activeTab === "info"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500"
            }`}
            style={{
              borderBottom: activeTab === "info" ? "2px solid #3b82f6" : "none",
            }}
            onClick={() => scrollToSection(infoSectionRef as any, "info")}
          >
            {t("description", language)}
          </button>
        </div>
      </div>
      <div ref={photosSectionRef} className="pl-4 py-6">
        <h2 className="text-lg font-bold mb-4"> {t("photos", language)}</h2>

        <Carousel
          setApi={setPhotoCarouselApi}
          className="w-full round-xl"
          opts={{
            align: "start",
            containScroll: "trimSnaps",
          }}
        >
          <CarouselContent>
            {reviews
              .filter((review) => review.images && review.images.length > 0)
              .flatMap((review) =>
                review.images.map((image, imgIndex) => (
                  <CarouselItem
                    key={`${review.id}-${imgIndex}`}
                    className="basis-[90%] pl-1"
                  >
                    <div
                      className="relative aspect-[16/9] cursor-pointer overflow-hidden"
                      // style={{
                      //   borderTopLeftRadius: "0.75rem",
                      //   borderBottomLeftRadius: "0.75rem",
                      // }}
                      onClick={() => setSelectedImageIndex(imgIndex)}
                    >
                      <Image
                        src={image}
                        alt={`${t("photos", language)}} ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))
              )}
          </CarouselContent>
        </Carousel>
      </div>
      {/* 가로선 추가 */}
      <div className="h-[1px] bg-[#ededed] w-full my-6"></div>
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
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden">
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
      {/* Reviews Section */}
      <div
        ref={reviewsSectionRef}
        className="px-4 pt-2 border-t-8 border-gray-100"
      >
        {/* Review List */}
        <div className="mb-5">
          <h2 className="text-lg font-bold mb-4">{t("review", language)}</h2>
          <ReviewSection
            onReviewsChange={fetchReviews}
            restaurant={restaurant}
            reviews={reviews}
          />
        </div>
      </div>
      {/* 가로선 추가 */}

      {/* <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">리뷰</h2>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-500 text-blue-600"
          >
            + 리뷰 작성
          </Button>
        </div> */}
      {/* Tag Statistics */}
      <div className="px-4">
        {tagStats.length > 0 && (
          <>
            <div className="h-[1px] bg-[#ededed] w-full my-6"></div>{" "}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4">
                {t("satisfactionRank", language)}
              </h2>
              <TooltipProvider>
                <div className="relative h-40 flex items-end justify-between">
                  {tagStats.map((stat, index) => {
                    const height = (stat.count / maxTagCount) * 100;
                    const colors = [
                      "bg-green-200", // 연한 민트 그린
                      "bg-orange-200", // 연한 복숭아색
                      "bg-blue-200", // 연한 파스텔 블루
                      "bg-pink-200", // 연한 핑크
                      "bg-lime-200", // 연한 라임 그린
                      "bg-yellow-200", // 연한 레몬색
                      "bg-amber-200", // 연한 황토색
                      "bg-gray-200", // 연한 회색
                      "bg-emerald-200", // 연한 에메랄드 그린
                      "bg-red-200", // 연한 코랄색
                    ];
                    return (
                      <Tooltip
                        key={stat.tag}
                        open={activeTooltipIndex === index}
                      >
                        <TooltipTrigger asChild>
                          <div
                            className="relative w-8 rounded-t-md cursor-pointer"
                            style={{ height: `${height}%`, minHeight: "10%" }}
                            onMouseEnter={() => setActiveTooltipIndex(index)}
                            onMouseLeave={() => setActiveTooltipIndex(null)}
                          >
                            <div
                              className={`absolute inset-0 ${
                                colors[index % colors.length]
                              }`}
                            ></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-white text-black text-xs"
                          style={{ border: "1px solid #ededed" }}
                        >
                          <span className="font-medium">
                            <span className="mr-1">{emojiMap[stat.tag]}</span>
                            {t(stat.tag, language)}
                          </span>
                          : {stat.count}명
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>
      {/* 가로선 추가 */}
      <div className="h-[1px] bg-[#ededed] w-full my-6"></div>
      {/* */}
      <div className="px-4" ref={benefitsSectionRef}>
        <h2 className="text-lg font-semibold mb-7">{t("benefit", language)}</h2>

        <pre className="text-sm whitespace-pre-wrap word-wrap break-words">
          {restaurant.specialOfferTextDetail}
        </pre>
      </div>
      {/* 가로선 추가 */}
      <div className="h-[1px] bg-[#ededed] w-full my-6"></div>
      {/* */}
      <div className="px-4">
        {/* About Section */}
        <div ref={infoSectionRef} className="mb-6 mt-4">
          <h2 className="text-lg font-bold mb-2">
            {t("description", language)}
          </h2>

          <p className="text-sm">
            {restaurant?.description || t("description", language)}
          </p>
          <div className="mt-10 text-gray-500 text-sm">
            {restaurant.tags.map((tag, index) => (
              <span key={index}>
                {tag}
                <span>{index !== restaurant.tags.length - 1 ? "," : ""}</span>
              </span>
            ))}
          </div>
        </div>
        {/* 가로선 추가 */}
        <div className="h-[1px] bg-[#ededed] w-full my-6"></div>
        {/* */}
        <div className="mb-6 mt-4 ">
          <div className="flex">
            <h2 className="text-lg font-semibold mb-2 mr-4 flex items-center">
              <span className="mr-3">{t("map", language)}</span>{" "}
              <p className="text-sm font-normal">{restaurant?.address}</p>
            </h2>{" "}
          </div>
          <div className="rounded-3xl overflow-hidden h-[300px]">
            <GoogleMapsProvider>
              <RestaurantMap
                center={{
                  lat: restaurant.latitude,
                  lng: restaurant.longitude,
                }}
                userLocation={null}
                mapRestaurants={restaurants as any}
                selectedMarker={null}
                onMarkerClick={() => {}}
                onUserLocationClick={() => {}}
                onBoundsChanged={() => {}}
                setSelectedMarker={() => {}}
                mapRef={mapRef}
              />
            </GoogleMapsProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
