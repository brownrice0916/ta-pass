import { t } from "@/lib/i18n";

export const categoryMap = {
  맛집: "food",
  쇼핑: "shopping",
  체험: "activities",
  웰니스: "wellness",
  나이트라이프: "nightlife",
} as any;

export const getCategoryList = (language: string) => [
  { id: "전체", label: t("explore.category.all", language) },
  { id: "맛집", label: t("explore.category.food", language) },
  { id: "쇼핑", label: t("explore.category.shopping", language) },
  { id: "체험", label: t("explore.category.activities", language) },
  { id: "웰니스", label: t("explore.category.wellness", language) },
  { id: "나이트라이프", label: t("explore.category.nightlife", language) },
];

export const getSubCategoryList = (korMain: string, lang: string) => {
  // Always include "전체" (All) as first option
  const allOption = { id: "전체", label: t("explore.subCategory.전체", lang) };

  // If main category is "전체", only return the "전체" option
  if (korMain === "전체") {
    return [allOption];
  }

  const map = subCategoryMap[korMain];
  if (!map) return [allOption]; // Fallback to just "전체" if mapping not found

  const subCategories = Object.keys(map)
    .filter((key) => key !== "전체") // Exclude "전체" from mapping since we add it manually
    .map((korLabel) => ({
      id: korLabel,
      code: map[korLabel],
      label: t(`explore.subCategory.${korLabel}`, lang),
    }));

  return [allOption, ...subCategories];
};

export const subCategoryMap = {
  맛집: {
    전체: "all",
    한식: "korean",
    분식: "snack",
    "카페/디저트": "cafe",
    고기구이: "bbq",
    해산물: "seafood",
    "채식/비건": "vegan",
    "바/펍": "bar",
    "다국적/퓨전": "fusion",
    패스트푸드: "fastfood",
  },
  쇼핑: {
    전체: "all",
    "패션/의류": "fashion",
    "화장품/뷰티": "beauty",
    "기념품/특산품": "souvenir",
    "백화점/쇼핑몰": "department",
  },
  체험: {
    전체: "all",
    한복체험: "hanbok",
    클래스: "class",
    공예체험: "craft",
    "콘서트 & 공연": "concert",
    "야외 액티비티": "outdoor",
    케이팝: "kpop",
    "궁/왕궁": "palace",
    "박물관/미술관": "museum",
    "전망대/스카이뷰": "skyview",
    테마파크: "themepark",
  },
  웰니스: {
    전체: "all",
    "스파/마사지": "spa",
    "요가/명상": "yoga",
    뷰티케어: "beautycare",
  },
  나이트라이프: {
    전체: "all",
    클럽: "club",
    루프탑바: "rooftop",
    "재즈바/공연바": "jazzbar",
    "포장마차/포차": "pocha",
  },
} as any;
export const regions = [
  { id: "지역 전체", name: "지역 전체" },
  { id: "명동", name: "명동" },
  { id: "강남", name: "강남" },
  { id: "종로/인사동", name: "종로/인사동" },
  { id: "경복궁/북촌", name: "경복궁/북촌" },
  { id: "삼청동", name: "삼청동" },
  { id: "서촌", name: "서촌" },
  { id: "이태원", name: "이태원" },
  { id: "한남동", name: "한남동" },
  { id: "압구정/청담", name: "압구정/청담" },
  { id: "홍대", name: "홍대" },
  { id: "연남", name: "연남" },
  { id: "합정", name: "합정" },
  { id: "망원", name: "망원" },
  { id: "성수", name: "성수" },
  { id: "여의도", name: "여의도" },
  { id: "잠실", name: "잠실" },
  { id: "기타", name: "기타" },
];

export const getRegions = (language: string) => [
  { id: "지역 전체", name: t("explore.region.지역 전체", language) },
  { id: "명동", name: t("explore.region.명동", language) },
  { id: "강남", name: t("explore.region.강남", language) },
  { id: "종로/인사동", name: t("explore.region.종로/인사동", language) },
  { id: "경복궁/북촌", name: t("explore.region.경복궁/북촌", language) },
  { id: "삼청동", name: t("explore.region.삼청동", language) },
  { id: "서촌", name: t("explore.region.서촌", language) },
  { id: "이태원", name: t("explore.region.이태원", language) },
  { id: "한남동", name: t("explore.region.한남동", language) },
  { id: "압구정/청담", name: t("explore.region.압구정/청담", language) },
  { id: "홍대", name: t("explore.region.홍대", language) },
  { id: "연남", name: t("explore.region.연남", language) },
  { id: "합정", name: t("explore.region.합정", language) },
  { id: "망원", name: t("explore.region.망원", language) },
  { id: "성수", name: t("explore.region.성수", language) },
  { id: "여의도", name: t("explore.region.여의도", language) },
  { id: "잠실", name: t("explore.region.잠실", language) },
  { id: "기타", name: t("explore.region.기타", language) },
];
