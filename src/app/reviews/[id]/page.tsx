"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emojiMap } from "@/lib/tags";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

interface ReviewData {
  id: string;
  content: string;
  rating: number;
  images: string[];
  tags: string[];
  restaurantId: string;
  userId: string;
  restaurant: { id: string; name: string; address: string };
  user: { id: string; name: string; image: string };
  createdAt: string;
}

const ReviewDetailPage = () => {
  const { data: session } = useSession();
  const { language } = useLanguage();
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ----------------- 데이터 로드 ----------------- */
  useEffect(() => {
    if (session?.user?.id) fetchReview();
  }, [reviewId, session?.user?.id]);

  const fetchReview = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`);
      if (res.status === 403) {
        setError(t("reviewDetail.noAccess", language));
        return;
      }
      if (!res.ok) throw new Error(t("reviewDetail.fetchError", language));

      const data = await res.json();
      setSelectedTags(data.tags || []);
      setReview(data);
      setContent(data.content);
      setRating(data.rating);
      setImages(data.images || []);

      if (!session?.user?.id) return;

      // prev / next 계산
      const allRes = await fetch("/api/reviews/me");
      if (allRes.ok) {
        const all = await allRes.json();
        const sorted = all.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const idx = sorted.findIndex((r: any) => r.id === reviewId);
        setNextId(idx > 0 ? sorted[idx - 1]?.id : null);
        setPrevId(idx < sorted.length - 1 ? sorted[idx + 1]?.id : null);
      }
    } catch (e) {
      console.error(e);
      setError(t("reviewDetail.loadError", language));
    }
  };

  /* ----------------- 업데이트 / 삭제 ----------------- */
  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);

      // 새 이미지 업로드
      let uploaded: string[] = [];
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const up = await fetch("/api/upload?kind=reviews", {
          method: "POST",
          body: fd,
        }).then((r) => r.json());
        uploaded = up.map((x: any) => x.url);
      }

      const finalImages = [...images, ...uploaded].slice(0, 5);

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
      if (!res.ok) throw new Error();

      const updated = await res.json();
      setReview(updated);
      setImages(updated.images || []);
      setFiles([]);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError(t("reviewDetail.updateError", language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("reviewDetail.confirmDelete", language))) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/");
    } catch (e) {
      console.error(e);
      setError(t("reviewDetail.deleteError", language));
    }
  };

  /* ----------------- UI 헬퍼 ----------------- */
  const navigateImage = (dir: "prev" | "next") => {
    setCurrentImageIndex((prev) => {
      const total = images.length;
      return dir === "prev" ? (prev - 1 + total) % total : (prev + 1) % total;
    });
  };

  /* ----------------- 렌더 ----------------- */
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!review)
    return <div className="p-4">{t("reviewDetail.loading", language)}</div>;

  const isMine = session?.user?.id?.toString() === review.userId.toString();

  return (
    <div className="bg-white rounded-lg p-4 max-w-md mx-auto mb-20">
      <h1 className="text-lg font-semibold mb-2">{review.restaurant.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{review.restaurant.address}</p>

      {/* 이미지 캐러셀 */}
      {images.length > 0 && (
        <div className="relative mb-4 h-60">
          <Image
            src={images[currentImageIndex]}
            alt="review"
            fill
            className="object-cover rounded"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-1 rounded-full"
              >
                <ChevronLeft className="text-white" />
              </button>
              <button
                onClick={() => navigateImage("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-1 rounded-full"
              >
                <ChevronRight className="text-white" />
              </button>
            </>
          )}
        </div>
      )}

      {/* 태그 영역 */}
      {isEditing ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(emojiMap).map((key) => {
            const selected = selectedTags.includes(key);
            return (
              <button
                key={key}
                onClick={() =>
                  setSelectedTags((prev) =>
                    selected ? prev.filter((t) => t !== key) : [...prev, key]
                  )
                }
                className={`py-2 px-3 rounded-full border text-sm transition-colors ${
                  selected
                    ? "bg-blue-50 border-blue-400 text-blue-600"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                {emojiMap[key]} {t(key, language)}
              </button>
            );
          })}
        </div>
      ) : selectedTags.length ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map((key) => (
            <span
              key={key}
              className="py-1 px-3 rounded-full bg-gray-100 text-sm"
            >
              {emojiMap[key]} {t(key, language)}
            </span>
          ))}
        </div>
      ) : null}

      {/* 본문 / 편집 */}
      {isEditing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          {/* 기존 이미지 썸네일 */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={img}
                  className="w-full h-full object-cover rounded"
                  alt=""
                />
                <button
                  onClick={() =>
                    setImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* 파일 업로드 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setFiles((prev) =>
                [...prev, ...Array.from(e.target.files || [])].slice(
                  0,
                  5 - images.length
                )
              )
            }
          />
          {images.length + files.length < 5 && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("reviewDetail.addPhoto", language)}
            </Button>
          )}

          {/* 새로 선택한 파일 미리보기 */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {files.map((file, i) => (
              <div key={i} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover rounded"
                />
                <button
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, idx) => idx !== i))
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
            {t("reviewDetail.save", language)}
          </button>
        </>
      ) : (
        <p className="mb-4 whitespace-pre-line">{review.content}</p>
      )}

      {/* 수정/삭제 버튼 */}
      {isMine && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 bg-gray-200 rounded"
          >
            {t("reviewDetail.edit", language)}
          </button>
          <button
            onClick={handleDelete}
            className="w-full py-2 bg-red-500 text-white rounded"
          >
            {t("reviewDetail.delete", language)}
          </button>
        </div>
      )}

      {/* 이전/다음 리뷰 네비게이션 */}
      {(prevId || nextId) && (
        <div className="flex justify-between mt-6 text-sm text-blue-600">
          {prevId ? (
            <button
              onClick={() => router.push(`/reviews/${prevId}`)}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} /> {t("reviewDetail.previous", language)}
            </button>
          ) : (
            <div />
          )}
          {nextId ? (
            <button
              onClick={() => router.push(`/reviews/${nextId}`)}
              className="flex items-center gap-1"
            >
              {t("reviewDetail.next", language)} <ChevronRight size={16} />
            </button>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* 제출 중 오버레이 */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <span className="text-blue-600 font-semibold text-sm animate-pulse">
            {t("reviewDetail.updating", language)}
          </span>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default ReviewDetailPage;
