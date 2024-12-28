import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const id = url.pathname.split('/')[3];  // /api/restaurants/{id} 에서 id 추출

    if (!id) {
        return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                id: id
            }
        });

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}