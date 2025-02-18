// components/RestaurantMap.tsx
"use client";

import { useRef, useCallback } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  MarkerClusterer,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/app/restaurants/page";

interface RestaurantMapProps {
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  mapRestaurants: Restaurant[];
  selectedMarker: Restaurant | null;
  onMarkerClick: (restaurant: Restaurant) => void;
  onUserLocationClick: () => void;
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void;
  setSelectedMarker: (restaurant: Restaurant | null) => void;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mode?: string;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

export default function RestaurantMap({
  center,
  userLocation,
  mapRestaurants,
  selectedMarker,
  onMarkerClick,
  onUserLocationClick,
  onBoundsChanged,
  setSelectedMarker,
  mapRef,
  mode,
}: RestaurantMapProps) {
  const router = useRouter();
  //   const mapRef = useRef<google.maps.Map | null>(null);
  const pathSegments = window.location.pathname.split("/");
  const currentId = !mode ? pathSegments[pathSegments.length - 1] : null;

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  }, [userLocation]);

  const MarkerList = ({
    restaurants,
    onMarkerClick,
  }: {
    restaurants: Restaurant[];
    onMarkerClick: (restaurant: Restaurant) => void;
  }) => {
    return (
      <MarkerClusterer averageCenter enableRetinaIcons gridSize={60}>
        {(clusterer) => (
          <>
            {restaurants.map((restaurant) => {
              const isHighlighted = mode
                ? selectedMarker?.id === restaurant.id // 리스트 페이지: 선택된 마커
                : currentId === restaurant.id; // 상세 페이지: URL ID와 일치하는 마커

              return (
                <Marker
                  key={restaurant.id}
                  position={{
                    lat: restaurant.latitude,
                    lng: restaurant.longitude,
                  }}
                  onClick={() => onMarkerClick(restaurant)}
                  clusterer={clusterer}
                  icon={{
                    url: isHighlighted
                      ? "/markers/pass_red.png"
                      : "/markers/pass_blue.png",
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16),
                  }}
                />
              );
            })}
          </>
        )}
      </MarkerClusterer>
    );
  };

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onBoundsChanged={() => {
          const bounds = mapRef.current?.getBounds();
          if (bounds) {
            onBoundsChanged(bounds);
          }
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "/markers/my-location.png",
              scaledSize: new google.maps.Size(30, 30),
              anchor: new google.maps.Point(20, 20),
            }}
            title="내 위치"
            onClick={onUserLocationClick}
          />
        )}
        <MarkerList
          restaurants={mapRestaurants}
          onMarkerClick={onMarkerClick}
        />
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.latitude,
              lng: selectedMarker.longitude,
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold mb-1">{selectedMarker.name}</h3>
              <p className="text-sm text-gray-600">{selectedMarker.address}</p>
              <div className="flex items-center mt-2">
                <span>평점: </span>
                <span className="ml-1">
                  {selectedMarker.rating?.toFixed(1)}
                </span>
                <span className="ml-1">★</span>
              </div>
              <Button
                className="w-full mt-2 text-sm"
                size="sm"
                onClick={() => router.push(`/restaurants/${selectedMarker.id}`)}
              >
                자세히 보기
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {mode && (
        <Button
          onClick={handleCenterOnUser}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 bg-white shadow-lg hover:bg-gray-100 z-10"
        >
          <MapPin className="h-5 w-5 text-primary" />
        </Button>
      )}
    </div>
  );
}
