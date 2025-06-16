import { useRef } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onChange: (files: (File | string)[]) => void;
  value: (File | string)[];
  error?: { message?: string };
}

export default function ImageUpload({
  onChange,
  value,
  error,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    onChange(
      [...value.filter((v) => typeof v === "string"), ...newImages].slice(0, 5)
    );
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    onChange(
      [...value.filter((v) => typeof v === "string"), ...files].slice(0, 5)
    );
  };

  return (
    <div>
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          클릭하거나 이미지를 드래그하여 업로드하세요
        </p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (최대 5MB)</p>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      {(value?.length ?? 0) > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {value.map((image, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={image instanceof File ? URL.createObjectURL(image) : image}
                alt={`Preview ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
