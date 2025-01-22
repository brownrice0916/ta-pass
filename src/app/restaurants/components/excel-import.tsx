// components/ExcelImport.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { Upload, AlertCircle } from "lucide-react";

export default function ExcelImport() {
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // 데이터 처리 함수
    const processExcelData = async (file: File) => {
        setImporting(true);
        setError(null);
        setProgress(0);

        try {
            // 파일 읽기
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);

            // 데이터 처리
            const processedRows = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                processedRows.push(await processExcelRow(row));
                setProgress(Math.floor(((i + 1) / rows.length) * 100));
            }

            console.log("Processed Data:", processedRows);


            const formData = new FormData();
            formData.append("data", JSON.stringify(processedRows)); // 여기에 processedRows 데이터를 추가

            const response = await fetch("/api/restaurants/bulk", {
                method: "POST",
                body: formData,  // FormData를 사용
                // headers는 따로 설정할 필요 없음. FormData가 자동으로 설정해줌
            });

            if (!response.ok) {
                throw new Error("서버로 데이터를 전송하는 데 실패했습니다.");
            }

            const result = await response.json();
            console.log("API Response:", result);

        } catch (err) {
            console.error("Error processing file:", err);
            setError("파일 처리 중 오류가 발생했습니다.");
        } finally {
            setImporting(false);
        }
    };

    // 엑셀 데이터 변환 로직
    const processExcelRow = async (row: any) => {
        // languages 처리
        const languages = row.languages?.split(",").map((lang: string) => {
            const langMap: { [key: string]: string } = {
                한국어: "ko",
                영어: "en",
                중국어: "zh",
                일본어: "ja",
            };
            return langMap[lang.trim()] || lang.trim();
        }) || ["ko"];

        // socialLinks 처리
        const socialLinks = processSocialLinks(row.socialLinks);

        // Geocode 처리
        const { lat, lng } = await getGeocode(row.address || "");

        const images = row.images ?
            row.images.split(",").map((url: string) => url.trim()).filter(Boolean)
            : [];


        return {
            name: row.name?.trim(),
            category: row.category?.trim() || "Food",
            description: row.description?.trim() || "",
            about: row.about?.trim() || "",
            languages,
            tags: (row.tags?.split(",").map((tag: string) => tag.trim()) || []).filter(Boolean),
            socialLinks,
            images,
            region1: row.region1?.trim() || "",
            region2: row.region2?.trim() || "",
            region3: row.region3?.trim() || "",
            region4: row.region4?.trim() || "",
            address: row.address?.trim() || "",
            addressDetail: row.addressDetail?.trim() || "",
            latitude: lat,
            longitude: lng,
            specialOfferType: (row.specialOfferType?.split(",").map((tag: string) => tag.trim()) || []).filter(Boolean),
            specialOfferText: row.specialOfferText?.trim() || "",
            specialOfferTextDetail: row.specialOfferTextDetail?.trim() || "",
        };
    };

    // SNS 링크 파싱 함수
    const processSocialLinks = (socialLinksStr: string) => {
        if (!socialLinksStr) return [];
        console.log("Input String:", socialLinksStr);

        try {
            // JSON 형식으로 변환 (이미 따옴표가 포함되어 있다고 가정)
            const formattedStr = `[${socialLinksStr}]`;

            // 문자열 파싱
            const parsedArray = JSON.parse(formattedStr);

            // platform과 url 추출
            return parsedArray.map((link: Record<string, string>) => {
                const [platform, url] = Object.entries(link)[0];
                return {
                    platform: platform.toLowerCase().trim(),
                    url: url.trim(),
                };
            });
        } catch (error) {
            console.error("Error processing social links:", error);
            return [];
        }
    };

    // 주소로 위도/경도 가져오기
    const getGeocode = async (address: string) => {
        const geocoder = new google.maps.Geocoder();
        try {
            const result = await new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        resolve({
                            lat: results[0].geometry.location.lat(),
                            lng: results[0].geometry.location.lng(),
                        });
                    } else {
                        reject(new Error("Geocoding failed"));
                    }
                });
            });
            return result as { lat: number; lng: number };
        } catch {
            return { lat: 37.5665, lng: 126.9780 }; // 기본값 (서울)
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button className="bg-green-600"
                    onClick={() => document.getElementById("excelFile")?.click()}
                    disabled={importing}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    엑셀 파일 선택
                </Button>
                <input
                    id="excelFile"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            processExcelData(file);
                        }
                    }}
                />
            </div>

            {importing && (
                <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-500">처리 중... ({progress}% 완료)</p>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
