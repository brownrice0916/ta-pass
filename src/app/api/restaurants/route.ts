import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
        const data = await request.json();
        const restaurant = await prisma.restaurant.create({
            data: {
                name: data.name,
                address: data.address,
                category: data.category,
                latitude: data.latitude,
                longitude: data.longitude,
                images: [],
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