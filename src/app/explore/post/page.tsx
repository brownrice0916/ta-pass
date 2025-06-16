"use client";

import RestaurantForm from "../components/restaurant-form";

export default function PostPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <RestaurantForm submitButtonText="추가하기" />
    </div>
  );
}
