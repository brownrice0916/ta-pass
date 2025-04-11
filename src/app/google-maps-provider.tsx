"use client";

import { useLoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

export default function GoogleMapsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  if (loadError) {
    return <div className="p-4 text-red-500">Error loading maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <>{children}</>;
}
