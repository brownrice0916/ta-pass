import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

interface ReviewFormProps {
  restaurantId: string;
  onReviewAdded: () => void;
  onClose?: () => void;
}

export function ReviewForm({ restaurantId, onReviewAdded, onClose }: ReviewFormProps) {
  const [step, setStep] = useState(1);
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("rating", rating.toString());
    formData.append("content", content);
    images.forEach((image) => {
      formData.append("images", image);
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
      onClose?.();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (step === 3 && content && images.length > 0) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  if (!session) {
    return null;
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center p-6">
            <h2 className="text-lg font-semibold mb-6">방문은 어떠셨나요?</h2>
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`text-4xl transition-colors ${value <= rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleNextStep}
            >
              다음
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col p-6">
            <h2 className="text-lg font-semibold mb-4">방문후기를 작성해주세요.</h2>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="다른 고객들에게 도움이 되도록 자세한 후기를 남겨주세요 :)"
              className="mb-4 resize-none"
              required
            />
            <div className="text-right text-sm text-gray-500 mb-4">
              {content.length}/3000
            </div>
            <Button
              className="w-full"
              onClick={handleNextStep}
              disabled={!content}
            >
              다음
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col p-6">
            <h2 className="text-lg font-semibold mb-4">
              방문하신 사진이 있다면 공유해주세요 :)
            </h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              ref={fileInputRef}
            />

            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
                {images.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32"
                  >
                    사진 선택하기
                  </Button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square flex items-center justify-center"
                      >
                        +
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                최대 5장까지 업로드 가능합니다
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !images.length}
            >
              {isSubmitting ? "작성 중..." : "작성 완료"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">리뷰 작성</h1>
        {onClose && (
          <button onClick={onClose} className="text-gray-500">
            <X size={24} />
          </button>
        )}
      </div>

      {step === 4 ? (
        <div className="fixed inset-0 flex items-center justify-center bg-white">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary">리뷰 작성 완료!</h2>
            <p className="text-gray-500">소중한 리뷰 감사합니다 :)</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between px-6 pt-4">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center ${stepNumber !== 3 ? "flex-1" : ""
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= stepNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {stepNumber}
                </div>
                {stepNumber !== 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStepContent()}
        </>
      )}
    </div>
  );
}