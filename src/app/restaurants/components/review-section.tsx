"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Star, Heart, Plus, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Restaurant } from "@prisma/client";
import { Review } from "../[id]/page";
import { ReviewForm } from "@/components/review-form";
import { useRouter } from "next/navigation";

// interface Review {
//   id: string;
//   user: { name: string; country: string; avatar: string };
//   createdAt: string;
//   content: string;
//   images: string[];
//   rating: number;
// }

interface ReviewCardProps {
  review: Review;
  onOpenDetail: (review: Review) => void;
  restaurant: Restaurant;
}

export function ReviewCard({ review, onOpenDetail }: ReviewCardProps) {
  const { data: session } = useSession();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  return (
    <Card
      onClick={() => onOpenDetail(review)}
      className="card-shadow flex p-2 cursor-pointer hover:shadow-lg transition-shadow rounded-lg bg-white overflow-hidden"
    >
      {/* 왼쪽: 이미지 */}
      {review.images && review.images.length > 0 && (
        <>
          {review.images.length === 1 ? (
            <div className="relative mr-1 w-[50px] ">
              <Image
                src={review.images[0]}
                alt="Main review image"
                fill
                className="object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="mr-1 grid grid-cols-2 gap-1">
              <div className="relative w-[40px] mr-4">
                <Image
                  src={review.images[0]}
                  alt="Main review image"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div>
                {review.images.slice(1, 3).map((image, index) => (
                  <div key={index} className="relative h-[40px] w-[40px]">
                    <Image
                      src={image}
                      alt={`Review image ${index + 2}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {/* 오른쪽: 컨텐츠 */}
      <div className="flex flex-col justify-between w-full pl-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div>
              <div className="font-medium text-sm flex items-center">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={24}
                  height={24}
                  className="rounded-full mr-2"
                />
                {review.user.name}
              </div>
              {/* <div className="text-xs text-gray-500">{review.user.country}</div> */}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
          <p className="text-xs text-gray-700 line-clamp-4 mb-1">
            {review.content}
          </p>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < (review?.rating || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="mt-auto flex items-center ml-auto">
          <Heart className="h-4 w-4 text-blue-500" />
          <span className="ml-2 text-xs text-gray-500">Likes</span>
        </div>
      </div>
    </Card>
  );
}

export function ReviewDetailDialog({
  review,
  open,
  onClose,
  restaurant,
}: {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const { data: session } = useSession();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  // 슬라이드 변경 핸들러
  const handleSlideChange = useCallback(() => {
    if (carouselApi) {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    }
  }, [carouselApi]);

  // Carousel API 이벤트 연결
  useEffect(() => {
    if (carouselApi) {
      carouselApi.on("scroll", handleSlideChange);
      handleSlideChange(); // 초기 상태 설정
    }

    return () => {
      carouselApi?.off("scroll", handleSlideChange); // 이벤트 리스너 제거
    };
  }, [carouselApi, handleSlideChange]);

  if (!review) return null;

  // 이미지가 없을 경우 상단 영역 확장
  const hasImages = review.images.length > 0;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xs p-0">
        <DialogTitle className="hidden"></DialogTitle>

        <div
          className={`absolute top-0 left-0 right-0 h-24 z-10 bg-gradient-to-b from-black/70 to-transparent pointer-events-none`}
        />
        {!hasImages && <div className="h-3" />}
        <DialogClose
          className={`absolute top-2  right-2 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white shadow-md z-20 w-8 h-8 transition-colors`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 41 41"
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </DialogClose>

        {/* 상단 이미지 */}
        <div className="absolute z-10 text-white ml-4 top-4 left-0 drop-shadow-md">
          <span className="font-medium">{restaurant.name}</span>
          <span className="mx-2 opacity-70">|</span>
          <span className="opacity-90">{restaurant.category}</span>
        </div>

        {/* 이미지 캐러셀 */}
        <div className="relative">
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {review.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square w-full">
                    <Image
                      src={image}
                      alt={`Popup review image ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* 이미지 인디케이터 */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {review.images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-opacity ${
                  currentSlide === index
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                onClick={() => carouselApi?.scrollTo(index)} // 클릭 시 슬라이드 이동
              />
            ))}
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div className="flex flex-col justify-between w-full p-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div>
                <div className="font-medium text-sm flex items-center">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  {review.user.name}
                </div>
                <div className="text-xs text-gray-500"></div>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
            <p className="text-xs text-gray-700 line-clamp-4 mb-1">
              {review.content}
            </p>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < (review?.rating || 0)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center ml-auto">
            <Heart className="h-4 w-4 text-blue-500" />
            <span className="ml-2 text-xs text-gray-500">Likes</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
interface ReviewSectionProps {
  reviews: Review[];
  restaurant: Restaurant;
  onReviewsChange: () => void; // 추가
}

export default function ReviewSection({
  reviews,
  restaurant,
  onReviewsChange,
}: ReviewSectionProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const handleReviewAdded = () => {
    setIsReviewFormOpen(false);
    onReviewsChange();
    // TODO: 리뷰 목록 새로고침 로직 추가
  };
  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-4">
        {reviews.length > 0 ? (
          <p className="text-lg font-semibold">95%의 고객이 만족했습니다</p>
        ) : (
          <p className="text-lg font-semibold text-gray-600">
            아직 등록된 리뷰가 없습니다
          </p>
        )}
        <button
          onClick={() => {
            if (!session) {
              if (confirm("로그인이 필요합니다. 로그인하시겠습니까?")) {
                router.push("/login");
              }
            } else {
              setIsReviewFormOpen(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          리뷰 작성
        </button>
      </div>

      {reviews.length > 0 ? (
        <Carousel className="overflow-x-visible">
          <CarouselContent className="flex overflow-visible p-1">
            {[...reviews]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((review, index) => (
                <CarouselItem
                  key={review.id}
                  className={`${
                    index === 0 ? "pl-4" : "pl-1"
                  } overflow-visible`}
                  style={{ flex: "0 0 95%" }}
                >
                  <ReviewCard
                    restaurant={restaurant}
                    review={review}
                    onOpenDetail={setSelectedReview}
                  />
                </CarouselItem>
              ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">첫 번째 리뷰를 작성해보세요!</p>
          <p className="text-sm text-gray-400">
            여러분의 소중한 경험을 공유해주세요.
          </p>
        </div>
      )}

      {/* 리뷰 상세 Dialog */}
      <ReviewDetailDialog
        restaurant={restaurant}
        review={selectedReview}
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
      />

      {/* 리뷰 작성 Dialog */}
      <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle className="sr-only">리뷰 작성</DialogTitle>
          <ReviewForm
            restaurantId={restaurant.id}
            onReviewAdded={handleReviewAdded}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
