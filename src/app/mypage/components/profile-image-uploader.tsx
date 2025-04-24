import { Loader2, Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface Props {
  onUploadSuccess?: () => void;
}

const ProfileImageUploader = ({ onUploadSuccess }: Props) => {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/user/update-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      const data = await response.json();

      if (update && session) {
        await update({
          ...session,
          user: { ...session.user, image: data.imageUrl },
        });
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      setUploadError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
      onClick={handleProfileClick}
    >
      {session?.user?.image ? (
        <Image
          src={session.user.image}
          alt="프로필 이미지"
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/100?text=사용자";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-2xl font-semibold">
          {session?.user?.name?.charAt(0) || "U"}
        </div>
      )}

      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <Camera className="text-white w-6 h-6" />
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="text-red-500 text-xs mt-1 absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          {uploadError}
        </p>
      )}
    </div>
  );
};

export default ProfileImageUploader;
