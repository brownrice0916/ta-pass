// 수정/삭제 기능 및 이모지 포함 + 이전/다음 리뷰 이동 + 이미지 캐러셀 + 수정 시 파일 업로드 및 기존 이미지 삭제 포함
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emojiMap } from "@/lib/tags";

interface ReviewData {
  id: string;
  content: string;
  rating: number;
  images: string[];
  tags: string[];
  restaurantId: string;
  userId: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  user: {
    id: string;
    name: string;
    image: string;
  };
  createdAt: string;
}

const ReviewDetailPage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [review, setReview] = useState<ReviewData | null>(null);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 추가

  const fileInputRef = useRef<HTMLInputElement>(null);
  // 리뷰 불러올 때 초기화
  useEffect(() => {
    if (session?.user?.id) {
      fetchReview();
    }
  }, [reviewId, session?.user?.id]);

  const fetchReview = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`);
      if (res.status === 403) {
        setError("해당 리뷰에 접근할 수 없습니다.");
        return;
      }
      if (!res.ok) throw new Error("리뷰 정보를 불러오지 못했습니다.");
      const data = await res.json();
      setSelectedTags(data.tags || []);
      setReview(data);
      setContent(data.content);
      setRating(data.rating);
      setImages(data.images || []);

      if (!session?.user?.id) return;

      const allRes = await fetch("/api/reviews/me");
      if (allRes.ok) {
        const allReviews = await allRes.json();
        const sorted = allReviews.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const idx = sorted.findIndex((r: any) => r.id === reviewId);
        if (idx >= 0) {
          setNextId(idx > 0 ? sorted[idx - 1]?.id : null);
          setPrevId(idx < sorted.length - 1 ? sorted[idx + 1]?.id : null);
        } else {
          setNextId(null);
          setPrevId(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError("리뷰 로드 실패");
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);

      let uploadedImageUrls: string[] = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/upload?kind=reviews", {
          method: "POST",
          body: formData,
        });
        const uploaded = await res.json();
        uploadedImageUrls = uploaded.map((img: any) => img.url);
      }

      const finalImages = [...images, ...uploadedImageUrls].slice(0, 5);

      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          rating,
          tags: selectedTags,
          images: finalImages,
        }),
      });
      if (!res.ok) throw new Error("수정 실패");
      const updated = await res.json();
      setReview(updated);
      setImages(updated.images || []);
      setFiles([]);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("수정 중 오류");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const confirmed = window.confirm("삭제하시겠습니까?");
      if (!confirmed) return;
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("삭제 중 오류");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const navigateImage = (dir: "prev" | "next") => {
    if (!images) return;
    setCurrentImageIndex((prev) => {
      const total = images.length;
      return dir === "prev" ? (prev - 1 + total) % total : (prev + 1) % total;
    });
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchReview();
    }
  }, [reviewId, session?.user?.id]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!review) return <div className="p-4">로딩 중...</div>;

  const isMine = session?.user?.id?.toString() === review.userId.toString();

  return (
    <div className="bg-white rounded-lg p-4 max-w-md mx-auto mb-20">
      <h1 className="text-lg font-semibold mb-2">{review.restaurant.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{review.restaurant.address}</p>

      {images.length > 0 && (
        <div className="relative mb-4 h-60">
          <Image
            src={images[currentImageIndex]}
            alt="리뷰 이미지"
            fill
            className="object-cover rounded"
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-1 rounded-full"
                onClick={() => navigateImage("prev")}
              >
                <ChevronLeft className="text-white" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-1 rounded-full"
                onClick={() => navigateImage("next")}
              >
                <ChevronRight className="text-white" />
              </button>
            </>
          )}
        </div>
      )}
      {isEditing ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(emojiMap).map((tag) => {
            const removeEmoji = (str: string) =>
              str.replace(/^[^\p{L}\p{N}]+/u, "").trim();

            const isSelected = selectedTags.some(
              (selected) => removeEmoji(selected) === tag
            );
            return (
              <button
                key={tag}
                type="button"
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  border: "1px solid",
                  borderColor: isSelected ? "#60a5fa" : "#e5e7eb",
                  backgroundColor: isSelected ? "#dbeafe" : "white",
                  color: isSelected ? "#2563eb" : "#4b5563",
                  transition: "all 0.2s",
                }}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
              >
                {emojiMap[tag]} {tag}
              </button>
            );
          })}
        </div>
      ) : selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
              }}
            >
              {emojiMap[tag]} {tag}
            </span>
          ))}
        </div>
      ) : null}

      {isEditing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={img}
                  className="w-full h-full object-cover rounded"
                  alt={`existing-${idx}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={(e) =>
              setFiles((prev) =>
                [...prev, ...Array.from(e.target.files || [])].slice(
                  0,
                  5 - images.length
                )
              )
            }
            className="mb-2 hidden"
          />

          {images.length + files.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 w-full"
            >
              사진 추가하기
            </Button>
          )}

          <div className="grid grid-cols-3 gap-2 mb-2">
            {files.map((file, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 text-white rounded"
          >
            저장
          </button>
        </>
      ) : (
        <p className="mb-4 whitespace-pre-line">{review.content}</p>
      )}

      {isMine && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 bg-gray-200 rounded"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="w-full py-2 bg-red-500 text-white rounded"
          >
            삭제
          </button>
        </div>
      )}

      {(prevId || nextId) && (
        <div className="flex justify-between mt-6 text-sm text-blue-600">
          {prevId ? (
            <button
              onClick={() => router.push(`/reviews/${prevId}`)}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} /> 이전 리뷰
            </button>
          ) : (
            <div />
          )}
          {nextId ? (
            <button
              onClick={() => router.push(`/reviews/${nextId}`)}
              className="flex items-center gap-1"
            >
              다음 리뷰 <ChevronRight size={16} />
            </button>
          ) : (
            <div />
          )}
        </div>
      )}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <span className="text-blue-600 font-semibold text-sm animate-pulse">
            저장 중입니다...
          </span>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default ReviewDetailPage;
