"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Bookmark as BookmarkIcon } from "lucide-react";

interface BookmarkItem {
  id: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    images: string[];
    category: string;
  };
}

export default function BookmarkPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to load bookmarks");
      const data = await res.json();
      setBookmarks(data);
    } catch (e) {
      console.error("Error fetching bookmarks:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove bookmark");
      setBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));
    } catch (e) {
      console.error("Error removing bookmark:", e);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl mb-16">
      <h1 className="text-2xl font-semibold mb-4">내 북마크</h1>
      {bookmarks.length === 0 ? (
        <p className="text-gray-600">북마크한 식당이 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() =>
                    router.push(`/restaurants/${item.restaurant.id}`)
                  }
                >
                  {item.restaurant.images?.[0] && (
                    <Image
                      src={item.restaurant.images[0]}
                      alt={item.restaurant.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {item.restaurant.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {item.restaurant.address}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.restaurant.category}
                  </p>
                </div>
                <button
                  onClick={() => removeBookmark(item.id)}
                  className="p-2 rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-md"
                >
                  <BookmarkIcon className="w-5 h-5 fill-primary text-primary" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
