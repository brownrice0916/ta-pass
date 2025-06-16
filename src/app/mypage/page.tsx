"use client";

import { Loader2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import SerialNumberSection from "./components/serial-number-section";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

const MyPage = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/reviews");
        if (!response.ok) {
          throw new Error("리뷰를 가져오는데 실패했습니다");
        }
        const reviews = await response.json();
        setReviewCount(reviews.length);
      } catch (error) {
        console.error("리뷰 로딩 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchReviewCount();
    }
  }, [session]);

  const handleComingSoonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("서비스 준비중입니다.");
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/user/update-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      const data = await response.json();

      // 세션 업데이트
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.imageUrl,
        },
      });

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("프로필 이미지 업로드 오류:", error);
      setUploadError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex flex-col items-center p-4">
        {/* 시리얼 넘버 섹션 */}
        <SerialNumberSection />

        {/* Stats Section */}
        <div className="flex w-full gap-4 mb-6">
          <div
            className="flex-1 bg-blue-500 text-white p-6 rounded-lg shadow-md text-center cursor-pointer"
            onClick={() => router.push("/reviews")}
          >
            <h3 className="text-lg">{t("mypage.myReviews", language)}</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p className="text-4xl font-bold">{reviewCount}</p>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-md">
          <ShortcutItem
            icon="🎧"
            label={t("mypage.support", language)}
            link="/faq"
            language={language}
          />
          <ShortcutItem
            icon="⭐"
            label={t("mypage.event", language)}
            link="#"
            onClick={handleComingSoonClick}
            comingSoon
            language={language}
          />
          <ShortcutItem
            icon="📢"
            label={t("mypage.notice", language)}
            link="/#"
            onClick={handleComingSoonClick}
            comingSoon
            language={language}
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await signOut();
          }}
          className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg shadow-md"
        >
          {t("mypage.logout", language)}
        </button>
      </div>
    </div>
  );
};

interface ShortcutItemProps {
  icon: string;
  label: string;
  link: string;
  comingSoon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  language: any;
}

const ShortcutItem = ({
  icon,
  label,
  link,
  comingSoon,
  onClick,
  language,
}: ShortcutItemProps) => (
  <a
    href={link}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center text-center p-4 hover:bg-gray-50 rounded-lg transition-colors ${
      comingSoon ? "cursor-default" : ""
    }`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-sm">{label}</p>
    {comingSoon && (
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-medium px-2 py-1 bg-blue-600 rounded">
          {t("mypage.comingSoon", language)}
        </span>
      </div>
    )}
  </a>
);

export default MyPage;
