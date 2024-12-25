"use client";

import { Search } from "lucide-react";


export default function Main() {
  return (
    <main className="min-h-screen bg-background pb-[72px]">
      <div className="mx-auto max-w-[393px] relative min-h-screen">
        {/* Header */}

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Stay, shop, and save—where to?"
              className="w-full pl-4 pr-10 py-2 border rounded-lg"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Categories */}
        <div className="grid grid-cols-3 gap-4 p-4">
          {[
            { icon: "🛍️", label: "Fashion" },
            { icon: "✨", label: "Beauty" },
            { icon: "👑", label: "Luxury" },
            { icon: "⛰️", label: "Activities" },
            { icon: "🏛️", label: "Culture" },
            { icon: "🍽️", label: "Food" },
          ].map((category, index) => (
            <button
              key={index}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm"
            >
              <span className="text-2xl mb-2">{category.icon}</span>
              <span className="text-sm">{category.label}</span>
            </button>
          ))}
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
