"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Restaurant } from "@/app/explore/components/restaurants";

interface SimplifiedMapProps {
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  onMarkerClick?: (restaurant: Restaurant) => void;
}

const containerStyle = {
  width: "100%",
  height: "250px", // Adjusted height to match the design
};

// Enhanced map options to completely disable interactions
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "none", // Disable all gesture handling (pan, zoom, etc.)
  draggable: false, // Disable map dragging
  scrollwheel: false, // Disable zooming with scroll wheel
  disableDoubleClickZoom: true, // Disable double-click zoom
  keyboardShortcuts: false, // Disable keyboard controls
};

export default function SimplifiedMap({
  center,
  userLocation,
  mapRef,
  onMarkerClick,
}: SimplifiedMapProps) {
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);

  // Fetch nearby restaurants when map loads or location changes
  useEffect(() => {
    const fetchNearbyRestaurants = async () => {
      if (!userLocation) return;

      try {
        // Adjusting radius depending on zoom level (default is 1km)
        const radius = 1000;
        const response = await fetch(
          `/api/restaurants?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
        );
        const data = await response.json();
        setNearbyRestaurants(data.restaurants || []);
      } catch (error) {
        console.error("Error fetching nearby restaurants:", error);
      }
    };

    fetchNearbyRestaurants();
  }, [userLocation]);

  return (
    <div className="relative cursor-pointer">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;

          // Add this to prevent the map from handling any mouse events
          const mapDiv = map.getDiv();
          if (mapDiv) {
            mapDiv.style.pointerEvents = "none";
          }
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "/markers/my-location.png",
              scaledSize: new google.maps.Size(30, 30),
              anchor: new google.maps.Point(15, 15),
            }}
            title="내 위치"
          />
        )}

        {/* Nearby Restaurant Markers */}
        {nearbyRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={{
              lat: restaurant.latitude,
              lng: restaurant.longitude,
            }}
            onClick={() => onMarkerClick && onMarkerClick(restaurant)}
            icon={{
              url: "/markers/pass_blue.png",
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
