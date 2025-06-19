"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Review } from "../explore/[id]/page";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

const ReviewsPage = () => {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setIsLoading(true);
      fetch(`/api/reviews`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(t("reviewsPage.fetchError", language));
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setReviews(data);
          } else {
            throw new Error(t("reviewsPage.invalidResponse", language));
          }
        })
        .catch((error) => {
          setError(error.message);
          console.error("리뷰 로딩 오류:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status, session, language]);

  if (status === "loading")
    return (
      <div className="p-4 text-center">{t("common.loading", language)}</div>
    );
  if (status === "unauthenticated")
    return (
      <div className="p-4 text-center">
        {t("common.loginRequired", language)}
      </div>
    );

  const handleReviewClick = (reviewId: string) => {
    router.push(`/reviews/${reviewId}`);
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  return (
    <Card className="w-full box-border max-w-md mx-auto bg-gray-100 min-h-screen border-b border-gray-300">
      <div className="bg-white rounded-lg shadow-md p-2">
        <div className="p-2 border-b border-gray-300 flex flex-col">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = avatarUrl;
                  }}
                />
              ) : (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {session?.user?.name || t("common.user", language)}
              </h2>
              <p className="text-sm text-gray-500">
                {t("reviewsPage.totalReviews", language, {
                  count: reviews?.length || 0,
                })}
              </p>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#666] mt-3" />
        </div>

        <div className="p-2 flex items-center justify-between !border-t !border-black">
          <h2 className="font-bold">{t("reviewsPage.myReviews", language)}</h2>
        </div>

        {isLoading ? (
          <div className="p-4 text-center">
            {t("reviewsPage.loadingReviews", language)}
          </div>
        ) : error ? (
          <div className=" text-center text-red-500">{error}</div>
        ) : reviews && reviews.length > 0 ? (
          <div>
            {reviews
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((review) => (
                <div
                  key={review.id}
                  className="p-2 border-b cursor-pointer"
                  onClick={() => handleReviewClick(review.id)}
                >
                  <div className="flex">
                    <div className="w-20 h-20 bg-gray-200 rounded mr-3 overflow-hidden flex-shrink-0">
                      {review.images && review.images.length > 0 ? (
                        <Image
                          src={review.images[0]}
                          alt={
                            review.restaurant?.name ||
                            t("common.noPlaceInfo", language)
                          }
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/80?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t("common.noImage", language)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {review.restaurant?.name ||
                          t("common.noPlaceInfo", language)}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {review.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt)
                          .toLocaleDateString(
                            language === "ko" ? "ko-KR" : "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                          .replace(/\./g, ".")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {t("reviewsPage.noReviews", language)}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReviewsPage;
