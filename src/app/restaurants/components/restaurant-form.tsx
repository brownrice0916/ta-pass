"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageUpload from "./image-upload";
import { CATEGORIES } from "@/lib/constants";

const formSchema = z.object({
  category: z.string().min(1, "카테고리를 선택해주세요"),
  name: z.string().min(1, "장소 이름을 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().min(0).max(5),
  images: z
    .array(z.instanceof(File))
    .min(1, "최소 1개의 이미지를 업로드해주세요"),
});

export type FormValues = z.infer<typeof formSchema>;

interface RestaurantFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  submitButtonText: string;
}

export default function RestaurantForm({
  initialData,
  onSubmit,
  submitButtonText,
}: RestaurantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.category || ""
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialData?.category || "",
      name: initialData?.name || "",
      address: initialData?.address || "",
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      rating: initialData?.rating || 0,
      images: initialData?.images || [],
    },
  });

  const { control, setValue, watch } = form;

  const initAutocomplete = () => {
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    if (inputRef.current && window.google) {
      const selectedCategoryTypes = CATEGORIES.find(
        (cat) => cat.value === selectedCategory
      )?.types || ["establishment"];

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["name", "formatted_address", "geometry", "rating", "types"],
          types: selectedCategoryTypes,
          componentRestrictions: { country: "kr" },
        }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setValue("name", place.name || "");
          setValue("address", place.formatted_address || "");
          setValue("latitude", lat);
          setValue("longitude", lng);
          setValue("rating", place.rating || 0);
        }
      });
    }
  };

  useEffect(() => {
    initAutocomplete();
  }, [selectedCategory]);

  const handleSubmit = async (values: FormValues) => {
    if (!values.name || !selectedCategory) return;

    try {
      setLoading(true);
      await onSubmit(values);
      router.push("/restaurants");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          레스토랑 정보 {initialData ? "수정" : "추가"}
        </h1>
        <p className="text-muted-foreground">
          {initialData
            ? "레스토랑 정보를 수정하고 저장하세요"
            : "카테고리를 선택하고 장소를 검색하여 추가하세요"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedCategory(value);
                    if (inputRef.current) {
                      inputRef.current.value = "";
                    }
                    form.reset({
                      name: "",
                      address: "",
                      category: value,
                      latitude: 0,
                      longitude: 0,
                      rating: 0,
                      images: [],
                    });
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.filter((cat) => cat.value !== "all").map(
                      (category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>장소 검색</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                    <Input
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        inputRef.current = e;
                      }}
                      className="pl-10"
                      placeholder="장소 이름이나 주소를 검색하세요"
                      disabled={!selectedCategory}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            name="images"
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>이미지 추가 (최대 5개)</FormLabel>
                <FormControl>
                  <ImageUpload
                    onChange={onChange}
                    value={value}
                    error={error}
                  />
                </FormControl>
                {error && <FormMessage>{error.message}</FormMessage>}
              </FormItem>
            )}
          />

          {watch("name") && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-medium">선택된 장소 정보</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">이름:</span> {watch("name")}
                </p>
                <p>
                  <span className="font-medium">주소:</span> {watch("address")}
                </p>
                <p>
                  <span className="font-medium">카테고리:</span>{" "}
                  {CATEGORIES.find((cat) => cat.value === selectedCategory)
                    ?.label || "정보 없음"}
                </p>
                <p>
                  <span className="font-medium">위도:</span>{" "}
                  {watch("latitude")?.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">경도:</span>{" "}
                  {watch("longitude")?.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">평점:</span>{" "}
                  {watch("rating")?.toFixed(1)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/restaurants")}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isValid || loading}
              className="flex-1"
            >
              {loading ? "처리 중..." : submitButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
