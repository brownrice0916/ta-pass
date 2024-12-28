"use client";

import { useLoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

export default function GoogleMapsProvider({ children }: { children: ReactNode }) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    if (!isLoaded) return <div>Loading maps...</div>;

    return <>{children}</>;
}

