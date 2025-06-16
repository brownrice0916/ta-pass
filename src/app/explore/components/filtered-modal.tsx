import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";

// FilterModal 컴포넌트 생성
export const FilterModal = ({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}) => {
  const LOCATIONS = [
    { id: "전체", label: "전체" },
    { id: "홍대", label: "홍대" },
    { id: "명동", label: "명동" },
    { id: "인사동", label: "인사동" },
    { id: "강남", label: "강남" },
    { id: "이태원", label: "이태원" },
    { id: "한남", label: "한남" },
    { id: "합정", label: "합정" },
    { id: "성수", label: "성수" },
    { id: "여의도", label: "여의도" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-base font-medium mb-3">지역</h3>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((location) => (
                <Button
                  key={location.id}
                  variant={
                    location.id === selectedLocation ? "default" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedLocation(location.id)}
                >
                  {location.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-medium mb-3">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    category.value === selectedCategory ? "default" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
};
