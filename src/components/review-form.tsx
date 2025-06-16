import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";

interface ReviewFormProps {
  restaurantId: string;
  onReviewAdded: () => void;
  onClose?: () => void;
}

// 이모지 매핑 객체 생성

export function ReviewForm({
  restaurantId,
  onReviewAdded,
  onClose,
}: ReviewFormProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { language } = useLanguage();

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

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
    // Skip submission if no tags selected
    if (selectedTags.length === 0) {
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("rating", rating.toString());
    // Content is now optional from the screenshot
    if (content.trim()) {
      formData.append("content", content);
    } else {
      formData.append("content", ""); // Send empty string if no content
    }

    // Add selected tags as JSON string
    formData.append("tags", JSON.stringify(selectedTags));

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
      setSelectedTags([]);
      setStep(4); // Show success screen

      // Call onReviewAdded after a delay to update the parent component
      setTimeout(() => {
        onReviewAdded();
        // Only close after showing success message for a moment
        setTimeout(() => {
          onClose?.();
        }, 2000);
      }, 500);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (step === 3) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  if (!session?.user) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold mb-4">
          {t("reviewForm.loginRequired", language)}
        </h2>
        <Button
          onClick={() => (window.location.href = "/api/auth/signin")}
          className="w-full"
        >
          {t("reviewForm.loginButton", language)}
        </Button>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center p-6">
            <h2 className="text-lg font-semibold mb-6">
              {t("reviewForm.step1.title", language)}
            </h2>
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`text-4xl transition-colors ${
                    value <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => setRating(value)}
                  aria-label={`별점 ${value}점`}
                >
                  ★
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={handleNextStep}>
              {t("reviewForm.step1.next", language)}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">
              {t("reviewForm.step2.title", language)}
            </h2>
            <div className="text-sm text-gray-600 mb-6 center ">
              {t("reviewForm.step2.desc", language)} <br />
              {/* 좋았던 점을 1개 이상 선택해 주세요. */}
            </div>

            <div className="flex flex-wrap gap-2 mb-10 px-5 ">
              {[
                { text: "😍 완전 마음에 들었어요!" },
                { text: "😊 친절했어요" },
                { text: "💰 가성비 최고였어요" },
                { text: "📍 찾기 쉬웠어요" },
                { text: "✨ 진짜 로컬 느낌이에요" },
                { text: "🔁 또 방문하고 싶어요" },
                { text: "🎁 혜택을 잘 받았어요" },
                { text: "🛍️ 상품 구성이 독특했어요" },
                { text: "📸 사진 찍기 좋은 곳이었어요" },
                { text: "📢 다른 사람에게도 추천하고 싶어요" },
              ].map((tag) => {
                // 글자수에 따라 레이아웃 결정 (이모지 제외하고 계산)
                const textWithoutEmoji = tag.text
                  .replace(/\p{Emoji}/gu, "")
                  .trim();
                const isLongText = textWithoutEmoji.length > 14;

                return (
                  <button
                    key={tag.text}
                    type="button"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: selectedTags.includes(tag.text)
                        ? "#60a5fa"
                        : "#e5e7eb",
                    }}
                    className={`py-2 px-3 rounded-full border text-sm ${
                      selectedTags.includes(tag.text)
                        ? "bg-blue-50 border-blue-400 text-blue-600"
                        : "border-gray-200 text-gray-700"
                    } ${isLongText ? "" : ""}`}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag.text)
                          ? prev.filter((t) => t !== tag.text)
                          : [...prev, tag.text]
                      );
                    }}
                  >
                    {tag.text}
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full"
              onClick={handleNextStep}
              disabled={selectedTags.length === 0}
            >
              {t("reviewForm.step1.next", language)} <br />
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("reviewForm.step3.title", language)} <br />
            </h2>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder={t("reviewForm.step3.placeholder", language)}
              className="mb-4 resize-none"
              style={{
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "#e5e7eb",
              }}
            />
            <div className="text-right text-sm text-gray-500 mb-4">
              {content.length}/3000
            </div>

            <h2 className="text-lg font-semibold mb-4">
              {t("reviewForm.step3.photosTitle", language)}
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
                    {t("reviewForm.step3.upload", language)}
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
              <p className="text-sm text-gray-500 text-right">
                {t("reviewForm.step3.maxPhotos", language)}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("reviewForm.submitting", language)
                : t("reviewForm.submit", language)}
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
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevStep}
              className="hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          )}
          <h1 className="text-xl font-bold">
            {t("reviewForm.title", language)}
          </h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500">
            <X size={24} />
          </button>
        )}
      </div>

      {step === 4 ? (
        <div className="p-10 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-blue-600"
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
            <h2 className="text-2xl font-bold text-blue-600">
              {t("reviewForm.complete.title", language)}
            </h2>
            <p className="text-gray-500">
              {" "}
              {t("reviewForm.complete.desc", language)}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between px-6 pt-4">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center ${
                  stepNumber !== 3 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber !== 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
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
