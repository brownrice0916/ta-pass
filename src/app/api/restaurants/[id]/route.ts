import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // id를 쿼리 파라미터에서 가져옵니다.

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
