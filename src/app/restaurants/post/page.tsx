"use client";

import RestaurantForm, { FormValues } from "../components/restaurant-form";

export default function PostPage() {
  const handleSubmit = async (data: FormValues) => {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        name: data.name,
        address: data.address,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating,
      })
    );
    data.images.forEach((image: File, index: number) => {
      formData.append(`images`, image);
    });

    const response = await fetch("/api/restaurants", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to add restaurant");
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <RestaurantForm onSubmit={handleSubmit} submitButtonText="추가하기" />
    </div>
  );
}
