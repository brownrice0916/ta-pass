import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { restaurantId, rating, content } = body;

        const review = await prisma.review.create({
            data: {
                rating,
                content,
                userId: Number(session.user.id),
                restaurantId,
            },
            include: {
                user: true,
            },
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}