import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("latitude") || "0");
    const lng = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "1");

    try {
        const restaurants = await prisma.restaurant.findMany();
        return NextResponse.json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return NextResponse.json(
            { error: "Failed to fetch restaurants" },
            { status: 500 }
        );
    }
}


export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const placeDataStr = formData.get('data') as string;
        const imageFiles = formData.getAll('images') as File[];

        if (!placeDataStr) {
            return NextResponse.json(
                { error: "No place data provided" },
                { status: 400 }
            );
        }

        const placeData = JSON.parse(placeDataStr);

        // Upload each image and get URLs
        const imageUrls = await Promise.all(
            imageFiles.map(async (file) => {
                // Generate a unique filename using timestamp and original filename
                const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
                const blob = await put(`restaurants/${filename}`, file, {
                    access: 'public',
                });
                return blob.url;
            })
        );

        // Create restaurant with image URLs
        const restaurant = await prisma.restaurant.create({
            data: {
                name: placeData.name,
                address: placeData.address,
                category: placeData.category,
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                rating: placeData.rating || 0,
                images: imageUrls, // Save array of image URLs
            },
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error("Error creating restaurant:", error);
        return NextResponse.json(
            { error: "Failed to create restaurant" },
            { status: 500 }
        );
    }
}
