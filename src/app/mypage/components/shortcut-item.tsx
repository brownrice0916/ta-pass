"use client";

// ShortcutItem 컴포넌트 타입 정의
interface ShortcutItemProps {
  icon: string;
  label: string;
  link: string;
  comingSoon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

// ShortcutItem 컴포넌트
export const ShortcutItem = ({
  icon,
  label,
  link,
  comingSoon,
  onClick,
}: ShortcutItemProps) => (
  <a
    href={link}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center text-center p-4 hover:bg-gray-50 rounded-lg transition-colors ${
      comingSoon ? "cursor-default" : ""
    }`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-sm">{label}</p>
    {comingSoon && (
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-medium px-2 py-1 bg-blue-600 rounded">
          준비중
        </span>
      </div>
    )}
  </a>
);
