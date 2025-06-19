export const CATEGORIES = [
  { id: "all", label: "All", value: "all" },
  {
    id: "fashion",
    label: "fashion",
    value: "fashion",
    types: ["clothing_store", "shopping_mall"],
  },
  {
    id: "beauty",
    label: "beauty",
    value: "beauty",
    types: ["beauty_salon", "hair_care"],
  },
  {
    id: "luxury",
    label: "luxury",
    value: "luxury",
    types: ["jewelry_store", "shopping_mall"],
  },
  {
    id: "activities",
    label: "activities",
    value: "activities",
    types: ["gym", "park", "amusement_park"],
  },
  {
    id: "culture",
    label: "culture",
    value: "culture",
    types: ["museum", "art_gallery", "movie_theater"],
  },
  { id: "food", label: "food", value: "food", types: ["restaurant", "cafe"] },
];
export const TAG_KEYS = [
  "tag_satisfaction",
  "tag_kindness",
  "tag_value",
  "tag_easyToFind",
  "tag_localVibe",
  "tag_revisit",
  "tag_benefit",
  "tag_unique",
  "tag_photoSpot",
  "tag_recommend",
] as const;
