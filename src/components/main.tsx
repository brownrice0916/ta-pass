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

export default function Main() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

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
      router.push(`/restaurants?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMapClick = () => {
    router.push("/restaurants");
  };

  const categories = [
    {
      icon: "🍽️",
      label: "맛집",
      color: "bg-[#FDF1F7]",
      tag: "맛집, 카페, 길거리 음식",
      href: "/category?category=Food",
    },
    {
      icon: "🛍️",
      label: "쇼핑",
      color: "bg-[#F9F4FD]",
      tag: "패션, 뷰티, 쇼핑몰",
      href: "/category?category=Shopping",
    },
    {
      icon: "🎨",
      label: "체험",
      color: "bg-[#FFFBEF]",
      tag: "한복, 쿠킹클래스, 레저",
      href: "/category?category=Experience",
    },

    {
      icon: "🏛️",
      label: "관광명소",
      color: "bg-[#EFFBF2]",
      tag: "궁, 박물관, 전시, 공연",
      href: "/category?category=Attraction",
    },
    {
      icon: "💆‍♀️",
      label: "웰니스",
      color: "bg-[#ECFEFE]",
      tag: "스파, 요가, 뷰티케어",
      href: "/category?category=Wellness",
    },
    {
      icon: "🌙",
      label: "나이트라이프",
      color: "bg-yellow-100",
      tag: "클럽, 바, 포장마차",
      href: "/category?category=Nightlife",
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
              placeholder="Stay, shop, and save—where to?"
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
        <h2 className="text-2xl font-bold mb-4">카테고리</h2>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className={`flex flex-col items-center justify-center pt-3 pb-4 rounded-xl ${category.color}`}
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="text-lg  font-bold text-gray-700">
                {category.label}
              </span>
              <span className="text-[10px]">{category.tag}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="pb-20">
        <Link href="/intro">
          <div className="bg-blue-500 p-5 text-center text-white shadow-lg">
            <h2 className="text-xl font-semibold mb-1">
              Travel smarter with TA PASS.
            </h2>
            <p className="text-sm mb-2">
              Tap to unlock local deals
              <br />
              and experiences.
            </p>
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              <span className="text-xs">Unlock My TA PASS</span>
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
          <span className="text-xs mt-1">Home</span>
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
          <span className="text-xs mt-1">Explore</span>
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
          <span className="text-xs mt-1">Saved</span>
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
          <span className="text-xs mt-1">My TA Pass</span>
        </Link>
      </div>
    </main>
  );
}
