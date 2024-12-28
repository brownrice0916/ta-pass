import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";

interface ReviewFormProps {
    restaurantId: string;
    onReviewAdded: () => void;
}

export function ReviewForm({ restaurantId, onReviewAdded }: ReviewFormProps) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log(restaurantId, rating, content)

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    rating,
                    content,
                }),
            });

            if (!response.ok) throw new Error('Failed to submit review');

            setContent('');
            setRating(5);
            onReviewAdded();
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>리뷰 작성</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            별점
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`text-2xl ${value <= rating ? 'text-yellow-500' : 'text-gray-300'
                                        }`}
                                    onClick={() => setRating(value)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            리뷰 내용
                        </label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            placeholder="리뷰를 작성해주세요"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? '작성 중...' : '리뷰 작성'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}