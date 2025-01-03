import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

interface ReviewFormProps {
  restaurantId: string;
  onReviewAdded: () => void;
}

export function ReviewForm({ restaurantId, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prevImages) => {
      const newImages = [...prevImages, ...files].slice(0, 5);
      return newImages;
    });
  };

  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("rating", rating.toString());
    formData.append("content", content);
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to submit review");

      setContent("");
      setRating(5);
      setImages([]);
      onReviewAdded();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>리뷰 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">별점</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`text-2xl ${
                    value <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">리뷰 내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="리뷰를 작성해주세요"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              사진 추가 (최대 5장)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 5}
            >
              사진 선택
            </Button>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Uploaded ${index + 1}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "작성 중..." : "리뷰 작성"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
