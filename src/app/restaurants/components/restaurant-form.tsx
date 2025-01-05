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
import { MapPin, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageUpload from "./image-upload";
import { CATEGORIES } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";
import DaumPostcode from "react-daum-postcode";

const formSchema = z.object({
  // 필수 항목
  category: z.string().min(1, "카테고리를 선택해주세요"),
  name: z.string().min(1, "상호명을 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
  latitude: z.number(),  // .nullable() 제거
  longitude: z.number(), // .nullable() 제거
  languageOptions: z.array(z.string()).min(1, "최소 하나의 언어를 선택해주세요"),

  // 선택 항목
  description: z.string().optional(),
  about: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  specialOfferType: z.enum(["none", "gift", "discount"]).optional(),
  specialOfferText: z.string().optional(),
  images: z.array(z.union([z.instanceof(File), z.string()])).optional(),
  socialLinks: z.array(
    z.object({
      platform: z.string(),
      url: z.string()  // .url() 제거
    })
  ).optional().default([]),  // .default([]) 추가
});
const LANGUAGE_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" },
  { value: "zh", label: "중국어" },
  { value: "ja", label: "일본어" },
];

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter" },
  { value: "blog", label: "Blog" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
];


export type FormValues = z.infer<typeof formSchema>;

interface RestaurantFormProps {
  initialData?: Partial<FormValues> & { id?: string };
  // onSubmit: (data: FormValues) => Promise<void>;
  submitButtonText: string;
}

export default function RestaurantForm({
  initialData,
  // onSubmit,
  submitButtonText,
}: RestaurantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.category || ""
  );
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>(
    initialData?.socialLinks || []
  );
  const addressInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isEditMode = !!initialData;
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialData?.category ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      about: initialData?.about ?? "",
      address: initialData?.address ?? "",
      latitude: initialData?.latitude ?? 37.5665,
      longitude: initialData?.longitude ?? 126.9780,
      rating: initialData?.rating ?? 0,
      specialOfferType: initialData?.specialOfferType ?? "none",
      specialOfferText: initialData?.specialOfferText ?? "",
      images: initialData?.images ?? [],
      languageOptions: initialData?.languageOptions ?? ["ko"],
      socialLinks: initialData?.socialLinks ?? [],

    },
  });

  const { control, setValue, watch } = form;
  const specialOfferType = watch("specialOfferType");


  useEffect(() => {
    if (mapRef.current && typeof google !== "undefined") {
      const defaultLocation = { lat: 37.5665, lng: 126.9780 };

      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 15,
        disableDefaultUI: true,  // 기본 UI 비활성화
        zoomControl: true,      // 줌 컨트롤만 활성화
        mapTypeControl: false,  // 지도 타입 컨트롤 비활성화
        scaleControl: false,    // 스케일 컨트롤 비활성화
        streetViewControl: false, // 스트리트뷰 비활성화
        rotateControl: false,    // 회전 컨트롤 비활성화
        fullscreenControl: false, // 전체화면 컨트롤 비활성화
        clickableIcons: false,   // POI 클릭 비활성화
        styles: [               // POI 라벨 숨기기
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      markerRef.current = new google.maps.Marker({
        map: mapInstance.current,
        position: defaultLocation,
        draggable: true,
      });

      google.maps.event.addListener(markerRef.current, 'dragend', function () {
        const position = markerRef.current?.getPosition();
        if (position) {
          setValue('latitude', position.lat());
          setValue('longitude', position.lng());

          // Reverse geocoding to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setValue('address', results[0].formatted_address);
            }
          });
        }
      });
    }
  }, []);


  const initAutocomplete = () => {
    if (addressInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: "kr" },
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setValue("address", place.formatted_address || "");
          setValue("latitude", lat);
          setValue("longitude", lng);

          if (mapInstance.current && markerRef.current) {
            mapInstance.current.setCenter({ lat, lng });
            markerRef.current.setPosition({ lat, lng });
          }
        }
      });
    }
  };
  useEffect(() => {
    initAutocomplete();
  }, [selectedCategory]);


  const addSocialLink = () => {
    const updatedLinks = [...socialLinks, { platform: "", url: "" }];
    setSocialLinks(updatedLinks);
    setValue("socialLinks", updatedLinks, {
      shouldValidate: true
    });
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(updatedLinks);
    setValue("socialLinks", updatedLinks, {
      shouldValidate: true
    });
  };

  const handleSubmit = async (values: FormValues) => {
    if (!values.name || !selectedCategory) return;

    try {
      setLoading(true);
      const formData = new FormData();

      // 모든 데이터를 포함하여 전송
      const submitData = {
        ...values,
        category: selectedCategory,
        socialLinks: socialLinks,
      };

      formData.append("data", JSON.stringify(submitData));

      // 이미지 처리: File과 URL 문자열을 구분하여 처리
      if (values.images?.length) {
        values.images.forEach((image) => {
          if (image instanceof File) {
            formData.append("images", image);
          } else if (typeof image === "string") {
            formData.append("images", image);
          }
        });
      }

      const url = isEditMode
        ? `/api/restaurants/${initialData.id}`
        : "/api/restaurants";

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isEditMode ? "update" : "add"} restaurant`
        );
      }

      router.push("/restaurants");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Failed to ${isEditMode ? "update" : "add"} restaurant`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(form.getValues())
    console.log("Form state:", form.formState);
    console.log("Form errors:", form.formState.errors);
    console.log(form.formState.isValid)
  }, [form])

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">
        스토어 정보 {initialData ? "수정" : "추가"}
      </h1>
      <div className="bg-[#f3f4f6] p-2">
        <Card className="p-6 pb-16 bg-white rounded-md">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Store Name */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상호명<span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="상호명을 입력하세요" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업종  <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>간단 설명</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="예: 홍대 사진 맛집, 효창동 만두 맛집"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Language Options */}
              <FormField
                control={control}
                name="languageOptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제공 언어 <span className="text-red-500">*</span></FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Button
                          key={lang.value}
                          type="button"
                          variant={field.value?.includes(lang.value) ? "default" : "outline"}
                          onClick={() => {
                            const newValue = field.value?.includes(lang.value)
                              ? field.value.filter((v) => v !== lang.value)
                              : [...(field.value || []), lang.value];
                            field.onChange(newValue);
                          }}
                          className="px-4 py-2"
                        >
                          {lang.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Social Links */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>SNS 및 홈페이지 URL</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    추가하기
                  </Button>
                </div>
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-32">
                      <Select
                        value={link.platform}
                        onValueChange={(value) => {
                          const newLinks = [...socialLinks];
                          newLinks[index].platform = value;
                          setSocialLinks(newLinks);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="URL 입력"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...socialLinks];
                        newLinks[index].url = e.target.value;
                        setSocialLinks(newLinks);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>


              {/* Address Search */}
              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                        <Input
                          {...field}
                          ref={addressInputRef}
                          className="pl-10"
                          placeholder="주소를 검색하세요"
                          onClick={() => setIsAddressModalOpen(true)}
                          readOnly
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAddressModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-4 rounded-lg w-full max-w-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">주소 검색</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddressModalOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <DaumPostcode
                      onComplete={(data) => {
                        setValue('address', data.address);
                        // 주소로 좌표 검색
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode(
                          { address: data.address },
                          (results, status) => {
                            if (status === "OK" && results?.[0]?.geometry?.location) {
                              const lat = results[0].geometry.location.lat();
                              const lng = results[0].geometry.location.lng();
                              setValue('latitude', lat);
                              setValue('longitude', lng);

                              if (mapInstance.current && markerRef.current) {
                                const newLatLng = { lat, lng };
                                mapInstance.current.setCenter(newLatLng);
                                markerRef.current.setPosition(newLatLng);
                              }
                            }
                          }
                        );
                        setIsAddressModalOpen(false);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <div ref={mapRef} className="w-full h-full" />
              </div>






              <FormField
                control={control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>서비스 소개</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="레스토랑 서비스 소개를 입력하세요"
                        className="h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="specialOfferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>특별 혜택 유형</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="특별 혜택 유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        <SelectItem value="gift">Welcome Gift</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {specialOfferType && specialOfferType !== "none" && (
                <FormField
                  control={control}
                  name="specialOfferText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>혜택 내용</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            specialOfferType === "gift"
                              ? "예: 무료 고메기, 무료 포장비닐, 무료 QR CODE"
                              : "예: 오전 11시까지 방문 시 전 메뉴 30% 할인혜택"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Controller
                name="images"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormItem>
                    <FormLabel>이미지 추가 (최대 5개)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        onChange={onChange}
                        value={value || []} // Provide a default value of an empty array
                        error={error}
                      />
                    </FormControl>
                    {error && <FormMessage>{error.message}</FormMessage>}
                  </FormItem>
                )}
              />
              {/* 
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
              )} */}

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
                  disabled={loading || !form.formState.isValid}
                  className="flex-1"
                >
                  {loading ? "처리 중..." : submitButtonText}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}
