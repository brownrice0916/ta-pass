// components/restaurant-card.tsx
import { memo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Restaurant } from "@/app/restaurants/page";

// 타입은 공통으로 사용할 수 있게 별도 파일로 분리하면 좋습니다

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  imageLoading?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

export const RestaurantCard = memo(
  ({
    restaurant,
    onClick,
    imageLoading,
    onImageLoad,
    onImageError,
  }: RestaurantCardProps) => {
    return (
      <Card
        className="mb-4 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
        onClick={onClick}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-semibold text-lg mr-3 text-primary">
                  {restaurant.name}
                </h3>
                <p className="text-sm text-orange-500">
                  {restaurant.description}
                </p>
              </div>
            </div>
          </div>

          {restaurant.specialOfferType?.length > 0 && (
            <div className="mb-2 flex items-center">
              {restaurant.specialOfferType.map((offerType, index) => (
                <div key={`${restaurant.id}-offer-${index}`}>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs text-white mr-1 ${offerType === "Special Gift"
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

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span
              className={restaurant.isOpen ? "text-green-600" : "text-red-600"}
            >
              {restaurant.isOpen ? "영업중" : "영업종료"}
            </span>
            <span>|</span>
            <span>리뷰 {restaurant.reviewCount || 0}</span>
            <span>|</span>
            <span className="line-clamp-1">
              {restaurant.region1} {restaurant.region2}
            </span>
            {restaurant.distance && (
              <>
                <span>|</span>
                <span>
                  {restaurant.distance < 1
                    ? `${Math.round(restaurant.distance * 1000)}m`
                    : `${restaurant.distance.toFixed(1)}km`}
                </span>
              </>
            )}
          </div>

          {restaurant.images && restaurant.images.length > 0 && (
            <div className="grid grid-cols-4 gap-0.5">
              {restaurant.images.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className="relative aspect-square overflow-hidden"
                >
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  )}
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${restaurant.name} ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 25vw"
                    loading="lazy"
                    quality={75}
                    className={`object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                    onLoad={onImageLoad}
                    onError={onImageError}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

RestaurantCard.displayName = "RestaurantCard";
