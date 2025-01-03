"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Restaurant } from "@prisma/client";

interface Review {
  id: string;
  user: { name: string; country: string; avatar: string };
  createdAt: string;
  content: string;
  images: string[];
  rating: number;
  likes: number;
}

interface ReviewCardProps {
  review: Review;
  onOpenDetail: (review: Review) => void;
  restaurant: Restaurant;
}

function ReviewCard({ review, onOpenDetail, restaurant }: ReviewCardProps) {
  const { data: session } = useSession();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  return (
    <Card
      onClick={() => onOpenDetail(review)}
      className="card-shadow flex p-2 cursor-pointer hover:shadow-lg transition-shadow rounded-lg bg-white overflow-hidden"
    >
      {/* 왼쪽: 큰 이미지 */}
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
              <div className="text-xs text-gray-500">{review.user.country}</div>
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
          <span className="ml-2 text-xs text-gray-500">
            {review.likes} Likes
          </span>
        </div>
      </div>
    </Card>
  );
}

function ReviewDetailDialog({
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
  const { data: session } = useSession();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xs p-0 ">
        {/* DialogClose 기본 버튼을 숨김 */}
        <DialogTitle className="hidden"></DialogTitle>
        <DialogClose className="absolute top-2 right-2 bg-white/20 p-2 rounded-full text-white shadow-md z-20 w-8 h-8">
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

        {/* 업체명과 카테고리 */}
        <div className="absolute z-10 text-white ml-2 top-4 left-4">
          {restaurant.name}
          <span>|</span>
          <span>{restaurant.category}</span>
        </div>

        {/* 이미지와 X 버튼 */}
        <div className="relative">
          <Carousel className="w-full">
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
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {review.images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${
                  currentSlide === index ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* 리뷰 내용 및 좋아요 */}
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
                <div className="text-xs text-gray-500">
                  {review.user.country}
                </div>
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

          {/* 좋아요 표시 */}
          <div className="mt-auto flex items-center ml-auto">
            <Heart className="h-4 w-4 text-blue-500" />
            <span className="ml-2 text-xs text-gray-500">
              {review.likes} Likes
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewSection({
  reviews,
  restaurant,
}: {
  reviews: Review[];
  restaurant: Restaurant;
}) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  return (
    <div className="p-1">
      <p className="text-lg font-semibold mb-4">95%의 고객이 만족했습니다</p>
      {/* 스와이프 가능한 슬라이더 */}
      <Carousel className="overflow-x-visible">
        <CarouselContent className="flex overflow-visible p-1">
          {reviews.map((review, index) => (
            <CarouselItem
              key={review.id}
              className={`${index === 0 ? "pl-4" : "pl-1"} overflow-visible`}
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
      {/* 팝업 */}
      <ReviewDetailDialog
        restaurant={restaurant}
        review={selectedReview}
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
}
