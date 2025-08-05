"use client";

import { Search, Filter, Plane, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleMapsProvider from "@/app/google-maps-provider";
import Image from "next/image";
import SimplifiedMap from "./simplified-map"; // Make sure this points to your updated SimplifiedMap component
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

export default function Main() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 }); // Seoul coordinates
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const router = useRouter();
  const mapRef = useRef<google.maps.Map | null>(null);

  // Update search query when URL parameters change
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
  }, [searchParams]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserLocation(location);
          setCenter(location); // Center map on user location
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMapClick = () => {
    router.push("/explore");
  };

  const categories = [
    {
      icon: "🍽️",
      label: t("categoryFood", language),
      tag: t("categoryFoodTag", language),
      color: "bg-[#FDF1F7]",
      href: "/category?category=food",
    },
    {
      icon: "🛍️",
      label: t("categoryShopping", language),
      tag: t("categoryShoppingTag", language),
      color: "bg-[#F9F4FD]",
      href: "/category?category=shopping",
    },
    {
      icon: "🎨",
      label: t("categoryExperience", language),
      tag: t("categoryExperienceTag", language),
      color: "bg-[#FFFBEF]",
      href: "/category?category=activities",
    },

    {
      icon: "💆‍♀️",
      label: t("categoryWellness", language),
      tag: t("categoryWellnessTag", language),
      color: "bg-[#ECFEFE]",
      href: "/category?category=wellness",
    },
    {
      icon: "🌙",
      label: t("categoryNightlife", language),
      tag: t("categoryNightlifeTag", language),
      color: "bg-yellow-100",
      href: "/category?category=nightlife",
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Map Section - Made explicitly clickable with cursor pointer */}
      <div className="relative cursor-pointer">
        <div onClick={handleMapClick}>
          <GoogleMapsProvider>
            <SimplifiedMap
              center={center}
              userLocation={userLocation}
              mapRef={mapRef}
            />
          </GoogleMapsProvider>
        </div>
        {/* Search Bar Overlay */}
        <div className="absolute top-5 left-0 right-0 px-4 z-100">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder", language)}
              className="w-full pl-4 pr-10 py-3 border rounded-full bg-white shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
      {/* Categories Section */}
      <div className="px-2 pt-6 pb-6">
        <h2 className="text-2xl font-bold mb-4">
          {t("categoriesTitle", language)}
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl text-center p-3 ${category.color}`}
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="text-lg font-bold text-gray-700 whitespace-nowrap">
                {category.label}
              </span>
              <span className="text-[10px]">{category.tag}</span>
            </Link>
          ))}

          {/* ────────────── 🔑 여기가 핵심 ────────────── */}
          {(() => {
            // 3의 배수가 아니면, 빈 셀(invisible) 추가해서 정렬 보정
            const remain = categories.length % 3; // 0, 1, 2 중 하나
            const need = (3 - remain) % 3; // 0 → 0칸, 1 → 2칸, 2 → 1칸
            return Array.from({ length: need }).map((_, i) => (
              <div key={`dummy-${i}`} className="invisible" /> // 보이지 않는 자리맞춤 셀
            ));
          })()}
        </div>
      </div>

      <div className="pb-20">
        <Link href="/intro">
          <div className="bg-blue-500 p-5 text-center text-white shadow-lg">
            <h2 className="text-xl font-semibold mb-1">
              {t("taPassTitle", language)}
            </h2>
            <p className="text-sm mb-2">
              {t("taPassDesc", language)}
              <br />
              {/* and experiences. */}
            </p>
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              <span>{t("unlockMyTaPass", language)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2">
        <Link
          href="/"
          className="flex flex-col items-center py-1 px-3 text-black"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2L2 12h3v9h14v-9h3L12 2z" />
            </svg>
          </div>
          <span>{t("navHome", language)}</span>
        </Link>
        <Link
          href="/explore"
          className="flex flex-col items-center py-1 px-3 text-gray-500"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"
                strokeWidth="0"
              />
              <path
                d="M17.3 7.7l-5.7 5.7-4.3-2.6"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span>{t("navExplore", language)}</span>
        </Link>
        <Link
          href="/saved"
          className="flex flex-col items-center py-1 px-3 text-gray-500"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span>{t("navSaved", language)}</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center py-1 px-3 text-gray-500"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                strokeWidth="2"
              />
              <circle cx="12" cy="7" r="4" strokeWidth="2" />
            </svg>
          </div>
          <span>{t("navProfile", language)}</span>
        </Link>
      </div>
      <footer className="bg-blue-500 text-white text-sm px-4 py-6 space-y-4">
        <div className="flex flex-col space-y-2">
          <a href="/faq" className="font-semibold">
            Customer Support
          </a>
          <div className="space-x-2 underline underline-offset-2">
            <Link
              href="https://docs.google.com/document/d/1dH207KnrACggst0eV8PxyjZU1tOV226Q/edit"
              className="hover:opacity-80 font-bold"
            >
              Terms of Use
            </Link>
            <span>|</span>
            <Link
              href="https://docs.google.com/document/d/1NPS93L2LiQ2NVHfunj4Yn_Eo3oSUM-Yo/edit"
              className="hover:opacity-80 font-bold"
            >
              Privacy Policy
            </Link>
            <span>|</span>
            <Link
              href="https://docs.google.com/document/d/1PGuSdSCENx8QC1P7hW1EfFzVc8RfDY8q/edit"
              className="hover:opacity-80 font-bold"
            >
              Cookies & Location
            </Link>
          </div>
        </div>

        <div className="leading-relaxed">
          <p>Business Name : TA PASS</p>
          <p>Business Registration No.: 291-12-03120</p>
          <p>Representative: Hayoung Hwang</p>
          <p>
            Address: 7, Imjeong-ro 21-gil, Mapo-gu, Seoul, Republic of Korea
          </p>
          <p>
            E-mail :{" "}
            <a href="mailto:ta.pass.contact@gmail.com" className="underline">
              ta.pass.contact@gmail.com
            </a>
          </p>
          <p>Hosting Provider: Vercel Inc.</p>
          <p className="mt-2">© 2025 TA PASS. All rights reserved.</p>
        </div>
      </footer>
      <div className="text-xs mt-1 p-2 text-gray-400 pt-4 border-t border-white/20">
        <p>
          TA PASS is not a party to the sales transaction. All offers and
          services are provided directly by the respective stores, which bear
          full responsibility for their content, usage, and refund policies.
        </p>
        <p className="mt-2">
          TA PASS는 통신판매 중개자로서 통신판매의 당사자가 아니며, 각 매장에서
          제공하는 혜택 및 서비스의 내용, 조건, 이용, 환불 등에 대한 책임은 해당
          매장에 있습니다.
        </p>
      </div>
    </main>
  );
}
