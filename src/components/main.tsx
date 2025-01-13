"use client";

import { ArrowRight, Plane, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function Main() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };


  const categories = [
    { icon: "🛍️", label: "Fashion", color: "bg-pink-100" },
    { icon: "✨", label: "Beauty", color: "bg-purple-100" },
    { icon: "👑", label: "Luxury", color: "bg-yellow-100" },
    { icon: "⛰️", label: "Activities", color: "bg-green-100" },
    { icon: "🏛️", label: "Culture", color: "bg-blue-100" },
    { icon: "🍽️", label: "Food", color: "bg-red-100" },
  ];





  return (
    <main className="min-h-screen bg-background pb-[72px]">
      <div className="mx-auto max-w-[393px] relative min-h-screen">
        {/* Header */}

        {/* Search Bar */}
        <div className="p-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Stay, shop, and save—where to?"
              className="w-full pl-4 pr-10 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
        {/* First Banner */}
        <div>
          <Link href="/intro">
            <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600  p-5 text-center text-white shadow-lg">
              <h2 className="text-xl font-semibold mb-1">TA PASS와 함께하는 첫 여행!</h2>
              <p className="text-sm mb-2">지금 바로 스마트한 여행을 시작하세요</p>
              <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                <Plane className="w-4 h-4" />
                <span className="text-xs">TA PASS 체험하기</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Main Categories */}
        <div className="px-4 mb-6 mt-6">
          <h2 className="text-lg font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm transition-all duration-300 ease-in-out ${category.color} hover:shadow-md hover:-translate-y-1`}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-xs font-medium text-gray-700">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Special Offer Banner */}
        <div className="p-4">
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">Just 24h Discount</p>
            <h2 className="text-xl font-bold mt-2">Today Special Offer</h2>
          </div>
        </div>

        {/* Korea Trends Section */}
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">
            Want to know more about Korea Trends?
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex-none w-64">
                <div className="aspect-video bg-muted rounded-lg"></div>
                <p className="mt-2 text-sm font-medium">
                  Korea Trend Video #{item}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
