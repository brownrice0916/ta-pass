"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ReviewForm } from '@/components/review-form';

export default function ReviewPage() {
    const router = useRouter();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const handleRestaurantIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRestaurantId(event.target.value);
    };

    return (
        <div className="container mx-auto p-4 pb-16 max-w-3xl">
            <Button
                variant="outline"
                className="mb-4"
                onClick={() => router.back()}
            >
                뒤로 가기
            </Button>

            <h1 className="text-2xl font-bold mb-4">리뷰 작성</h1>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Restaurant ID를 입력하세요"
                    className="border p-2 rounded"
                    value={restaurantId || ''}
                    onChange={handleRestaurantIdChange}
                />
            </div>

            {restaurantId && (
                <ReviewForm
                    restaurantId={restaurantId}
                    onReviewAdded={() => router.push(`/restaurants/${restaurantId}`)}
                />
            )}
        </div>
    );
}
