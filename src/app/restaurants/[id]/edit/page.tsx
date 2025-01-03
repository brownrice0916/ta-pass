"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RestaurantForm from "../../components/restaurant-form";

export default function EditPage() {
  const params = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await fetch(`/api/restaurants/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch restaurant");
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    if (params.id) {
      fetchRestaurant();
    }
  }, [params.id]);

  if (!initialData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <RestaurantForm
        initialData={initialData}
        // onSubmit={handleSubmit}
        submitButtonText="수정하기"
      />
    </div>
  );
}
