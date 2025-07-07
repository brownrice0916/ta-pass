"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Search, ChevronDown, Bookmark } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import {
  categoryMap,
  getCategoryList,
  getRegions,
  getSubCategoryList,
  subCategoryMap,
} from "@/types/category";
import { useLanguage } from "@/context/LanguageContext";
import { cx } from "class-variance-authority";
import { t } from "@/lib/i18n";

const Category = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 상태 관리
  const [activeMainCategory, setActiveMainCategory] = useState("전체");
  const [activeRegion, setActiveRegion] = useState("지역 전체");
  const [activeSubcategory, setActiveSubcategory] = useState("전체");
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState("distance");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const { language } = useLanguage();

  // 컴포넌트 마운트 시 URL 파라미터 처리
  useEffect(() => {
    // URL 파라미터 가져오기
    const engCategory = searchParams.get("category") || "";
    const engSubCategory = searchParams.get("subCategory") || "all";
    const region = searchParams.get("region") || "지역 전체";

    // URL에서 가져온 값으로 상태 업데이트
    updateStateFromUrlParams(engCategory, engSubCategory, region);

    // 첫 번째 로드 후 false로 설정
    isFirstLoad.current = false;
  }, []);

  // URL 파라미터 변경 감지 및 처리
  useEffect(() => {
    if (!isFirstLoad.current) {
      const engCategory = searchParams.get("category") || "";
      const engSubCategory = searchParams.get("subCategory") || "all";
      const region = searchParams.get("region") || "지역 전체";

      updateStateFromUrlParams(engCategory, engSubCategory, region);
    }
  }, [searchParams]);

  // URL 파라미터에서 상태 업데이트 및 데이터 가져오기
  const updateStateFromUrlParams = (
    engCategory: any,
    engSubCategory: any,
    region: any
  ) => {
    // 영어 카테고리에서 한글 카테고리 찾기
    const korCategory =
      Object.keys(categoryMap).find(
        (key) => categoryMap[key] === engCategory
      ) || "전체";

    // 영어 서브카테고리에서 한글 서브카테고리 찾기
    const korSubCategory =
      korCategory !== "전체"
        ? Object.keys(subCategoryMap[korCategory] || {}).find(
            (key) => subCategoryMap[korCategory][key] === engSubCategory
          ) || "전체"
        : "전체";

    const sortParam = searchParams.get("sort") || "distance";
    setSort(sortParam);
    // 상태 업데이트
    setActiveMainCategory(korCategory);
    setActiveSubcategory(korSubCategory);
    setActiveRegion(region);
    setPage(1);

    // 데이터 가져오기
    fetchLocations(
      false,
      engCategory,
      engSubCategory,
      region,
      sortParam as any
    );
  };

  // 데이터 가져오기 함수
  const fetchLocations = async (
    loadMore = false,
    overrideCategory = null,
    overrideSubCategory = null,
    overrideRegion = null,
    overrideSort = null
  ) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // API 파라미터 구성
      const params = new URLSearchParams();

      const sortOption = overrideSort || sort;
      params.append("sort", sortOption);
      // 카테고리 파라미터 (override 또는 현재 상태 사용)
      const category =
        overrideCategory ||
        (activeMainCategory !== "전체" ? categoryMap[activeMainCategory] : "");
      if (category) {
        params.append("category", category);
      }

      // 서브카테고리 파라미터
      const mainCat = overrideCategory
        ? Object.keys(categoryMap).find(
            (key) => categoryMap[key] === overrideCategory
          ) || "전체"
        : activeMainCategory;

      const subCat =
        overrideSubCategory ||
        (mainCat !== "전체" && activeSubcategory !== "전체"
          ? subCategoryMap[mainCat]?.[activeSubcategory]
          : null);

      if (subCat && subCat !== "all") {
        params.append("subCategory", subCat);
      }

      // 검색어 파라미터
      if (searchQuery) {
        params.append("q", searchQuery);
      }

      // 지역 파라미터
      const region = overrideRegion || activeRegion;
      if (region && region !== "지역 전체") {
        params.append("region", region);
      }

      // 페이지네이션 파라미터
      if (loadMore) {
        params.append("page", String(page + 1));
      } else {
        params.append("page", "1");
      }

      // API 호출
      const apiUrl = `/api/category?${params.toString()}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // 데이터 상태 업데이트
      if (loadMore) {
        setLocations((prev) => [...prev, ...(data.restaurants || [])] as any);
      } else {
        setLocations(data.restaurants || []);
      }

      setHasMore(data.metadata?.hasMore || false);
      if (loadMore) {
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      // 조용히 오류 처리
    } finally {
      setIsLoading(false);
    }
  };

  // URL 업데이트 함수
  const updateQueryParams = (key: any, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "sort") {
      params.set(key, value);
    }
    if (value === "전체") {
      params.delete(key);
    } else {
      if (key === "category") {
        params.set(key, categoryMap[value] || value);
      } else if (key === "subCategory" && activeMainCategory !== "전체") {
        params.set(key, subCategoryMap[activeMainCategory]?.[value] || value);
      } else {
        params.set(key, value);
      }
    }

    router.push(`?${params.toString()}`);
  };

  // 카테고리 변경 핸들러
  const handleMainCategoryClick = (categoryId: string) => {
    setActiveMainCategory(categoryId);
    setActiveSubcategory("전체");

    // URL 파라미터 업데이트 (메인 카테고리와 서브카테고리 동시에)
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId === "전체") {
      params.delete("category");
      params.delete("subCategory"); // 메인 카테고리가 '전체'면 서브카테고리도 제거
    } else {
      params.set("category", categoryMap[categoryId] || categoryId);
      params.set("subCategory", "all"); // 서브카테고리를 항상 'all'로 설정
    }

    router.push(`?${params.toString()}`);
    setShowCategoryDropdown(false);
  };

  const handleSubcategoryClick = (subCategoryId: string) => {
    setActiveSubcategory(subCategoryId);

    if (activeMainCategory !== "전체") {
      const engSubCategory =
        subCategoryMap[activeMainCategory]?.[subCategoryId] || "all";
      updateQueryParams("subCategory", engSubCategory);
    } else {
      updateQueryParams("subCategory", "all");
    }
  };

  const handleRegionClick = (name: any) => {
    setActiveRegion(name);
    updateQueryParams("region", name);
  };

  // 더 많은 데이터 로드
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchLocations(true);
    }
  };

  // 검색 핸들러
  const handleSearch = (e: any) => {
    e.preventDefault();
    setShowSearch(false);
    setPage(1);
    fetchLocations();
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    window.history.back();
  };

  // 외부 클릭 핸들러
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get current category display name
  const getCurrentCategoryDisplayName = () => {
    const categoryList = getCategoryList(language);
    const currentCategory = categoryList.find(
      (cat) => cat.id === activeMainCategory
    );
    return currentCategory ? currentCategory.label : activeMainCategory;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white py-3 px-4 flex items-center justify-between shadow-sm relative z-20">
        <ChevronLeft
          className="w-6 h-6 mr-2 cursor-pointer"
          onClick={handleBack}
        />
        <div className="flex items-center">
          <div
            className="flex items-center cursor-pointer space-x-1"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            ref={dropdownRef}
          >
            <span className="font-medium text-lg leading-none">
              {getCurrentCategoryDisplayName()}
            </span>
            <ChevronDown className="w-5 h-5" />
            {/* 카테고리 드롭다운 */}
            {showCategoryDropdown && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-white rounded-md shadow-lg py-2 w-40">
                {getCategoryList(language).map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleMainCategoryClick(cat.id)}
                    className={cx("px-4 py-2 cursor-pointer", {
                      "bg-blue-50 text-blue-500": activeMainCategory === cat.id,
                      "text-gray-700 hover:bg-gray-50":
                        activeMainCategory !== cat.id,
                    })}
                  >
                    {cat.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 검색 버튼 / 폼 */}
        <div ref={searchRef}>
          {showSearch ? (
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색"
                className="pl-8 pr-2 py-1 rounded-full border border-gray-300 text-sm"
                autoFocus
              />
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </form>
          ) : (
            <Search
              className="w-6 h-6 cursor-pointer"
              onClick={() => setShowSearch(true)}
            />
          )}
        </div>
      </div>

      {/* 하위 카테고리 탭 */}
      <div className="bg-white px-4 py-2 flex space-x-4 overflow-x-auto border-b">
        {getSubCategoryList(activeMainCategory, language).map((sub: any) => (
          <div
            key={sub.id}
            onClick={() => handleSubcategoryClick(sub.id)}
            className={cx(
              "px-3 py-1 whitespace-nowrap cursor-pointer text-sm",
              {
                "text-blue-500 border-b-2 border-blue-500 font-medium":
                  activeSubcategory === sub.id,
                "text-gray-700 hover:text-gray-900":
                  activeSubcategory !== sub.id,
              }
            )}
          >
            {sub.label}
          </div>
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 지역 사이드바 */}
        <div className="w-32 bg-white border-r overflow-y-auto">
          <div>
            {getRegions(language).map((region) => (
              <div
                key={region.id}
                className={`py-3 px-4 cursor-pointer ${
                  activeRegion === region.name
                    ? "text-blue-500 font-medium text-sm"
                    : "text-gray-700 hover:bg-gray-50 text-sm"
                }`}
                onClick={() => handleRegionClick(region.name)}
              >
                {region.name}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 정렬 옵션 */}
          <div className="bg-white px-4 py-2 border-b flex justify-end">
            <select
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value;
                setSort(newSort);
                updateQueryParams("sort", newSort);
              }}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="distance">{t("sort.distance", language)}</option>
              <option value="rating">{t("sort.rating", language)}</option>
              <option value="bookmark">{t("sort.bookmark", language)}</option>
              <option value="review">{t("sort.review", language)}</option>
            </select>
          </div>

          {/* 장소 목록 */}
          <div
            className="flex-1 overflow-y-auto p-2 bg-gray-100"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (scrollHeight - scrollTop <= clientHeight * 1.5) {
                loadMore();
              }
            }}
          >
            {locations.length > 0 ? (
              locations.map((location: any) => (
                <div
                  onClick={() => {
                    router.push(`/explore/${location.id}`);
                  }}
                  key={location.id}
                  className="bg-white rounded-lg mb-2 p-4 flex"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                    {location.images && location.images.length > 0 ? (
                      <img
                        src={location.images[0]}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src="/api/placeholder/80/80"
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{location.name}</h3>
                        <p className="text-gray-600 text-xs mt-1">
                          {location.address}
                        </p>
                        <span className="px-2 text-xs py-0.5 bg-gray-100 text-blue-800 rounded-full">
                          {location.category}
                        </span>
                        <p className="text-sm text-gray-700 flex items-center space-x-4 mt-2">
                          <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>{location.rating?.toFixed(1) ?? "0.0"}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Bookmark className="w-4 h-4 text-pink-500" />
                            <span>{location.bookmarkCount}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            <span>{location.reviewCount}</span>
                          </span>
                        </p>
                      </div>
                      <Bookmark className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              ))
            ) : isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32">
                <p className="text-gray-500">
                  {t("search.noResult", language)}
                </p>
              </div>
            )}

            {/* 로딩 인디케이터 */}
            {isLoading && page > 1 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
