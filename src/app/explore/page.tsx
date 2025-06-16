// app/restaurants/page.tsx
import { Suspense } from "react";
import Restaurants from "./components/restaurants";

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <Restaurants />
    </Suspense>
  );
}
